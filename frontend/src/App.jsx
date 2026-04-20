import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import UrlInput from "./components/UrlInput";
import UrlReport from "./components/UrlReport";

/**
 * Top-level application shell that coordinates URL submission and report display.
 *
 * @returns {JSX.Element} Full app layout
 */
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
    <>
      <Header />
      <div className="app">
        <div className="app__heading">
          <h1>
            <b>
              HubSpot <span className="app__highlight">Marketing</span> Tool
            </b>
          </h1>
          <p>
            Generate a concise report detailing the tech-stack of any given
            website, highlighting technologies and services that HubSpot offers
            alternatives for.
          </p>
        </div>

        <div className="app__url-input">
          <UrlInput onAnalysisComplete={handleAnalysisCompleted} />
        </div>

        <div className="app__report">
          <UrlReport
            urlAnalysisData={analysisResult}
            hasAttemptedAnalysis={hasAttemptedAnalysis}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
