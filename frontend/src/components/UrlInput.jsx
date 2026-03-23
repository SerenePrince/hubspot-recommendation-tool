import React, { useState } from "react";
import { useWebsiteAnalysis } from "../hooks/useWebsiteAnalysis";

export default function UrlInput({ onSubmit, returnAnalysis }) {
  const [urlInput, setUrlInput] = useState("");
  const { analyzeUrl, loading, error, result } = useWebsiteAnalysis();

  function validateUrl(input) {
    try {
      // Require a valid absolute URL:
      const parsed = new URL(input);
      // Enforce http/https:
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "Only http and https URLs are accepted.";
      }
      return null;
    } catch {
      return "Please enter a valid absolute URL (example: https://example.com).";
    }
  }

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const analysisResult = await analyzeUrl(urlInput);
    returnAnalysis(analysisResult);
  };

  return (
    <form
      onSubmit={handleAnalyze}
      className="url-form"
      aria-describedby="url-help"
    >
      <div className="input-row">
        <input
          id="url-input"
          name="url"
          type="url"
          inputMode="url"
          placeholder="Enter URL... https://example.com"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "url-error" : "url-help"}
        />
        <button type="submit">SUBMIT</button>
      </div>

      <div id="url-error" role="status" aria-live="polite" className="error">
        {error}
      </div>

      <div id="url-help" className="helper">
        <div id="helper-content">
          <h3>Directions</h3>
          <p>
            Enter a valid URL into the field then submit and the application
            will scrape the systems public HTML and script files for data its
            tech-stack, then generate a report
          </p>
        </div>
      </div>
    </form>
  );
}
