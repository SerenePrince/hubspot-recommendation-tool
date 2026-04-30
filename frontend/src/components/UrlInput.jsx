import { useState } from "react";
import { useWebsiteAnalysis } from "../hooks/useWebsiteAnalysis";

export default function UrlInput({ onAnalysisComplete }) {
  const [urlInput, setUrlInput] = useState("");
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState("");
  const { analyzeUrl, loading, errorMessage } = useWebsiteAnalysis();

  function validateUrl(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "https:") {
        return "Only https:// URLs are accepted.";
      }
      return null;
    } catch {
      return "Enter a valid URL (for example, https://example.com).";
    }
  }

  const validationError = validateUrl(urlInput);
  // Prevent duplicate submissions by comparing trimmed input against the last successful URL.
  const isDuplicate = urlInput.trim() === lastSubmittedUrl;
  const isSubmitDisabled =
    loading || !urlInput.trim() || Boolean(validationError) || isDuplicate;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    const normalized = urlInput.trim();
    const report = await analyzeUrl(normalized);
    if (report) {
      setLastSubmittedUrl(normalized);
      onAnalysisComplete?.(report);
    }
  };

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
  } else if (!urlInput.trim()) {
    message = {
      text: "Paste a URL above to see a technology and HubSpot recommendations report.",
      type: "helper",
    };
  }

  return (
    <form onSubmit={handleSubmit} className="url-form">
      <div className="url-form__row">
        <input
          type="url"
          className="url-form__input"
          placeholder="Enter a website URL… e.g. https://example.com"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          disabled={loading}
          aria-invalid={Boolean(validationError || errorMessage)}
        />
        <button
          type="submit"
          className="url-form__button"
          disabled={isSubmitDisabled}
        >
          {loading ? "Analyzing…" : "Submit"}
        </button>
      </div>

      <div className="url-form__message-area" aria-live="polite">
        {message && (
          <div
            className={`url-form__message url-form__message--${message.type}`}
          >
            {message.text}
          </div>
        )}
      </div>
    </form>
  );
}
