import { mapApiToTableData } from "../utils/mapApiToTableData";

export default function UrlReport({ urlAnalysisData, hasAttemptedAnalysis }) {
  if (!hasAttemptedAnalysis) return null;

  if (!urlAnalysisData?.technologies?.length) {
    return (
      <div className="report" role="status">
        <div className="report__heading">
          <h2 className="report__heading-title">No technologies detected</h2>
          <p className="report__heading-subtitle">
            This site may block analysis or use uncommon tools.
          </p>
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
        <h2 className="report__heading-title">Tech-stack analysis</h2>
        <p className="report__heading-subtitle">
          <a href={urlHref} target="_blank" rel="noopener noreferrer">
            {urlDisplay}
          </a>
        </p>
      </div>

      <table
        className="report__table"
        aria-label="Detected technologies and HubSpot recommendations"
      >
        <thead>
          <tr>
            <th scope="col">Technology</th>
            <th scope="col">Description</th>
            <th scope="col">HubSpot Replacement</th>
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
                {row.version && (
                  <span className="tech-version">{row.version}</span>
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
                    {row.additionalProducts?.map((product) => (
                      <span key={product} className="replacement-secondary">
                        {product}
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="replacement-none">No recommendation mapped</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
