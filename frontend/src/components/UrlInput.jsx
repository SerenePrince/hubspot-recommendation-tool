import React, { useState } from "react";
import { useWebsiteAnalysis } from "../hooks/useWebsiteAnalysis";

export default function UrlInput({ returnAnalysis }) {
  const [urlInput, setUrlInput] = useState("");
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState("");
  const { analyzeUrl, loading, error } = useWebsiteAnalysis();

  function validateUrl(input) {
    if (!input.trim()) return null; // ← don't validate empty input
    try {
      const parsed = new URL(input);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "Only http and https URLs are accepted.";
      }
      return null;
    } catch {
      return "Enter a valid URL (e.g., https://example.com)";
    }
  }

  const validationError = validateUrl(urlInput);
  const isDuplicate = urlInput === lastSubmittedUrl;
  const isDisabled =
    loading || !urlInput.trim() || !!validationError || isDuplicate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDisabled) return;
    const result = await analyzeUrl(urlInput);
    if (result) {
      setLastSubmittedUrl(urlInput);
      returnAnalysis(result);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="url-form">
      <div className="input-row">
        <input
          type="url"
          placeholder="Enter URL... https://example.com"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          disabled={loading}
          aria-invalid={!!validationError || !!error}
        />
        <button type="submit" disabled={isDisabled}>
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </div>
      {(validationError || error) && ( // ← only render when there's something to show
        <div className="error">{validationError || error}</div>
      )}
      {loading && (
        <div className="helper">
          Analyzing website… this may take a few seconds.
        </div>
      )}
    </form>
  );
}
