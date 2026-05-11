import { useState } from "react";
import { useWebsiteAnalysis } from "../hooks/useWebsiteAnalysis";

/**
 * URL input form.
 *
 * Renders a labelled text input + "Analyze" button. Handles client-side
 * validation, submission, and all message states (loading, error, helper).
 *
 * Validation is intentionally deferred — errors only appear after the user
 * blurs the field or attempts a submit, so they are never punished mid-type.
 *
 * Message priority (highest to lowest):
 *   loading → validation error → API error → duplicate URL → helper prompt
 *
 * @param {{ onAnalysisComplete: (report: object) => void }} props
 *   onAnalysisComplete — called with the raw API response after a successful
 *   fetch; not called on errors or cancelled requests.
 */
export default function UrlInput({ onAnalysisComplete }) {
  const [urlInput, setUrlInput] = useState("");
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState("");
  // Validation errors are only shown after the user has blurred the field
  // or attempted a submit — never while they are still typing.
  const [hasBlurred, setHasBlurred] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
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
  // Gate errors behind blur or a submit attempt so users aren't punished mid-type.
  const showValidationError = (hasBlurred || submitAttempted) && validationError;
  // Prevent duplicate submissions once a URL has already been analyzed.
  const isDuplicate = Boolean(urlInput.trim()) && urlInput.trim() === lastSubmittedUrl;
  const isSubmitDisabled =
    loading || !urlInput.trim() || Boolean(validationError) || isDuplicate;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (isSubmitDisabled) return;

    const normalized = urlInput.trim();
    const report = await analyzeUrl(normalized);
    if (report) {
      setLastSubmittedUrl(normalized);
      onAnalysisComplete?.(report);
    }
  };

  // Message priority: loading → validation error → API error → duplicate → helper
  let message = null;
  if (loading) {
    message = {
      text: "Analyzing website… this usually takes a few seconds.",
      type: "info",
    };
  } else if (showValidationError) {
    message = { text: validationError, type: "error" };
  } else if (errorMessage) {
    message = { text: errorMessage, type: "error" };
  } else if (isDuplicate) {
    message = {
      text: "This URL was already analyzed — edit the URL to run a new report.",
      type: "helper",
    };
  } else if (!urlInput.trim()) {
    message = {
      text: "Enter a URL above to see a technology and HubSpot recommendations report.",
      type: "helper",
    };
  }

  return (
    <form onSubmit={handleSubmit} className="url-form">
      <label htmlFor="url-input" className="url-form__label">
        Website URL
      </label>
      <div className="url-form__row">
        <input
          id="url-input"
          type="url"
          className="url-form__input"
          placeholder="https://example.com"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          onBlur={() => setHasBlurred(true)}
          disabled={loading}
          autoFocus
          autoComplete="url"
          aria-invalid={Boolean(showValidationError || errorMessage)}
          aria-describedby="url-form-message"
        />
        <button
          type="submit"
          className="url-form__button"
          disabled={isSubmitDisabled}
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      <div
        id="url-form-message"
        className="url-form__message-area"
        aria-live="polite"
      >
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
