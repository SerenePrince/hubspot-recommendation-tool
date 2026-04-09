import React, { useState } from "react";
import UrlInput from "./components/UrlInput";
import UrlReport from "./components/UrlReport";

export default function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [hasAttemptedAnalysis, setHasAttemptedAnalysis] = useState(false);

  const handleAnalysisCompleted = (report) => {
    if (report != null) {
      setAnalysisResult(report);
      setHasAttemptedAnalysis(true);
    }
  };

  return (
    <div className="app">
      <div id="app-heading-main">
        <h1>
          HubSpot <span id="highlight">Marketing</span> Tool
        </h1>
        <p>
          Generate a concise report detailing the tech-stack of any given
          website, highlighting technologies and services that HubSpot offers
          alternatives for.
        </p>
      </div>

      <div id="url-input-area">
        <UrlInput onAnalysisComplete={handleAnalysisCompleted} />
      </div>

      <div id="app-report-area">
        <UrlReport
          urlAnalysisData={analysisResult}
          hasAttemptedAnalysis={hasAttemptedAnalysis}
        />
      </div>
    </div>
  );
}
