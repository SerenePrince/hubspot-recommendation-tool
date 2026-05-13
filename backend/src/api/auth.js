// backend/src/api/auth.js
const { timingSafeEqual } = require("node:crypto");

/**
 * Very small HTTP Basic Auth helper (no framework).
 *
 * Notes:
 * - Only meaningful over HTTPS (TLS). Do NOT use this over plain HTTP on the public internet.
 * - This is intended as a lightweight gate to reduce casual/accidental access.
 */

function parseBasicAuth(headerValue) {
  if (!headerValue) return null;
  const s = String(headerValue);
  const m = /^Basic\s+(.+)$/i.exec(s);
  if (!m) return null;

  let decoded;
  try {
    decoded = Buffer.from(m[1], "base64").toString("utf8");
  } catch {
    return null;
  }

  const idx = decoded.indexOf(":");
  if (idx < 0) return null;

  return {
    username: decoded.slice(0, idx),
    password: decoded.slice(idx + 1),
  };
}

function safeEq(a, b) {
  // Constant-time comparison reduces timing side-channel leakage during credential checks.
  // timingSafeEqual requires same-length buffers.
  const ba = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Validates HTTP Basic credentials from request headers.
 *
 * @param {import("node:http").IncomingMessage} req - Incoming request
 * @param {string} expectedUser - Expected username from config
 * @param {string} expectedPass - Expected password from config
 * @returns {boolean} True when parsed credentials match expected values
 */
function isAuthorized(req, expectedUser, expectedPass) {
  const creds = parseBasicAuth(req.headers.authorization);
  if (!creds) return false;
  return (
    safeEq(creds.username, expectedUser) && safeEq(creds.password, expectedPass)
  );
}

/**
 * Sends HTTP Basic auth challenge response.
 *
 * @param {import("node:http").ServerResponse} res - Response writer
 * @param {string} [realm="Restricted"] - Realm label shown to clients
 * @returns {void}
 */
function sendAuthChallenge(res, realm = "Restricted") {
  res.statusCode = 401;
  res.setHeader(
    "WWW-Authenticate",
    `Basic realm="${String(realm).replace(/"/g, "")}", charset="UTF-8"`,
  );
  res.setHeader("Cache-Control", "no-store");
  res.end("Authentication required");
}

module.exports = { isAuthorized, sendAuthChallenge };
