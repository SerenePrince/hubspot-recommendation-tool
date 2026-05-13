// backend/src/core/detect/matchers/text.js
const { compilePattern } = require("../compilePattern");
const { resolveVersion } = require("./resolveVersion");

/**
 * Matches technology rules against visible text extracted from the page.
 *
 * @param {object} db - Technology database and matcher index
 * @param {object} signals - Normalized analysis signals
 * @returns {Array<object>} Candidate detections from visible text evidence
 */
function matchText(db, signals) {
  const text = typeof signals?.text === "string" ? signals.text : "";
  if (!text) return [];

  const out = [];

  const techNames = Array.isArray(db?.index?.text)
    ? db.index.text
    : Object.keys(db.technologies || {});
  for (const slug of techNames) {
    const tech = db.technologies?.[slug];
    if (!tech) continue;
    const patterns = tech.text;
    if (!patterns) continue;

    const rules = normalizePatternList(patterns);
    for (const rule of rules) {
      const compiled = compilePattern(rule);
      if (!compiled) continue;

      const m = compiled.re.exec(text);
      if (!m) continue;

      const version = resolveVersion(compiled.version, m);
      out.push({
        slug,
        confidence: compiled.confidence,
        version,
        evidence: "text",
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

module.exports = { matchText };
