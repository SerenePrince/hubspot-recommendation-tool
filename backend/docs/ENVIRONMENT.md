# Environment Variables (Authoritative Reference)

This document is the **single source of truth** for backend environment variables.

- Developers: read this before editing `.env` or adding new configuration.
- Operators: use this to configure Docker/Render/CI secrets consistently.

If a setting is described differently elsewhere, **this file wins**.

---

## Quick start (safe defaults)

### API-only (local dev)

- `SERVE_STATIC=0`
- `AUTH_ENABLED=0` (or enable it if you want parity with production)
- `CORS_ALLOW_ORIGIN=*` (or set to your Vite dev server origin)

### Integrated app mode (production-style)

- `SERVE_STATIC=1`
- `AUTH_ENABLED=1` (recommended unless protected upstream)
- **HTTPS required** if using Basic Auth
- Prefer same-origin frontend+backend; avoid permissive CORS

---

## Core runtime

- **`PORT`** (number, default `3001`)
  - Port the backend HTTP server listens on.

- **`NODE_ENV`** (string, default `development`)
  - Affects error message exposure and other “production vs dev” behaviors.

- **`REQUEST_LOG`** (`1|0`, default `0`)
  - Enables lightweight JSON request logs.

---

## Data / technology database

- **`DATA_ROOT`** (path, default `./data/vendor/webappanalyzer/src` resolved from process cwd)
  - Points to the WebAppAnalyzer/Wappalyzer-style dataset source directory.
  - Must contain:
    - `categories.json`
    - `groups.json`
    - `technologies/_.json` and `technologies/a.json` … `technologies/z.json`

---

## Fetch + analysis safety

- **`FETCH_TIMEOUT_MS`** (number, default `12000`)
  - Hard wall-clock deadline shared across the primary fetch + best-effort external JS/CSS fetches.

- **`MAX_FETCH_BYTES`** (number, default `2000000`)
  - Maximum bytes read for the primary HTML document response body.

- **`MAX_CONCURRENT_ANALYSES`** (number, default `8`)
  - Concurrency cap for `/analyze` to prevent resource exhaustion.

- **`MAX_QUEUED_ANALYSES`** (number, default `32`)
  - Queue size cap for pending analyses; rejects requests when exceeded.

---

## Static frontend serving (integrated mode)

- **`SERVE_STATIC`** (`1|0`, default `0`)
  - Enables serving the built frontend and SPA fallback behavior.

- **`STATIC_DIST_DIR`** (path, default `./public` resolved from process cwd)
  - Path to the built frontend output directory (e.g. Vite `dist/`).

- **`STATIC_ASSET_CACHE_SECONDS`** (number, default \(30 days\))
  - Cache duration for hashed/static assets.
  - HTML (`index.html`) is still served with `no-store`.

---

## CORS

- **`CORS_ALLOW_ORIGIN`** (string, default `*`)
  - `*` for local development simplicity.
  - Set to a specific origin for tighter production hardening if needed.
  - Set to `off` to disable CORS headers entirely.

---

## Authentication (HTTP Basic Auth)

- **`AUTH_ENABLED`** (`1|0`, default `0`)
  - When enabled, both API routes and static frontend routes require Basic Auth.

- **`AUTH_USERNAME`** (string, **required when** `AUTH_ENABLED=1`)
- **`AUTH_PASSWORD`** (string, **required when** `AUTH_ENABLED=1`)
  - Treat both as secrets; do not commit them.

- **`AUTH_REALM`** (string, default `Internal Tool`)
  - Shown in browser credential prompts.

- **`AUTH_ALLOW_HEALTH`** (`1|0`, default `1`)
  - Allows `/health` and `/api/health` to remain public for platform probes.

---

## Failed-auth rate limiting (best-effort, in-memory)

- **`AUTH_RATE_LIMIT_ENABLED`** (`1|0`, default `1`)
- **`AUTH_RATE_LIMIT_WINDOW_MS`** (number, default `60000`)
- **`AUTH_RATE_LIMIT_MAX_FAILURES`** (number, default `12`)
- **`AUTH_RATE_LIMIT_BLOCK_MS`** (number, default `300000`)

Notes:

- These limits are per-process and reset on restart.
- For stronger guarantees, enforce rate limiting at the reverse proxy / hosting layer.

---

## HTTP server timeouts (defensive)

- **`HTTP_REQUEST_TIMEOUT_MS`** (number, default `30000`)
- **`HTTP_HEADERS_TIMEOUT_MS`** (number, default `35000`)
- **`HTTP_KEEP_ALIVE_TIMEOUT_MS`** (number, default `5000`)
- **`HTTP_MAX_REQUESTS_PER_SOCKET`** (number, default `100`)

---

## Internal debugging

- **`DEBUG_SIGNALS`** (`1|0`, default `0`)
  - Adds `_debugSignals` into the internal report output (not required by the UI).
