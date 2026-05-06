// backend/src/core/detect/matchers/resolveVersion.js

/**
 * Resolves a Wappalyzer version template string against a regex match result.
 * Replaces \1, \2, etc. with the corresponding capture groups.
 *
 * Shared by all signal matchers (headers, scriptSrc, dom, etc.) to avoid
 * copy-pasting the same small helper across every matcher file.
 *
 * @param {string|undefined} template - Version template (e.g. "\\1.\\2")
 * @param {RegExpExecArray} match - The result of compiled.re.exec(...)
 * @returns {string|undefined} Resolved version string, or undefined if not applicable
 */
function resolveVersion(template, match) {
  if (!template) return undefined;
  try {
    return template.replace(/\\(\d+)/g, (_, g) => match[Number(g)] || "");
  } catch {
    return undefined;
  }
}

module.exports = { resolveVersion };
