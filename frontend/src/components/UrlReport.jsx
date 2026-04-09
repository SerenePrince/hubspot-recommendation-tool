import React from "react";

export default function UrlReport({ urlAnalysisData, hasAttemptedAnalysis }) {
  // Before any analysis: show nothing
  if (!hasAttemptedAnalysis) {
    return null;
  }

  // After analysis but no technologies found
  if (!urlAnalysisData?.technologies?.length) {
    return (
      <div id="report-block">
        <div id="report-heading">
          <h3>No technologies detected</h3>
          <p>This site may block analysis or use uncommon tools.</p>
        </div>
      </div>
    );
  }

  const technologies = urlAnalysisData.technologies;
  const urlDisplay = urlAnalysisData.url || urlAnalysisData.finalUrl || "";
  const urlHref = urlAnalysisData.finalUrl || urlAnalysisData.url || "#";

  return (
    <div id="report-block">
      <div id="report-heading">
        <h3>Tech-stack analysis for:</h3>
        <h3>
          <a href={urlHref} target="_blank" rel="noopener noreferrer">
            {urlDisplay}
          </a>
        </h3>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Found Technology</th>
            <th>Description</th>
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {technologies.map((tech, idx) => {
            const key = tech?.id || tech?.name || idx;
            const categoryNames =
              tech?.categories?.map((cat) => cat?.name).filter(Boolean) || [];

            return (
              <tr key={key}>
                <td data-label="Technology">{tech?.name || "Unknown"}</td>
                <td data-label="Description">
                  <ul>
                    <li>Category: {categoryNames.join(", ") || "Unknown"}</li>
                    {tech?.description && <li>{tech.description}</li>}
                  </ul>
                </td>
                <td data-label="Recommendation">
                  {tech?.hubspot?.products?.length ? (
                    <ul>
                      {tech.hubspot.products.map((product, i) => (
                        <li key={i}>{product?.hubspotProduct}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>No mapped HubSpot product</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
