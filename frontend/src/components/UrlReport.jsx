import { mapApiToTableData } from "../utils/mapApiToTableData";

/**
 * Tech-stack analysis report.
 *
 * Renders nothing until the first successful analysis (hasAttemptedAnalysis
 * controls visibility so the report area doesn't flash on initial load).
 *
 * Three render states:
 *   1. Not yet attempted — returns null (component is not mounted).
 *   2. No technologies detected — shows a status message; handles sites that
 *      block analysis or return an empty technologies array.
 *   3. Technologies found — renders a three-column table (Technology,
 *      Description, HubSpot Replacement) with one row per detected tech.
 *      Rows are mapped through mapApiToTableData to decouple the component
 *      from the raw API shape.
 *
 * The table switches to a stacked card layout on mobile via CSS; each cell
 * carries a data-label attribute so the label can be surfaced via ::before.
 *
 * @param {{
 *   urlAnalysisData: object|null,
 *   hasAttemptedAnalysis: boolean
 * }} props
 *   urlAnalysisData      — raw response from GET /api/analyze, or null.
 *   hasAttemptedAnalysis — true only after a successful analysis; prevents
 *                          the report area from rendering on first load.
 */
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
                {row.products?.length > 0 ? (
                  row.products.map((product, i) => (
                    <div
                      key={product.name}
                      className={
                        i === 0
                          ? "replacement-block replacement-block--primary"
                          : "replacement-block replacement-block--secondary"
                      }
                    >
                      <span className="replacement-product">{product.name}</span>
                      {product.description && (
                        <span className="replacement-description">
                          {product.description}
                        </span>
                      )}
                    </div>
                  ))
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
