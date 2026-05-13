/**
 * Unit tests for GET /analyze handler.
 *
 * Scope:
 * - query validation: missing URL, invalid format, unsupported protocol, URL > 2048 chars
 * - successful path returns a "clean" report for the frontend
 * - AppError with expose=true passes message through; expose=false shows "Request failed"
 * - non-AppError (generic Error) returns 500
 * - limiter release is always called on both success and error paths
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

  test("successful request acquires limiter, calls analyzeUrl, and returns cleaned report", async () => {
    const release = jest.fn();

    jest.doMock("../src/api/analysisLimiter", () => ({
      analysisLimiter: { acquire: jest.fn(async () => release) },
    }));

    jest.doMock("../src/core/analyzer", () => ({
      analyzeUrl: jest.fn(async () => ({
        ok: true,
        url: "https://example.com/",
        finalUrl: "https://example.com/",
        detections: [{ slug: "React", name: "React", confidence: 90 }],
        recommendations: [
          { hubspotProduct: "Marketing Hub", priority: "high" },
        ],
        summary: { total: 1 },
        groups: {},
        fetch: { status: 200 },
        timings: { totalMs: 123 },
      })),
    }));

    // cleanReport is used to create a frontend-friendly response. We'll validate it's called via its output.
    jest.doMock("../src/core/report/cleanReport", () => ({
      buildSimpleReport: jest.fn((report) => ({
        ok: report.ok,
        url: report.url,
        detections: report.detections,
      })),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();

    await handleAnalyze(
      {},
      res,
      mkUrl("/analyze?url=https://example.com&pretty=1"),
    );

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.body);
    expect(json).toEqual({
      ok: true,
      url: "https://example.com/",
      detections: [{ slug: "React", name: "React", confidence: 90 }],
    });

    // limiter release always called
    expect(release).toHaveBeenCalledTimes(1);
  });

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
      buildSimpleReport: jest.fn(),
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
      buildSimpleReport: jest.fn(),
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
      buildSimpleReport: jest.fn(),
    }));

    const { handleAnalyze } = require("../src/api/routes/analyze");
    const res = mkRes();
    await handleAnalyze({}, res, mkUrl("/analyze?url=https://example.com"));

    expect(res.statusCode).toBe(500);
    const json = JSON.parse(res.body);
    expect(json.ok).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });
});
