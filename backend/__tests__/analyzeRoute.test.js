/**
 * Unit tests for GET /analyze handler.
 *
 * Scope:
 * - query validation: missing URL, invalid format, unsupported protocol, URL > 2048 chars
 * - successful path returns the slimmed frontend report from buildFrontendReport
 * - htmlTruncated: true is forwarded through the response when the page was truncated
 * - AppError with expose=true passes message through; expose=false shows "Request failed"
 * - non-AppError (generic Error) returns 500
 * - limiter release is always called on both success and error paths
 *
 * Note: the route now imports buildFrontendReport (not buildSimpleReport). Mocks
 * must export buildFrontendReport so the route's require() resolves correctly.
 * buildSimpleReport is an internal detail of cleanReport.js and is never imported
 * directly by the route.
 */
describe("api/routes/analyze - handleAnalyze", () => {
  function mkRes() {
    return {
      statusCode: 0,
      headers: {},
      body: "",
      setHeader(k, v) {
        this.headers[String(k).toLowerCase()] = v;
      },
      end(body) {
        this.body = body || "";
      },
    };
  }

  function mkUrl(path) {
    return new URL(path, "http://localhost");
  }

  beforeEach(() => {
    jest.resetModules();
  });

  // ── URL validation ────────────────────────────────────────────────────────

  test("returns 400 when url param is missing", async () => {
    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn() },
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze"));

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/missing or invalid/i);
  });

  test("returns 400 when url protocol is not http(s)", async () => {
    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn() },
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze?url=ftp://example.com"));

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.body);
    expect(json.error).toMatch(/only http/i);
  });

  test("returns 400 when URL exceeds 2048 characters", async () => {
    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn() },
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    const longUrl = "https://example.com/" + "a".repeat(2100);
    await handleAnalyze(
      {},
      res,
      mkUrl(`/analyze?url=${encodeURIComponent(longUrl)}`),
    );

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/too long/i);
  });

  test("returns 400 when URL format is not parseable", async () => {
    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn() },
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze?url=not-a-valid-url-at-all"));

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/invalid url/i);
  });

  // ── Successful path ───────────────────────────────────────────────────────

  test("successful request acquires limiter, calls analyzeUrl, and returns slimmed frontend report", async () => {
    const release = jest.fn();

    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn(async () => release) },
    }));

    jest.doMock("../src/core/analyzer", () => ({
      analyzeUrl: jest.fn(async () => ({
        ok: true,
        url: "https://example.com/",
        finalUrl: "https://example.com/",
        htmlTruncated: false,
        detections: [{ name: "React", confidence: 90 }],
        recommendations: [
          { hubspotProduct: "Marketing Hub", priority: "high" },
        ],
        summary: { total: 1 },
        groups: {},
        fetch: { status: 200 },
        timings: { totalMs: 123 },
      })),
    }));

    // The route imports buildFrontendReport — mock must export that name.
    // We return a representative slimmed shape so the test verifies both that
    // buildFrontendReport is called and that its output is what gets serialised.
    jest.doMock("../src/core/report/cleanReport", () => ({
      buildFrontendReport: jest.fn((report) => ({
        ok: report.ok,
        url: report.url,
        finalUrl: report.finalUrl,
        technologies: [],
        htmlTruncated: report.htmlTruncated,
      })),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();

    await handleAnalyze({}, res, mkUrl("/analyze?url=https://example.com"));

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json).toEqual({
      ok: true,
      url: "https://example.com/",
      finalUrl: "https://example.com/",
      technologies: [],
      htmlTruncated: false,
    });

    // Limiter release must always be called (even on success)
    expect(release).toHaveBeenCalledTimes(1);
  });

  test("response is compact JSON — no whitespace indentation", async () => {
    const release = jest.fn();

    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn(async () => release) },
    }));
    jest.doMock("../src/core/analyzer", () => ({
      analyzeUrl: jest.fn(async () => ({ ok: true })),
    }));
    jest.doMock("../src/core/report/cleanReport", () => ({
      buildFrontendReport: jest.fn(() => ({ ok: true })),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze?url=https://example.com"));

    // Compact JSON must not contain newlines or multi-space indentation
    expect(res.body).not.toMatch(/\n/);
    expect(res.body).not.toMatch(/  /);
  });

  test("htmlTruncated: true is forwarded through the response when page was truncated", async () => {
    const release = jest.fn();

    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn(async () => release) },
    }));
    jest.doMock("../src/core/analyzer", () => ({
      analyzeUrl: jest.fn(async () => ({
        ok: true,
        url: "https://big-site.com/",
        finalUrl: "https://big-site.com/",
        htmlTruncated: true,
      })),
    }));
    jest.doMock("../src/core/report/cleanReport", () => ({
      buildFrontendReport: jest.fn((report) => ({
        ok: report.ok,
        url: report.url,
        finalUrl: report.finalUrl,
        technologies: [],
        htmlTruncated: report.htmlTruncated,
      })),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze?url=https://big-site.com"));

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json.htmlTruncated).toBe(true);
  });

  // ── Error handling ────────────────────────────────────────────────────────

  test("operational AppError maps to its statusCode and expose behavior", async () => {
    const release = jest.fn();

    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn(async () => release) },
    }));

    const { AppError } = require("../src/core/errors");
    jest.doMock("../src/core/analyzer", () => ({
      analyzeUrl: jest.fn(async () => {
        throw new AppError({
          code: "FETCH_TIMEOUT",
          message: "Fetch timed out",
          statusCode: 504,
          expose: true,
        });
      }),
    }));
    jest.doMock("../src/core/report/cleanReport", () => ({
      buildFrontendReport: jest.fn(),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();

    await handleAnalyze({}, res, mkUrl("/analyze?url=https://example.com"));

    expect(res.statusCode).toBe(504);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Fetch timed out");

    expect(release).toHaveBeenCalledTimes(1);
  });

  test("AppError with expose=false returns 'Request failed' not the internal message", async () => {
    const release = jest.fn();

    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn(async () => release) },
    }));

    const { AppError } = require("../src/core/errors");
    jest.doMock("../src/core/analyzer", () => ({
      analyzeUrl: jest.fn(async () => {
        throw new AppError({
          code: "INTERNAL",
          message: "Secret internal detail",
          statusCode: 500,
          expose: false,
        });
      }),
    }));
    jest.doMock("../src/core/report/cleanReport", () => ({
      buildFrontendReport: jest.fn(),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze?url=https://example.com"));

    expect(res.statusCode).toBe(500);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Request failed");
    expect(JSON.stringify(json)).not.toContain("Secret internal detail");
    expect(release).toHaveBeenCalledTimes(1);
  });

  test("non-AppError returns 500 and always releases the limiter", async () => {
    const release = jest.fn();

    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn(async () => release) },
    }));

    jest.doMock("../src/core/analyzer", () => ({
      analyzeUrl: jest.fn(async () => {
        throw new Error("Unexpected crash");
      }),
    }));
    jest.doMock("../src/core/report/cleanReport", () => ({
      buildFrontendReport: jest.fn(),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze?url=https://example.com"));

    expect(res.statusCode).toBe(500);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  test("limiter release is called even when buildFrontendReport throws", async () => {
    const release = jest.fn();

    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn(async () => release) },
    }));
    jest.doMock("../src/core/analyzer", () => ({
      analyzeUrl: jest.fn(async () => ({ ok: true })),
    }));
    jest.doMock("../src/core/report/cleanReport", () => ({
      buildFrontendReport: jest.fn(() => {
        throw new Error("report builder crash");
      }),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze?url=https://example.com"));

    expect(res.statusCode).toBe(500);
    expect(release).toHaveBeenCalledTimes(1);
  });
});
