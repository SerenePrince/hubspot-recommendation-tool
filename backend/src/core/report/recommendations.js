// backend/src/core/report/recommendations.js
const fs = require("node:fs");
const path = require("node:path");
const { validateMapping } = require("./mappingValidator");

let cachedMapping = null;

/**
 * Returns the default absolute path for the HubSpot recommendation mapping file.
 *
 * @returns {string} Absolute mapping JSON path
 */
function getDefaultMappingPath() {
  return path.resolve(
    __dirname,
    "../../../data/alternatives/hubspot-mapping.json",
  );
}

/**
 * Loads and validates recommendation mapping JSON once per process.
 * Invalid or missing mapping intentionally degrades to an empty mapping so analysis can still succeed.
 *
 * @param {string} [mappingPath] - Optional override path to mapping file
 * @returns {object} Parsed mapping object (or `{}` fallback)
 */
function ensureMappingLoaded(mappingPath) {
  if (cachedMapping) return cachedMapping;

  const p = mappingPath || getDefaultMappingPath();

  try {
    const raw = fs.readFileSync(p, "utf8");
    const loaded = JSON.parse(raw);

    const validation = validateMapping(loaded);
    if (!validation.ok) {
      // Mapping validation errors should not take down analysis:
      // - detection should still work (this is often the more valuable output)
      // - recommendations degrade gracefully to empty until the mapping is fixed
      console.error(
        "Recommendation mapping is invalid. Falling back to empty mapping.",
      );
      for (const err of validation.errors.slice(0, 50))
        console.error(" -", err);
      cachedMapping = {};
    } else {
      cachedMapping = loaded;
    }
  } catch (e) {
    console.error(
      "Failed to load recommendation mapping. Falling back to empty mapping.",
    );
    console.error(e?.message || e);
    cachedMapping = {};
  }

  return cachedMapping;
}

/**
 * Maps a priority string to a numeric weight for score computation.
 * Higher weight = higher sort precedence.
 *
 * @param {string} p - Priority string ("high" | "medium" | "low")
 * @returns {number} Numeric weight (3 = high, 2 = medium, 1 = low/unknown)
 */
function priorityWeight(p) {
  if (p === "high") return 3;
  if (p === "medium") return 2;
  if (p === "low") return 1;
  return 1;
}

/**
 * Computes a sort score for a merged recommendation.
 *
 * Score components (additive):
 *   - Base priority weight (1–3): ensures high-priority recs always outrank low ones
 *   - Trigger breadth bonus (0–3): more triggering detections = stronger signal, capped to avoid
 *     noisy broad-match rules from drowning out specific high-confidence detections
 *   - Trigger specificity bonus: technology (+2) > category/categoryId (+1) > group/groupId (+0.5)
 *     so a precise tech-level match ranks above a broad group-level match at the same priority
 *
 * @param {object} rec - Merged recommendation object with `priority`, `triggeredBy`, `triggerType`
 * @returns {number} Numeric sort score (higher = surfaces first)
 */
function computeScore(rec) {
  let score = priorityWeight(rec.priority);
  const n = Array.isArray(rec.triggeredBy) ? rec.triggeredBy.length : 0;
  score += Math.min(3, n);

  if (rec.triggerType === "technology") score += 2;
  if (rec.triggerType === "categoryId" || rec.triggerType === "category")
    score += 1;
  if (rec.triggerType === "groupId" || rec.triggerType === "group")
    score += 0.5;

  return score;
}

function recKey(rec) {
  return (rec.hubspotProduct || "").trim().toLowerCase();
}

/**
 * Builds HubSpot recommendations from enriched detections using configurable mapping triggers.
 *
 * Mapping supports technology, category, and group triggers so teams can maintain
 * recommendations at taxonomy level (broader coverage) instead of per-tech-only rules.
 *
 * @param {Array<object>} detections - Enriched detections from report phase
 * @param {{ mappingPath?: string, minConfidence?: number }} [options] - Mapping path and threshold overrides
 * @returns {Array<object>} Ranked, deduplicated recommendation list with trigger traceability
 */
function buildRecommendations(detections, options = {}) {
  const { mappingPath, minConfidence = 50 } = options;
  const mapping = ensureMappingLoaded(mappingPath);

  // Keep recommendation triggers aligned with report defaults:
  // - below-threshold detections are considered too noisy for client-facing recommendations
  const filtered = (detections || []).filter(
    (d) => (d?.confidence || 0) >= minConfidence,
  );

  const recs = [];
  const addAll = (items, triggerType, key, matched) => {
    for (const r of items || []) {
      if (!r) continue;
      recs.push({
        ...r,
        triggerType,
        triggeredBy: [{ triggerType, key, matched }],
      });
    }
  };

  // Category/group triggers are intentionally supported because mapping every single
  // technology is brittle; taxonomy-level rules cover more cases with less maintenance.
  // Mapping supports multiple trigger shapes for flexibility:
  // - byTechnology: exact match on detection name/slug
  // - byCategory/byCategoryId: match on taxonomy categories
  // - byGroup/byGroupId: match on taxonomy groups
  const byTechnology = mapping.byTechnology || {};
  for (const d of filtered) {
    const techKey = (d.name || d.slug || "").trim();
    if (!techKey) continue;
    if (byTechnology[techKey])
      addAll(byTechnology[techKey], "technology", techKey, techKey);
  }

  const byCategory = mapping.byCategory || {};
  const byCategoryId = mapping.byCategoryId || {};
  for (const d of filtered) {
    const cats = Array.isArray(d.categories) ? d.categories : [];
    for (const c of cats) {
      if (c?.name && byCategory[c.name])
        addAll(byCategory[c.name], "category", c.name, c.name);
      if (c?.id && byCategoryId[c.id])
        addAll(byCategoryId[c.id], "categoryId", c.id, c.name || c.id);
    }
  }

  const byGroup = mapping.byGroup || {};
  const byGroupId = mapping.byGroupId || {};
  for (const d of filtered) {
    const groups = Array.isArray(d.groups) ? d.groups : [];
    for (const g of groups) {
      if (g?.name && byGroup[g.name])
        addAll(byGroup[g.name], "group", g.name, g.name);
      if (g?.id && byGroupId[g.id])
        addAll(byGroupId[g.id], "groupId", g.id, g.name || g.id);
    }
  }

  // Merge duplicates by hubspotProduct, union triggeredBy.
  // Preserve report-aligned optional fields like `reason` and `inboxOffer`.
  const merged = new Map();
  for (const r of recs) {
    const k = recKey(r);
    const existing = merged.get(k);

    if (!existing) {
      merged.set(k, {
        hubspotProduct: r.hubspotProduct,
        priority: r.priority,

        // Common optionals
        description: r.description ?? null,
        url: r.url ?? null,
        tags: Array.isArray(r.tags) ? r.tags : [],

        // Mapping-specific optionals (present in your hubspot-mapping.json)
        reason: r.reason ?? null,
        inboxOffer: r.inboxOffer ?? null,

        triggeredBy: Array.isArray(r.triggeredBy) ? r.triggeredBy.slice() : [],
        triggerType: r.triggerType,
      });
      continue;
    }

    // Keep highest priority if conflict (rare)
    existing.priority = pickHigherPriority(existing.priority, r.priority);

    // Prefer non-empty optional fields
    existing.description = existing.description || r.description || null;
    existing.url = existing.url || r.url || null;
    existing.reason = existing.reason || r.reason || null;
    existing.inboxOffer = existing.inboxOffer || r.inboxOffer || null;

    // Merge tags
    const tags = new Set(
      [...(existing.tags || []), ...(Array.isArray(r.tags) ? r.tags : [])].map(
        String,
      ),
    );
    existing.tags = Array.from(tags).filter((t) => t.trim());

    // Merge triggeredBy
    existing.triggeredBy = dedupeTriggeredBy([
      ...(existing.triggeredBy || []),
      ...(r.triggeredBy || []),
    ]);

    // Keep more specific triggerType if possible
    existing.triggerType = pickMoreSpecificTrigger(
      existing.triggerType,
      r.triggerType,
    );

    merged.set(k, existing);
  }

  const out = Array.from(merged.values()).map((r) => ({
    ...r,
    score: computeScore(r),
  }));

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return String(a.hubspotProduct || "").localeCompare(
      String(b.hubspotProduct || ""),
    );
  });

  return capGroupNoise(out);
}

function pickHigherPriority(a, b) {
  const w = (p) =>
    p === "high" ? 3 : p === "medium" ? 2 : p === "low" ? 1 : 1;
  return w(b) > w(a) ? b : a;
}

function pickMoreSpecificTrigger(a, b) {
  const w = (t) => {
    if (t === "technology") return 4;
    if (t === "categoryId" || t === "category") return 3;
    if (t === "groupId" || t === "group") return 2;
    return 1;
  };
  return w(b) > w(a) ? b : a;
}

function dedupeTriggeredBy(items) {
  const seen = new Set();
  const out = [];
  for (const t of items || []) {
    const key = `${t.triggerType || ""}||${t.key || ""}||${t.matched || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function capGroupNoise(recs) {
  const bestByProduct = new Map();

  for (const r of recs) {
    if (r.triggerType !== "group") continue;
    const productKey = String(r.hubspotProduct || "__none__").trim();
    const best = bestByProduct.get(productKey);
    if (!best || (r.score || 0) > (best.score || 0))
      bestByProduct.set(productKey, r);
  }

  const kept = [];
  for (const r of recs) {
    if (r.triggerType !== "group") {
      kept.push(r);
      continue;
    }
    const productKey = String(r.hubspotProduct || "__none__").trim();
    if (bestByProduct.get(productKey) === r) kept.push(r);
  }

  return kept;
}

module.exports = {
  buildRecommendations,
  ensureMappingLoaded,
  getDefaultMappingPath,
};
