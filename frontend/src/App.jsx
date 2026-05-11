import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import UrlInput from "./components/UrlInput";
import UrlReport from "./components/UrlReport";

/**
 * Root application component.
 *
 * Owns the top-level analysis state and wires together the three main
 * sections of the page: the branded Header, the URL input + report area
 * (inside a centred <main>), and the Footer.
 *
 * State flow:
 *   UrlInput calls onAnalysisComplete(report) after a successful fetch
 *   → App stores the result in analysisResult and flips hasReport to true
 *   → UrlReport renders once hasReport is true, using the latest result.
 *
 * hasReport only becomes true after the first *successful* response, so the
 * report section stays hidden on initial load and after a failed request.
 */
export default function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  // Stays false until the first successful analysis so the report area stays hidden.
  const [hasReport, setHasReport] = useState(false);

  const handleAnalysisCompleted = (report) => {
    if (report != null) {
      setAnalysisResult(report);
      setHasReport(true);
    }
  };

  return (
    <>
      <Header />
      <main className="app">
        <div className="app__heading">
          <h1>
            HubSpot <span className="app__highlight">Recommendation</span> Tool
          </h1>
          <p>
            Generate a concise report detailing the tech stack of any given
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
            hasAttemptedAnalysis={hasReport}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
