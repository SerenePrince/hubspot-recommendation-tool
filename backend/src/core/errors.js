// backend/src/core/errors.js

/**
 * Minimal error taxonomy for production.
 *
 * - AppError: operational errors with a statusCode and safeMessage
 * - All other errors are treated as internal (500)
 */

class AppError extends Error {
  /**
   * @param {object} opts
   * @param {string} opts.code - stable machine-readable code
   * @param {string} opts.message - developer-facing message
   * @param {number} opts.statusCode - HTTP status for API
   * @param {boolean} opts.expose - whether message is safe to expose to clients
   * @param {Error} [opts.cause]
   */
  constructor({ code, message, statusCode, expose, cause } = {}) {
    super(message || "Error");
    this.name = "AppError";
    this.code = typeof code === "string" ? code : "APP_ERROR";
    this.statusCode = Number.isFinite(statusCode) ? statusCode : 500;
    this.expose = Boolean(expose);
    if (cause) this.cause = cause;
  }
}

/**
 * Type guard for operational errors that carry HTTP semantics.
 *
 * @param {unknown} err - Unknown thrown value
 * @returns {boolean} True when the value is an AppError instance shape
 */
function isAppError(err) {
  return Boolean(err && typeof err === "object" && err.name === "AppError" && "statusCode" in err);
}

/**
 * Helper for common 4xx operational errors.
 *
 * @param {string} code - Stable machine-readable error code
 * @param {string} message - Client-safe error message
 * @returns {AppError} 400 AppError marked safe to expose
 */
function badRequest(code, message) {
  return new AppError({ code, message, statusCode: 400, expose: true });
}

/**
 * Builds a 429 operational error.
 *
 * @param {string} code - Stable machine-readable error code
 * @param {string} message - Client-safe error message
 * @returns {AppError} 429 AppError marked safe to expose
 */
function tooManyRequests(code, message) {
  return new AppError({ code, message, statusCode: 429, expose: true });
}

/**
 * Builds a 503 operational error.
 *
 * @param {string} code - Stable machine-readable error code
 * @param {string} message - Client-safe error message
 * @returns {AppError} 503 AppError marked safe to expose
 */
function serviceUnavailable(code, message) {
  return new AppError({ code, message, statusCode: 503, expose: true });
}

module.exports = { AppError, isAppError, badRequest, tooManyRequests, serviceUnavailable };
