import { useState, useCallback, useRef } from "react";

// API base URL:
// - in Docker / production, the frontend is served by the backend, so "/api" works by default
// - in local dev, VITE_API_URL can be set to point to a separate backend instance
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Core analysis hook.
 *
 * Responsibilities:
 * - own the request lifecycle (start → success/error → finish)
 * - expose loading + error state to the UI
 * - keep the latest successful result cached for consumers
 * - cancel in‑flight requests when a new one starts
 *
 * @returns {{analyzeUrl: (url: string) => Promise<object|null>, loading: boolean, errorMessage: string|null, result: object|null}} Hook API for analysis requests
 */
export function useWebsiteAnalysis() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [result, setResult] = useState(null);

  const abortRef = useRef(null);

  const analyzeUrl = useCallback(async (url) => {
    // Cancel any in‑flight analysis so we don't race multiple responses.
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        url,
        pretty: "true",
      });

      const response = await fetch(`${API_BASE_URL}/analyze?${params}`, {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
      });

      // Check 503 before attempting to parse JSON: a load-balancer or gateway
      // timeout returns 503 with a non-JSON body, so parsing first would throw
      // an unhelpful "unexpected token" SyntaxError instead of this message.
      if (response.status === 503) {
        throw new Error("The server is busy — please try again in a moment.");
      }

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        // Backend already normalizes error messages; prefer those where available.
        throw new Error(data?.error || "Analysis failed");
      }

      setResult(data);
      return data;
    } catch (error) {
      if (error.name === "AbortError") return null;

      setErrorMessage(error.message || "Unexpected error");
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeUrl, loading, errorMessage, result };
}
