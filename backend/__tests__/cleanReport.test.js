/**
 * Unit tests for core/report/cleanReport.
 *
 * Covers:
 * - sanitizeName: strips Wappalyzer markdown link syntax from tech names
 * - buildSimpleReport: stable output shape, field defaults, and apiVersion marker
 * - buildTechnologyProductsIndex: technology-triggered AND category-triggered product assignment
 * - summarizeTriggeredBy: summary string format, overflow notation, null on empty
 * - buildTopRecommendations: top-5 cap with priority-first, then hubspotProduct alpha ordering
 * - buildCleanReport: includes meta.fetch and meta.timings
 *
 * buildSimpleReport internally calls ensureMappingLoaded (a side-effect ensuring the
 * recommendation mapping is warm for CLI callers). That is mocked here — recommendations
 * are supplied directly in report.recommendations, not derived from the mapping file.
 */

describe("core/report/cleanReport", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock("../src/core/report/recommendations", () => ({
      ensureMappingLoaded: jest.fn(),
      getDefaultMappingPath: jest.fn(() => "/fake/mapping.json"),
    }));
  });

  function load() {
    return require("../src/core/report/cleanReport");
  }

  // ── sanitizeName (tested via buildSimpleReport output) ─────────────────────

  test("strips markdown link syntax from technology names", () => {
    const { buildSimpleReport } = load();
    const report = {
      ok: true,
      detections: [
        { name: "[WordPress.com](http://WordPress.com)", confidence: 80 },
      ],
      recommendations: [],
    };

    const result = buildSimpleReport(report);
    expect(result.technologies[0].name).toBe("WordPress.com");
  });

  test("leaves names without markdown syntax unchanged", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [{ name: "React", confidence: 95 }],
      recommendations: [],
    });
    expect(result.technologies[0].name).toBe("React");
  });

  // ── buildSimpleReport: output shape ────────────────────────────────────────

  test("returns stable output shape with apiVersion marker", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      url: "https://example.com/",
      finalUrl: "https://example.com/",
      detections: [],
      recommendations: [],
    });

    expect(result.ok).toBe(true);
    expect(result.apiVersion).toBe("2.0");
    expect(result.url).toBe("https://example.com/");
    expect(result.finalUrl).toBe("https://example.com/");
    expect(Array.isArray(result.technologies)).toBe(true);
    expect(typeof result.byGroup).toBe("object");
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(typeof result.summary).toBe("object");
    expect(typeof result.summary.totals).toBe("object");
    expect(Array.isArray(result.summary.topRecommendations)).toBe(true);
  });

  test("does not include meta by default", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [],
      recommendations: [],
    });
    expect(result.meta).toBeUndefined();
  });

  test("ok is false when report.ok is not strictly true", () => {
    const { buildSimpleReport } = load();
    expect(
      buildSimpleReport({ ok: false, detections: [], recommendations: [] }).ok,
    ).toBe(false);
    expect(buildSimpleReport(null).ok).toBe(false);
  });

  // ── technology-triggered product assignment ─────────────────────────────────

  test("assigns hubspot products to a technology via technology trigger", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [{ name: "Mailchimp", confidence: 90 }],
      recommendations: [
        {
          hubspotProduct: "Marketing Hub",
          priority: "high",
          triggeredBy: [{ triggerType: "technology", key: "Mailchimp" }],
        },
      ],
    });

    const tech = result.technologies[0];
    expect(tech.hubspot.primaryProduct).toBe("Marketing Hub");
    expect(tech.hubspot.products[0].hubspotProduct).toBe("Marketing Hub");
  });

  // ── category-triggered product assignment (the fix for primaryProduct: null) ─

  test("assigns hubspot products to a technology matched only via a category trigger", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [
        {
          name: "Google Ads Conversion Tracking",
          confidence: 80,
          categories: [{ id: 10, name: "Analytics" }],
        },
      ],
      recommendations: [
        {
          hubspotProduct: "Marketing Hub",
          priority: "medium",
          triggeredBy: [{ triggerType: "category", key: "Analytics" }],
        },
      ],
    });

    const tech = result.technologies[0];
    expect(tech.name).toBe("Google Ads Conversion Tracking");
    expect(tech.hubspot.primaryProduct).toBe("Marketing Hub");
  });

  test("sanitized markdown name is correctly matched via category trigger", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [
        {
          name: "[WordPress.com](http://WordPress.com)",
          confidence: 90,
          categories: [{ id: 5, name: "CMS" }],
        },
      ],
      recommendations: [
        {
          hubspotProduct: "CMS Hub",
          priority: "high",
          triggeredBy: [{ triggerType: "category", key: "CMS" }],
        },
      ],
    });

    const tech = result.technologies[0];
    expect(tech.name).toBe("WordPress.com");
    expect(tech.hubspot.primaryProduct).toBe("CMS Hub");
  });

  test("technology with no matching trigger has null primaryProduct", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [{ name: "UnknownLib", confidence: 70 }],
      recommendations: [
        {
          hubspotProduct: "Marketing Hub",
          priority: "low",
          triggeredBy: [{ triggerType: "technology", key: "OtherTech" }],
        },
      ],
    });

    expect(result.technologies[0].hubspot.primaryProduct).toBeNull();
  });

  // ── priority ordering of products (primary = highest priority) ─────────────

  test("primaryProduct is the highest-priority product when a tech has multiple", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [{ name: "Zendesk", confidence: 90 }],
      recommendations: [
        {
          hubspotProduct: "Data Hub",
          priority: "low",
          triggeredBy: [{ triggerType: "technology", key: "Zendesk" }],
        },
        {
          hubspotProduct: "Service Hub",
          priority: "high",
          triggeredBy: [{ triggerType: "technology", key: "Zendesk" }],
        },
      ],
    });

    const tech = result.technologies[0];
    expect(tech.hubspot.primaryProduct).toBe("Service Hub");
    expect(tech.hubspot.products[0].hubspotProduct).toBe("Service Hub");
  });

  // ── summarizeTriggeredBy ────────────────────────────────────────────────────

  test("triggeredBySummary formats technology/category/group entries", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [],
      recommendations: [
        {
          hubspotProduct: "Marketing Hub",
          priority: "high",
          triggeredBy: [
            { triggerType: "technology", key: "Mailchimp" },
            { triggerType: "category", key: "Email" },
            { triggerType: "group", key: "Marketing" },
          ],
        },
      ],
    });

    const summary = result.recommendations[0].triggeredBySummary;
    expect(summary).toContain("Tech: Mailchimp");
    expect(summary).toContain("Category: Email");
    expect(summary).toContain("Group: Marketing");
  });

  test("triggeredBySummary appends +N overflow when items exceed 3 (default max)", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [],
      recommendations: [
        {
          hubspotProduct: "Marketing Hub",
          priority: "high",
          triggeredBy: [
            { triggerType: "technology", key: "A" },
            { triggerType: "technology", key: "B" },
            { triggerType: "technology", key: "C" },
            { triggerType: "technology", key: "D" },
          ],
        },
      ],
    });

    expect(result.recommendations[0].triggeredBySummary).toMatch(/\+1$/);
  });

  test("triggeredBySummary is null when triggeredBy is empty", () => {
    const { buildSimpleReport } = load();
    const result = buildSimpleReport({
      ok: true,
      detections: [],
      recommendations: [
        {
          hubspotProduct: "Marketing Hub",
          priority: "high",
          triggeredBy: [],
        },
      ],
    });

    expect(result.recommendations[0].triggeredBySummary).toBeNull();
  });

  // ── buildTopRecommendations ─────────────────────────────────────────────────

  test("topRecommendations is capped at 5 and ordered by priority then hubspotProduct alpha", () => {
    const { buildSimpleReport } = load();

    // Six distinct products so no merging occurs; two at each priority level.
    // Expected order: C Hub (high) → D Hub (high) → B Hub (medium) → E Hub (medium) → A Hub (low)
    // F Hub (low) is cut by the cap of 5.
    const result = buildSimpleReport({
      ok: true,
      detections: [],
      recommendations: [
        { hubspotProduct: "A Hub", priority: "low", triggeredBy: [] },
        { hubspotProduct: "B Hub", priority: "medium", triggeredBy: [] },
        { hubspotProduct: "C Hub", priority: "high", triggeredBy: [] },
        { hubspotProduct: "D Hub", priority: "high", triggeredBy: [] },
        { hubspotProduct: "E Hub", priority: "medium", triggeredBy: [] },
        { hubspotProduct: "F Hub", priority: "low", triggeredBy: [] },
      ],
    });

    const top = result.summary.topRecommendations;
    expect(top).toHaveLength(5);
    expect(top[0].priority).toBe("high");
    expect(top[1].priority).toBe("high");
    // Within same priority, alphabetical by hubspotProduct
    expect(top[0].hubspotProduct).toBe("C Hub");
    expect(top[1].hubspotProduct).toBe("D Hub");
  });

  // ── buildCleanReport ────────────────────────────────────────────────────────

  test("buildCleanReport includes meta with fetch and timings", () => {
    const { buildCleanReport } = load();
    const result = buildCleanReport({
      ok: true,
      detections: [],
      recommendations: [],
      fetch: { status: 200 },
      timings: { totalMs: 500 },
    });

    expect(result.meta).toBeDefined();
    expect(result.meta.fetch).toEqual({ status: 200 });
    expect(result.meta.timings).toEqual({ totalMs: 500 });
  });

  test("buildCleanReport passes null for missing fetch/timings fields", () => {
    const { buildCleanReport } = load();
    const result = buildCleanReport({
      ok: true,
      detections: [],
      recommendations: [],
    });

    expect(result.meta.fetch).toBeNull();
    expect(result.meta.timings).toBeNull();
  });
});
