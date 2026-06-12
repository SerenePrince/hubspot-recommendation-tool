import { describe, it, expect } from "vitest";
import { mapApiToTableData } from "../mapApiToTableData";

const apiResponse = {
  ok: true,
  url: "https://example.com",
  finalUrl: "https://example.com/",
  technologies: [
    {
      name: "React",
      version: "18.3.1",
      description: "A JavaScript library",
      categories: [{ name: "JavaScript frameworks" }, { name: "Web frameworks" }],
      hubspot: {
        products: [
          { hubspotProduct: "CMS Hub", description: "Primary" },
          { hubspotProduct: "Marketing Hub", description: null },
        ],
      },
    },
    {
      name: "Mystery Tool",
      version: null,
      description: null,
      categories: [],
      hubspot: { products: [] },
    },
  ],
};

describe("mapApiToTableData", () => {
  it("maps each technology to a table row", () => {
    const rows = mapApiToTableData(apiResponse);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      name: "React",
      version: "18.3.1",
      description: "A JavaScript library",
      category: "JavaScript frameworks",
      products: [
        { name: "CMS Hub", description: "Primary" },
        { name: "Marketing Hub", description: null },
      ],
    });
  });

  it("uses only the first category and null when there are none", () => {
    const rows = mapApiToTableData(apiResponse);
    expect(rows[0].category).toBe("JavaScript frameworks");
    expect(rows[1].category).toBeNull();
  });

  it("returns an empty products array for unmapped technologies", () => {
    const rows = mapApiToTableData(apiResponse);
    expect(rows[1].products).toEqual([]);
  });

  it("filters out products missing hubspotProduct", () => {
    const rows = mapApiToTableData({
      technologies: [
        {
          name: "X",
          hubspot: {
            products: [{ description: "orphan" }, { hubspotProduct: "Sales Hub" }],
          },
        },
      ],
    });
    expect(rows[0].products).toEqual([{ name: "Sales Hub", description: null }]);
  });

  it("defaults name to 'Unknown' and tolerates missing fields", () => {
    const rows = mapApiToTableData({ technologies: [{}] });
    expect(rows[0]).toEqual({
      name: "Unknown",
      version: null,
      description: null,
      category: null,
      products: [],
    });
  });

  it("returns [] for null, undefined, or empty responses", () => {
    expect(mapApiToTableData(null)).toEqual([]);
    expect(mapApiToTableData(undefined)).toEqual([]);
    expect(mapApiToTableData({})).toEqual([]);
  });
});
