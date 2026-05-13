import { useState } from "react";
import { mapApiToTableData } from "../utils/mapApiToTableData";
import { SHOW_UNMAPPED_TECHNOLOGIES } from "../config";

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
 *      Description, HubSpot Replacement) with one row per visible tech.
 *
 * Filtering behaviour:
 *   By default (SHOW_UNMAPPED_TECHNOLOGIES = false) only technologies with a
 *   HubSpot recommendation are shown. A "reveal N unmapped" toggle below the
 *   table lets the user expand to all detected technologies in-session.
 *   Setting SHOW_UNMAPPED_TECHNOLOGIES = true starts the toggle in the expanded
 *   state (useful when auditing mapping coverage during development).
 *
 *   If every detected technology is unmapped and the toggle is collapsed, the
 *   table is replaced with a prompt to reveal — so the user is never left
 *   staring at an empty table with no explanation.
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
  const [showUnmapped, setShowUnmapped] = useState(SHOW_UNMAPPED_TECHNOLOGIES);

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

  const allRows = mapApiToTableData(urlAnalysisData);
  const mappedRows = allRows.filter((row) => row.products.length > 0);
  const visibleRows = showUnmapped ? allRows : mappedRows;
  const hiddenCount = allRows.length - mappedRows.length;

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

      {visibleRows.length === 0 ? (
        <p className="report__filter-note report__filter-note--empty">
          No mapped recommendations for this site&apos;s tech stack —{" "}
          <button
            className="report__toggle"
            onClick={() => setShowUnmapped(true)}
          >
            reveal {hiddenCount} unmapped{" "}
            {hiddenCount === 1 ? "technology" : "technologies"}
          </button>
        </p>
      ) : (
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
            {visibleRows.map((row, idx) => (
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
                        <span className="replacement-product">
                          {product.name}
                        </span>
                        {product.description && (
                          <span className="replacement-description">
                            {product.description}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="replacement-none">
                      No recommendation mapped
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {hiddenCount > 0 && visibleRows.length > 0 && (
        <p className="report__filter-note">
          {showUnmapped ? (
            <>
              Showing all {allRows.length} detected{" "}
              {allRows.length === 1 ? "technology" : "technologies"} —{" "}
              <button
                className="report__toggle"
                onClick={() => setShowUnmapped(false)}
              >
                hide {hiddenCount} unmapped
              </button>
            </>
          ) : (
            <>
              Showing {mappedRows.length} of {allRows.length} detected{" "}
              {allRows.length === 1 ? "technology" : "technologies"} —{" "}
              <button
                className="report__toggle"
                onClick={() => setShowUnmapped(true)}
              >
                reveal {hiddenCount} unmapped
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
