// backend/src/api/rateLimit.js
// Simple in-memory rate limiter primarily for throttling failed auth attempts.
// Not intended as a distributed limiter. Best-effort protection against brute-force noise.
//
// Strategy:
// - Track failed attempts per IP in a sliding window.
// - When max failures is exceeded, block for blockMs.
// - Successful auth clears failures for that IP.

function nowMs() {
  return Date.now();
}

function parseForwardedFor(v) {
  if (!v) return "";
  // "client, proxy1, proxy2" -> take first
  const first = String(v).split(",")[0].trim();
  return first;
}

/**
 * Resolves best-effort client IP from common proxy headers or socket address.
 *
 * @param {import("node:http").IncomingMessage} req - Incoming request
 * @returns {string} Client IP string used as rate-limit key
 */
function getClientIp(req) {
  // If you're behind a reverse proxy, ensure it sets X-Forwarded-For / X-Real-IP correctly.
  const xf = parseForwardedFor(req.headers["x-forwarded-for"]);
  const xr =
    req.headers["x-real-ip"] && String(req.headers["x-real-ip"]).trim();
  const remote =
    req.socket && req.socket.remoteAddress
      ? String(req.socket.remoteAddress)
      : "";
  return xf || xr || remote || "unknown";
}

/**
 * Creates an in-memory failed-auth limiter keyed by client IP.
 * State is process-local and resets on restart, so treat it as best-effort protection.
 *
 * @param {{windowMs?: number, maxFailures?: number, blockMs?: number}} [opts] - Limiter thresholds
 * @returns {{getClientIp: Function, isBlocked: Function, recordFailure: Function, recordSuccess: Function, _state: Map<any, any>, _opts: object}} Limiter API and debug state
 */
function createRateLimiter(opts) {
  const windowMs = Number(opts && opts.windowMs) || 60_000;
  const maxFailures = Number(opts && opts.maxFailures) || 12;
  const blockMs = Number(opts && opts.blockMs) || 300_000;

  // ip -> { firstAt, count, blockedUntil, lastSeen }
  const state = new Map();

  function cleanup() {
    // Keep memory bounded: remove entries that haven't been seen in ~2 windows
    const cutoff = nowMs() - Math.max(windowMs * 2, 5 * 60_000);
    for (const [ip, s] of state.entries()) {
      if ((s.lastSeen || 0) < cutoff && (s.blockedUntil || 0) < cutoff) {
        state.delete(ip);
      }
    }
  }

  function isBlocked(ip) {
    const s = state.get(ip);
    if (!s) return { blocked: false, retryAfterSeconds: 0 };
    const n = nowMs();
    if (s.blockedUntil && s.blockedUntil > n) {
      const retry = Math.ceil((s.blockedUntil - n) / 1000);
      return { blocked: true, retryAfterSeconds: retry };
    }
    return { blocked: false, retryAfterSeconds: 0 };
  }

  function recordFailure(ip) {
    const n = nowMs();
    const s = state.get(ip);

    if (!s) {
      state.set(ip, { firstAt: n, count: 1, blockedUntil: 0, lastSeen: n });
      cleanup();
      return isBlocked(ip);
    }

    s.lastSeen = n;

    // Failure window elapsed; start a new one
    if (!s.firstAt || n - s.firstAt > windowMs) {
      s.firstAt = n;
      s.count = 1;
      s.blockedUntil = 0;
      cleanup();
      return isBlocked(ip);
    }

    s.count += 1;

    if (s.count > maxFailures) {
      s.blockedUntil = n + blockMs;
    }

    cleanup();
    return isBlocked(ip);
  }

  function recordSuccess(ip) {
    if (!ip) return;
    state.delete(ip);
  }

  return {
    getClientIp,
    isBlocked,
    recordFailure,
    recordSuccess,
    // for debugging/tests
    _state: state,
    _opts: { windowMs, maxFailures, blockMs },
  };
}

// getClientIp is exposed on each limiter instance (createRateLimiter returns it).
// It is not exported at module level since callers always use the instance method.
module.exports = { createRateLimiter };
