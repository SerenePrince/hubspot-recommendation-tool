import React from "react";

export default function UrlReport({ urlAnalysisData }) {
  if (!urlAnalysisData || typeof urlAnalysisData !== "object") {
    return null;
  }

  const techData = urlAnalysisData.technologies || [];

  if (!techData.length) {
    return (
      <div id="report-block">
        <div id="report-heading">
          <h3>No technologies detected</h3>
          <p>This site may block analysis or use uncommon tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="report-block">
      <div id="report-heading">
        <h3>Tech-stack analysis for:</h3>
        <h3>
          <a
            href={urlAnalysisData.finalUrl || urlAnalysisData.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {urlAnalysisData.url}
          </a>
        </h3>
      </div>

      <table>
        <thead>
          <th>Found Technology</th>
          <th>Description</th>
          <th>Recommendation</th>
        </thead>

        <tbody>
          {techData.map((tech, i) => (
            <tr key={i}>
              <td data-label="Technology">{tech?.name || "Unknown"}</td>

              <td data-label="Description">
                <ul>
                  <li>Category: {tech?.categories?.name || "Unknown"}</li>
                  <li>{tech?.description || ""}</li>
                </ul>
              </td>

              <td data-label="Recommendation">
                {tech?.hubspot?.products?.length ? (
                  <ul>
                    {tech.hubspot.products.map((p, idx) => (
                      <li key={idx}>{p?.hubspotProduct}</li>
                    ))}
                  </ul>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
