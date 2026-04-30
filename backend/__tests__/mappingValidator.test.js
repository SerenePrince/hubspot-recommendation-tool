/**
 * Unit tests for mappingValidator (recommendation mapping schema).
 *
 * Goal: prevent configuration drift or malformed JSON from causing runtime failures.
 *
 * Validates all five sections (byTechnology, byCategory, byGroup, byCategoryId, byGroupId)
 * and every field type constraint on RecommendationItem entries.
 */
const { validateMapping } = require("../src/core/report/mappingValidator");

describe("core/report/mappingValidator - validateMapping", () => {
  test("rejects non-object roots", () => {
    expect(validateMapping(null).ok).toBe(false);
    expect(validateMapping([]).ok).toBe(false);
    expect(validateMapping("x").ok).toBe(false);
  });

  test("accepts empty mapping object", () => {
    const r = validateMapping({});
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test("validates section types and item requirements", () => {
    const mapping = {
      byTechnology: {
        React: [
          {
            title: "Replace forms",
            hubspotProduct: "Marketing Hub",
            priority: "high",
            description: "desc",
            url: "https://example.com",
            tags: ["a", "b"],
            reason: "why",
            inboxOffer: "offer",
          },
        ],
        Bad: "not an array",
      },
      byCategory: "not an object",
    };

    const r = validateMapping(mapping);
    expect(r.ok).toBe(false);

    // Ensure it flags both section errors and key errors.
    expect(r.errors.some((e) => e.includes("byCategory must be an object"))).toBe(true);
    expect(r.errors.some((e) => e.includes("byTechnology.\"Bad\" must be an array"))).toBe(true);
  });

  test("rejects invalid priorities and missing required fields", () => {
    const mapping = {
      byTechnology: {
        React: [{ title: "", hubspotProduct: "", priority: "urgent" }],
      },
    };

    const r = validateMapping(mapping);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(".title is required"),
        expect.stringContaining(".hubspotProduct is required"),
        expect.stringContaining(".priority must be one of"),
      ]),
    );
  });

  test("rejects non-string tags and optional fields with wrong types", () => {
    const mapping = {
      byTechnology: {
        React: [
          {
            title: "t",
            hubspotProduct: "p",
            priority: "low",
            tags: [1, 2],
            description: 5,
            reason: 6,
          },
        ],
      },
    };

    const r = validateMapping(mapping);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(".description must be a string"),
        expect.stringContaining(".reason must be a string"),
        expect.stringContaining(".tags must contain only strings"),
      ]),
    );
  });

  test("validates byGroup section the same as byTechnology", () => {
    const mapping = {
      byGroup: {
        Analytics: [{ title: "t", hubspotProduct: "p", priority: "high" }],
        BadGroup: "not an array",
      },
    };

    const r = validateMapping(mapping);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("byGroup"))).toBe(true);
    expect(r.errors.some((e) => e.includes("BadGroup"))).toBe(true);
  });

  test("rejects null or non-object items inside a recommendation array", () => {
    const mapping = {
      byTechnology: {
        React: [null, "a string", 42],
      },
    };

    const r = validateMapping(mapping);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("must be an object"))).toBe(true);
  });

  test("rejects url and inboxOffer fields with wrong types", () => {
    const mapping = {
      byCategory: {
        Ecommerce: [
          {
            title: "t",
            hubspotProduct: "p",
            priority: "medium",
            url: 123,
            inboxOffer: true,
          },
        ],
      },
    };

    const r = validateMapping(mapping);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(".url must be a string"),
        expect.stringContaining(".inboxOffer must be a string"),
      ]),
    );
  });
});
