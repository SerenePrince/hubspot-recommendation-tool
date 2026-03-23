const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

// Small static file helper (no framework) for serving a Vite/React build.
// Supported behavior:
// - Only serves GET/HEAD requests
// - Prevents path traversal outside the configured dist directory
// - Streams files to avoid loading them fully into memory

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isProbablyHashedAssetPath(p) {
  // Vite hashed assets usually look like: /assets/index-abc12345.js
  // This heuristic is only used to decide whether to apply longer cache headers.
  return /\/assets\/.+-[a-f0-9]{8,}\./i.test(p);
}

function safeDecodePathname(requestPathname) {
  try {
    return decodeURIComponent(requestPathname);
  } catch {
    return null;
  }
}

function isPathInsideRoot(rootPath, candidatePath) {
  const normalizedRoot = path.resolve(rootPath);
  const normalizedCandidate = path.resolve(candidatePath);

  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(normalizedRoot + path.sep)
  );
}

function safeJoin(root, requestPathname) {
  // Decode first so encoded traversal attempts are normalized consistently.
  const decoded = safeDecodePathname(requestPathname);
  if (decoded == null) return null;

  // Remove NUL bytes before joining.
  const clean = decoded.replace(/\0/g, "");

  // Join against the configured root and verify the final resolved path
  // remains inside that root.
  const joined = path.join(root, clean);
  if (!isPathInsideRoot(root, joined)) return null;

  return path.resolve(joined);
}

async function fileExists(p) {
  try {
    const st = await fsp.stat(p);
    return st.isFile();
  } catch {
    return false;
  }
}

function sendFile(res, absPath, { cacheControl }) {
  const ext = path.extname(absPath).toLowerCase();

  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  if (cacheControl) {
    res.setHeader("Cache-Control", cacheControl);
  }

  // Stream the file for memory safety.
  const stream = fs.createReadStream(absPath);
  stream.on("error", () => {
    // If the file disappears mid-stream, send a minimal 500 response when possible.
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end("Internal server error");
  });

  stream.pipe(res);
}

/**
 * Attempts to serve a static file.
 * Returns true if a response was sent.
 */
async function tryServeStatic(req, res, requestUrl, options) {
  const { distDir, assetCacheSeconds } = options;

  if (req.method !== "GET" && req.method !== "HEAD") return false;
  if (!distDir) return false;

  // Try to resolve the exact requested path first.
  let target = safeJoin(distDir, requestUrl.pathname);
  if (!target) return false;

  // If the request path points to a directory, fall back to its index.html.
  if (requestUrl.pathname.endsWith("/")) {
    target = path.join(target, "index.html");
  }

  if (!(await fileExists(target))) {
    return false;
  }

  // Cache hashed assets aggressively; keep HTML un-cached.
  const isHtml = target.endsWith(path.sep + "index.html") || target.endsWith(".html");
  const cacheControl = isHtml
    ? "no-store"
    : isProbablyHashedAssetPath(requestUrl.pathname)
      ? `public, max-age=${assetCacheSeconds}, immutable`
      : "public, max-age=300";

  if (req.method === "HEAD") {
    res.statusCode = 200;

    const ext = path.extname(target).toLowerCase();
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    if (cacheControl) {
      res.setHeader("Cache-Control", cacheControl);
    }

    res.end();
    return true;
  }

  sendFile(res, target, { cacheControl });
  return true;
}

/**
 * Serves the SPA fallback by returning dist/index.html for non-API GET routes.
 * Returns true if served.
 */
async function tryServeSpaFallback(req, res, options) {
  const { distDir } = options;

  if (req.method !== "GET") return false;
  if (!distDir) return false;

  const indexPath = path.join(distDir, "index.html");
  if (!(await fileExists(indexPath))) return false;

  // Always disable caching for HTML; the build pipeline controls cache busting.
  sendFile(res, indexPath, { cacheControl: "no-store" });
  return true;
}

module.exports = {
  tryServeStatic,
  tryServeSpaFallback,
};