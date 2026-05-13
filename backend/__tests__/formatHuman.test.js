/**
 * Unit tests for cli/formatHuman.
 *
 * Covers:
 * - Output structure: title box and section headers are present
 * - Technologies table: correct column headers, row data, blank HubSpot column when unmapped
 * - Recommendations table: correct column headers and row data
 * - Coverage summary line: mapped/total count
 * - No-recommendation row: blank replacement cell, unmapped names in summary
 * - Inspect mode: found tech renders detail block; missing tech renders not-found message
 * - Wide mode: columns not truncated
 * - Wrap mode: accepted without error
 * - Top Recommendations: priority-sorted list renders correctly
 * - Graceful handling of empty/null input
 */
const { formatHuman } = require("../src/cli/formatHuman");

// Minimal report shapes used across tests
function mkReport(overrides = {}) {
  return {
    ok: true,
    url: "https://example.com/",
    finalUrl: "https://example.com/",
    technologies: [],
    recommendations: [],
    summary: {
      totals: { detections: 0, categories: 0, groups: 0 },
    },
    ...overrides,
  };
}

function mkTech(name, overrides = {}) {
  return {
    name,
    slug: name,
    confidence: 90,
    version: null,
    categories: [],
    groups: [],
    hubspot: { primaryProduct: null, products: [] },
    ...overrides,
  };
}

function mkRec(hubspotProduct, priority, triggeredBy = []) {
  return { hubspotProduct, priority, triggeredBy };
}

describe("cli/formatHuman - output structure", () => {
  test("includes a title box and URL metadata lines", () => {
    const out = formatHuman(mkReport());
    expect(out).toMatch(/HubSpot Recommendation Tool/);
    expect(out).toMatch(/URL: https:\/\/example\.com\//);
  });

  test("includes Technologies and Recommendations section headers", () => {
    const out = formatHuman(mkReport());
    expect(out).toContain("== Technologies (0) ==");
    expect(out).toContain("== Recommendations (0) ==");
  });

  test("includes Top Recommendations section", () => {
    const out = formatHuman(mkReport());
    expect(out).toContain("== Top Recommendations ==");
  });

  test("handles null/undefined report without throwing", () => {
    expect(() => formatHuman(null)).not.toThrow();
    expect(() => formatHuman(undefined)).not.toThrow();
    expect(() => formatHuman({})).not.toThrow();
  });
});

describe("cli/formatHuman - technologies table", () => {
  test("renders correct column headers", () => {
    const out = formatHuman(mkReport({ technologies: [mkTech("WordPress")] }));
    expect(out).toContain("Technology");
    expect(out).toContain("Version");
    expect(out).toContain("Category");
    expect(out).toContain("HubSpot Recommendation");
  });

  test("renders technology name in the table", () => {
    const out = formatHuman(mkReport({ technologies: [mkTech("WordPress")] }));
    expect(out).toContain("WordPress");
  });

  test("renders version when present", () => {
    const out = formatHuman(
      mkReport({ technologies: [mkTech("WordPress", { version: "6.4" })] })
    );
    expect(out).toContain("6.4");
  });

  test("renders category name when present", () => {
    const out = formatHuman(
      mkReport({
        technologies: [mkTech("WordPress", { categories: [{ name: "CMS" }] })],
      })
    );
    expect(out).toContain("CMS");
  });

  test("renders mapped HubSpot product when tech has hubspot.products", () => {
    const tech = mkTech("WordPress", {
      hubspot: {
        primaryProduct: "Content Hub",
        products: [{ hubspotProduct: "Content Hub" }],
      },
    });
    const out = formatHuman(mkReport({ technologies: [tech] }));
    expect(out).toContain("Content Hub");
  });

  test("renders blank HubSpot Recommendation cell for unmapped technology", () => {
    const out = formatHuman(
      mkReport({ technologies: [mkTech("ObscureTool")] })
    );
    // The replacement cell should be empty — row present but no product text
    expect(out).toContain("ObscureTool");
    // Mapped count should be 0
    expect(out).toMatch(/Mapped replacements: 0\/1/);
  });
});

describe("cli/formatHuman - coverage summary", () => {
  test("shows correct mapped/total count when all techs are mapped", () => {
    const tech = mkTech("Mailchimp", {
      hubspot: {
        primaryProduct: "Marketing Hub",
        products: [{ hubspotProduct: "Marketing Hub" }],
      },
    });
    const out = formatHuman(mkReport({ technologies: [tech] }));
    expect(out).toMatch(/Mapped replacements: 1\/1/);
  });

  test("shows correct mapped/total count when some techs are unmapped", () => {
    const mapped = mkTech("WordPress", {
      hubspot: {
        primaryProduct: "Content Hub",
        products: [{ hubspotProduct: "Content Hub" }],
      },
    });
    const unmapped = mkTech("ObscureTool");
    const out = formatHuman(mkReport({ technologies: [mapped, unmapped] }));
    expect(out).toMatch(/Mapped replacements: 1\/2/);
  });

  test("lists unmapped technology names in the summary", () => {
    const out = formatHuman(
      mkReport({ technologies: [mkTech("ObscureTool")] })
    );
    expect(out).toContain("ObscureTool");
    expect(out).toMatch(/No replacement mapped for:/);
  });
});

describe("cli/formatHuman - recommendations table", () => {
  test("renders correct column headers", () => {
    const rec = mkRec("Sales Hub", "high");
    const out = formatHuman(mkReport({ recommendations: [rec] }));
    expect(out).toContain("Product");
    expect(out).toContain("Priority");
    expect(out).toContain("Description");
  });

  test("renders product and priority in recommendation table", () => {
    const rec = mkRec("Sales Hub", "high");
    const out = formatHuman(mkReport({ recommendations: [rec] }));
    expect(out).toContain("Sales Hub");
    expect(out).toContain("high");
  });

  test("renders description when present", () => {
    const rec = { hubspotProduct: "Sales Hub", priority: "high", description: "Automate your pipeline.", triggeredBy: [] };
    const out = formatHuman(mkReport({ recommendations: [rec] }));
    expect(out).toContain("Automate your pipeline.");
  });

  test("renders 'No HubSpot recommendations were triggered.' when list is empty", () => {
    const out = formatHuman(mkReport({ recommendations: [] }));
    expect(out).toContain("No HubSpot recommendations were triggered.");
  });
});

describe("cli/formatHuman - top recommendations", () => {
  test("lists top recommendations sorted by priority", () => {
    const recs = [
      mkRec("Service Hub", "low"),
      mkRec("Sales Hub", "high"),
      mkRec("Marketing Hub", "medium"),
    ];
    const out = formatHuman(mkReport({ recommendations: recs }));
    // High rec should appear before low rec in the Top Recommendations section
    const topSection = out.split("== Technologies")[0];
    const highIdx = topSection.indexOf("Sales Hub");
    const lowIdx = topSection.indexOf("Service Hub");
    expect(highIdx).toBeGreaterThan(-1);
    expect(highIdx).toBeLessThan(lowIdx);
  });

  test("shows 'No HubSpot recommendations were triggered.' in top section when empty", () => {
    const out = formatHuman(mkReport());
    expect(out).toContain("No HubSpot recommendations were triggered.");
  });
});

describe("cli/formatHuman - inspect mode", () => {
  test("renders technology detail block when found", () => {
    const tech = mkTech("WordPress", {
      version: "6.4",
      categories: [{ name: "CMS" }],
      hubspot: {
        primaryProduct: "Content Hub",
        products: [{ hubspotProduct: "Content Hub" }],
      },
    });
    const recs = [
      {
        hubspotProduct: "Content Hub",
        priority: "high",
        description: "Move your site to HubSpot.",
        triggeredBy: [{ triggerType: "technology", key: "WordPress" }],
      },
    ];
    const out = formatHuman(mkReport({ technologies: [tech], recommendations: recs }), {
      inspect: "WordPress",
    });

    expect(out).toContain("Inspect: WordPress");
    expect(out).toContain("Technology: WordPress");
    expect(out).toContain("Version: 6.4");
    expect(out).toContain("Categories: CMS");
  });

  test("renders not-found message when inspect target is missing", () => {
    const out = formatHuman(mkReport({ technologies: [] }), {
      inspect: "NonExistentTech",
    });
    expect(out).toContain("No detected technology matched: NonExistentTech");
  });

  test("inspect mode shows triggered recommendations for the technology", () => {
    const tech = mkTech("Zendesk", { categories: [{ name: "Helpdesk" }] });
    const recs = [
      {
        hubspotProduct: "Service Hub",
        priority: "high",
        description: "Use HubSpot Service Hub.",
        triggeredBy: [{ triggerType: "technology", key: "Zendesk" }],
      },
    ];
    const out = formatHuman(mkReport({ technologies: [tech], recommendations: recs }), {
      inspect: "Zendesk",
      mode: "wide",
    });

    expect(out).toContain("Service Hub");
    expect(out).toContain("Use HubSpot Service Hub.");
  });
});

describe("cli/formatHuman - display modes", () => {
  test("wide mode does not truncate long cell content", () => {
    const longName = "A".repeat(80);
    const tech = mkTech(longName);
    const out = formatHuman(mkReport({ technologies: [tech] }), { mode: "wide" });
    expect(out).toContain(longName);
  });

  test("wrap mode runs without error", () => {
    const tech = mkTech("WordPress");
    expect(() =>
      formatHuman(mkReport({ technologies: [tech] }), { mode: "wrap" })
    ).not.toThrow();
  });

  test("truncate mode (default) runs without error", () => {
    const tech = mkTech("WordPress");
    expect(() =>
      formatHuman(mkReport({ technologies: [tech] }))
    ).not.toThrow();
  });

  test("includes footer tip lines", () => {
    const out = formatHuman(mkReport());
    expect(out).toContain("--inspect");
    expect(out).toContain("--wide");
  });
});
