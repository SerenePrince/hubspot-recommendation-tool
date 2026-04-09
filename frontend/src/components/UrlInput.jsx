import React, { useState } from "react";
import { useWebsiteAnalysis } from "../hooks/useWebsiteAnalysis";

/**
 * URL input + submit button.
 *
 * Responsibilities:
 * - manage the current URL input field
 * - run lightweight client-side validation
 * - call the analysis hook and surface loading/errors to the user
 * - notify parent when a successful analysis completes
 */
export default function UrlInput({ onAnalysisComplete }) {
  const [urlInput, setUrlInput] = useState("");
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState("");
  const { analyzeUrl, loading, errorMessage } = useWebsiteAnalysis();

  function validateUrl(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;
    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "Only http:// and https:// URLs are accepted.";
      }
      return null;
    } catch {
      return "Enter a valid URL (for example, https://example.com).";
    }
  }

  const validationError = validateUrl(urlInput);
  const isDuplicate = urlInput === lastSubmittedUrl;
  const isSubmitDisabled =
    loading || !urlInput.trim() || Boolean(validationError) || isDuplicate;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    const report = await analyzeUrl(urlInput);
    if (report) {
      setLastSubmittedUrl(urlInput);
      onAnalysisComplete?.(report);
    }
  };

  // Determine which message to show (priority: loading > validation error > errorMessage > helper)
  let message = null;
  if (loading) {
    message = {
      text: "Analyzing website… this usually takes a few seconds.",
      type: "info",
    };
  } else if (validationError) {
    message = { text: validationError, type: "error" };
  } else if (errorMessage) {
    message = { text: errorMessage, type: "error" };
  } else if (!urlInput.trim() && !loading) {
    message = {
      text: "Paste a URL above to see a technology and HubSpot recommendations report.",
      type: "helper",
    };
  }

  return (
    <form onSubmit={handleSubmit} className="url-form">
      <div className="input-row">
        <input
          type="url"
          placeholder="Enter a website URL… e.g. https://example.com"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          disabled={loading}
          aria-invalid={Boolean(validationError || errorMessage)}
        />
        <button type="submit" disabled={isSubmitDisabled}>
          {loading ? "Analyzing…" : "Submit"}
        </button>
      </div>

      {/* Fixed-height message area – prevents layout shift */}
      <div className="message-area">
        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}
      </div>
    </form>
  );
}
