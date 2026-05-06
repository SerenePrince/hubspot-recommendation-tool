// backend/src/core/detect/matchers/url.js
const { compilePattern } = require("../compilePattern");
const { resolveVersion } = require("./resolveVersion");

/**
 * Matches technology rules against the normalized final URL.
 *
 * @param {object} db - Technology database and matcher index
 * @param {object} signals - Normalized analysis signals
 * @returns {Array<object>} Candidate detections from URL evidence
 */
function matchUrl(db, signals) {
  const url = typeof signals?.url === "string" ? signals.url : "";
  if (!url) return [];

  const out = [];

  const techNames = Array.isArray(db?.index?.url) ? db.index.url : Object.keys(db.technologies || {});
  for (const slug of techNames) {
    const tech = db.technologies?.[slug];
    if (!tech) continue;
    const patterns = tech.url;
    if (!patterns) continue;

    const rules = normalizePatternList(patterns);
    for (const rule of rules) {
      const compiled = compilePattern(rule);
      if (!compiled) continue;

      const m = compiled.re.exec(url);
      if (!m) continue;

      const version = resolveVersion(compiled.version, m);
      out.push({
        slug,
        confidence: compiled.confidence,
        version,
        evidence: "url",
      });
    }
  }

  return out;
}

function normalizePatternList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return [String(v)];
}

module.exports = { matchUrl };
