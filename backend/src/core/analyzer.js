// backend/src/core/analyzer.js
//
// High-level analysis pipeline (used by both API + CLI):
// 1) Fetch (SSRF-guarded, size/time bounded, redirect-checked per hop)
// 2) Normalize into "signals" (bounded strings + structured artifacts)
// 3) Pattern-match those signals against the local WebAppAnalyzer/Wappalyzer-style dataset
// 4) Enrich detections with taxonomy metadata
// 5) Generate HubSpot recommendations and build the UI-oriented report shape
//
// This file intentionally keeps the orchestration simple and stable:
// - dataset is loaded once per process and cached
// - analysis is deterministic for a given fetch result + dataset
const { fetchPage } = require("./fetch/fetchPage");
const { buildSignals } = require("./normalize/signals");
const { loadTechDb } = require("./techdb/loadTechDb");
const { detectTechnologies } = require("./detect/detectTechnologies");
const { enrichDetections } = require("./report/enrichDetections");
const { buildRecommendations } = require("./report/recommendations");
const { buildSummary } = require("./report/summarize");
const { groupDetections } = require("./report/groupDetections");
const { config } = require("./config");

const MIN_CONFIDENCE = 50; // report-aligned threshold

let cachedDb = null;
let dbInitPromise = null;

async function initTechDb() {
  if (cachedDb) return cachedDb;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      const db = await loadTechDb();
      cachedDb = db;
      return db;
    })().finally(() => {
      // Allow retry on failure:
      // - on a transient filesystem issue, the next request can attempt re-init
      // - on success, cachedDb is set and dbInitPromise becomes irrelevant
      if (!cachedDb) dbInitPromise = null;
    });
  }
  return dbInitPromise;
}

async function analyzeUrl(url) {
  const totalStart = Date.now();

  const db = await initTechDb();

  // Phase 2: fetch the primary HTML and a bounded subset of external JS/CSS.
  // External resources are best-effort and exist to improve detection coverage without
  // allowing the analyzer to become an unbounded crawler.
  const fetched = await fetchPage(url);
  const fetchMs = fetched.timingMs;

  const analysisStart = Date.now();

  // Phase 3: normalize to stable signals so matchers operate over consistent inputs.
  const signals = buildSignals(fetched);

  // Optional internal-only debug signals (never required for frontend output)
  const debugSignals =
    config.debugSignals
      ? {
          metaKeys: Object.keys(signals.meta || {}).slice(0, 50),
          scriptSrcPreview: (signals.scriptSrc || []).slice(0, 20),
          cookieNames: Array.isArray(signals.cookies) ? signals.cookies : [],
        }
      : undefined;

  // Phase 4: run Wappalyzer-style matchers across multiple signal types (headers, DOM, etc.)
  const detections = detectTechnologies(db, signals, { minConfidence: MIN_CONFIDENCE });
  // Phase 5: attach taxonomy + human-friendly metadata (used by report + recommendation logic)
  const enriched = enrichDetections(db, detections);

  // Stable ordering: confidence desc, then name asc
  enriched.sort((a, b) => {
    if ((b.confidence || 0) !== (a.confidence || 0)) return (b.confidence || 0) - (a.confidence || 0);
    return (a.name || "").localeCompare(b.name || "");
  });

  const summary = buildSummary(enriched);
  const groupedDetections = groupDetections(enriched);

  // Keep recommendations consistent with the report’s detection threshold unless a stricter value is explicitly desired.
  const recommendations = buildRecommendations(enriched, { minConfidence: MIN_CONFIDENCE });

  const analysisMs = Date.now() - analysisStart;
  const totalMs = Date.now() - totalStart;

  const report = {
    ok: true,
    url,
    finalUrl: fetched.finalUrl,
    fetch: {
      status: fetched.status,
      contentType: fetched.contentType,
      bytes: fetched.bytes,
      timingMs: fetchMs,
      headers: pickHeaders(fetched.headers, [
        "server",
        "x-powered-by",
        "via",
        "cf-ray",
        "cf-cache-status",
        "x-vercel-cache",
        "x-vercel-id",
        "x-served-by",
        "x-cache",
        "set-cookie",
      ]),
    },
    timings: {
      analysisMs,
      totalMs,
    },
    detections: enriched,
    recommendations,
    summary,
    groups: groupedDetections,
  };

  if (debugSignals) report._debugSignals = debugSignals;

  return report;
}

function pickHeaders(headers, keys) {
  const out = {};
  if (!headers || typeof headers !== "object") return out;

  for (const k of keys) {
    if (headers[k] != null) out[k] = headers[k];
  }
  return out;
}

module.exports = { analyzeUrl, initTechDb };
