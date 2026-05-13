/**
 * Unit tests for report/recommendations (Phase 5: Report Generation).
 *
 * We validate:
 * - mapping loading + validation fallback behavior
 * - triggers from technology/category/group and their merge rules
 * - dedupe by hubspotProduct and union of triggeredBy
 * - minConfidence filter
 * - scoring + sorting behavior is deterministic
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

describe("core/report/recommendations - buildRecommendations", () => {
  function writeTmpMapping(obj) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mapping-"));
    const p = path.join(dir, "hubspot-mapping.json");
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
    return p;
  }

  beforeEach(() => {
    jest.resetModules(); // important: resets cachedMapping inside recommendations.js
  });

  test("returns empty list when mapping is invalid (validation fallback)", () => {
    // Option A: silence expected console.error noise for this test only
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const badPath = writeTmpMapping({ byTechnology: { React: "nope" } });

      const { buildRecommendations } = require("../src/core/report/recommendations");
      const out = buildRecommendations([{ name: "React", slug: "React", confidence: 99 }], { mappingPath: badPath });

      expect(out).toEqual([]);
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  test("merges duplicates by hubspotProduct and unions triggeredBy", () => {
    const mappingPath = writeTmpMapping({
      byTechnology: {
        React: [
          { hubspotProduct: "CMS Hub", priority: "high", tags: ["cms"], reason: "tech" },
        ],
      },
      byCategory: {
        Ecommerce: [
          { hubspotProduct: "CMS Hub", priority: "medium", tags: ["web"], reason: "cat" },
        ],
      },
      byGroup: {
        Analytics: [
          { hubspotProduct: "CMS Hub", priority: "low", tags: ["analytics"], reason: "group" },
        ],
      },
    });

    const { buildRecommendations } = require("../src/core/report/recommendations");
    const detections = [
      {
        name: "React",
        slug: "React",
        confidence: 90,
        categories: [{ name: "Ecommerce", id: 123 }],
        groups: [{ name: "Analytics", id: 77 }],
      },
    ];

    const out = buildRecommendations(detections, { mappingPath, minConfidence: 50 });
    expect(out).toHaveLength(1);

    const rec = out[0];
    expect(rec.hubspotProduct).toBe("CMS Hub");

    // Highest priority wins on merge
    expect(rec.priority).toBe("high");

    // Tags merge and dedupe
    expect(new Set(rec.tags)).toEqual(new Set(["cms", "web", "analytics"]));

    // triggeredBy entries unioned and deduped
    expect(rec.triggeredBy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ triggerType: "technology", key: "React" }),
        expect.objectContaining({ triggerType: "category", key: "Ecommerce" }),
        expect.objectContaining({ triggerType: "group", key: "Analytics" }),
      ]),
    );

    // The "most specific" triggerType should win (technology)
    expect(rec.triggerType).toBe("technology");

    // Score is present and numeric
    expect(typeof rec.score).toBe("number");
  });

  test("filters out detections below minConfidence (report-aligned default)", () => {
    const mappingPath = writeTmpMapping({
      byTechnology: { React: [{ hubspotProduct: "p", priority: "high" }] },
    });

    const { buildRecommendations } = require("../src/core/report/recommendations");
    const out = buildRecommendations([{ name: "React", slug: "React", confidence: 49 }], {
      mappingPath,
      minConfidence: 50,
    });

    expect(out).toEqual([]);
  });

  test("byCategoryId trigger matches on numeric category id", () => {
    const mappingPath = writeTmpMapping({
      byCategoryId: {
        42: [{ hubspotProduct: "Data Hub", priority: "medium" }],
      },
    });

    const { buildRecommendations } = require("../src/core/report/recommendations");
    const detections = [
      {
        name: "Zendesk",
        slug: "Zendesk",
        confidence: 90,
        categories: [{ id: 42, name: "CRM" }],
        groups: [],
      },
    ];

    const out = buildRecommendations(detections, { mappingPath });
    expect(out).toHaveLength(1);
    expect(out[0].hubspotProduct).toBe("Data Hub");
    expect(out[0].triggeredBy[0]).toMatchObject({ triggerType: "categoryId", key: 42 });
  });

  test("caps group-noise: only best group-triggered rec per hubspotProduct is kept", () => {
    const mappingPath = writeTmpMapping({
      byGroup: {
        GroupA: [{ hubspotProduct: "Sales Hub", priority: "low" }],
        GroupB: [{ hubspotProduct: "Sales Hub", priority: "high" }],
      },
    });

    const { buildRecommendations } = require("../src/core/report/recommendations");
    const detections = [{ confidence: 90, groups: [{ name: "GroupA" }, { name: "GroupB" }] }];

    const out = buildRecommendations(detections, { mappingPath });

    // Both are group-triggered and same product; only the best-scoring should remain
    expect(out).toHaveLength(1);
    expect(out[0].priority).toBe("high");
  });
});
