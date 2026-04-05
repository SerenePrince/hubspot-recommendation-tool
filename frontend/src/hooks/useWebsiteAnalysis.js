import { useState, useCallback, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export function useWebsiteAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const abortRef = useRef(null);

  const analyzeUrl = useCallback(async (url) => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

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

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Analysis failed");
      }

      setResult(data);
      return data;
    } catch (err) {
      if (err.name === "AbortError") return null;

      setError(err.message || "Unexpected error");
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeUrl, loading, error, result };
}