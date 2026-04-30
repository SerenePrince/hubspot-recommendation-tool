import { mapApiToTableData } from "../utils/mapApiToTableData";

export default function UrlReport({ urlAnalysisData, hasAttemptedAnalysis }) {
  if (!hasAttemptedAnalysis) return null;

  if (!urlAnalysisData?.technologies?.length) {
    return (
      <div className="report">
        <div className="report__heading">
          <h3>No technologies detected</h3>
          <p>This site may block analysis or use uncommon tools.</p>
        </div>
      </div>
    );
  }

  const rows = mapApiToTableData(urlAnalysisData);
  const urlDisplay = urlAnalysisData.finalUrl || urlAnalysisData.url || "";
  const urlHref = urlAnalysisData.finalUrl || urlAnalysisData.url || "#";

  return (
    <div className="report">
      <div className="report__heading">
        <h3>Tech-stack analysis for:</h3>
        <h3>
          <a href={urlHref} target="_blank" rel="noopener noreferrer">
            {urlDisplay}
          </a>
        </h3>
      </div>

      <table className="report__table">
        <thead>
          <tr>
            <th>Technology</th>
            <th>Description</th>
            <th>HubSpot Replacement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.name || idx}>
              <td data-label="Technology">
                <span className="tech-name">{row.name}</span>
                {row.category && (
                  <span className="tech-category">{row.category}</span>
                )}
              </td>
              <td data-label="Description">
                {row.description || "No description available"}
              </td>
              <td data-label="HubSpot Replacement">
                {row.primaryProduct ? (
                  <>
                    <span className="replacement-product">
                      {row.primaryProduct}
                    </span>
                    {row.recommendationTitle && (
                      <span className="replacement-title">
                        {row.recommendationTitle}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="replacement-none">No direct replacement</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
