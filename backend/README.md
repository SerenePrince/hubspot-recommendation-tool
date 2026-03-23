# Backend – HubSpot Recommendation Tool

This backend is a minimal Node.js HTTP server (no Express) for the HubSpot Recommendation Tool.

It is responsible for:

- exposing a small HTTP API
- running the website analysis and recommendation logic
- optionally serving the built frontend statically when `SERVE_STATIC=1`

## Project structure

This backend lives inside a larger root project that also contains the frontend.

Typical layout:

```text
root/
├── frontend/   # Vite frontend
├── backend/    # this project
├── Dockerfile  # root-level Docker build for the full app
└── ...
```

Important deployment note:

- the backend itself does **not** contain Docker files
- the root project Docker setup builds the Vite frontend
- the built frontend is then served statically by this backend in production

That means this backend can be run in two modes:

1. **API-only mode**
   - useful during backend development
   - frontend runs separately on the Vite dev server

2. **Combined mode**
   - used in production
   - backend serves both the API and the built frontend

---

## Features

- minimal Node.js HTTP server
- no Express dependency
- small API surface
- optional static frontend hosting
- optional HTTP Basic Auth
- failed-auth rate limiting
- config validation before startup
- CLI utilities for local analysis/testing

---

## API endpoints

The backend currently supports these routes:

- `GET /health`
- `GET /api/health`
- `GET /analyze?url=<https://...>`
- `GET /api/analyze?url=<https://...>`

### Health response

Example:

```json
{
  "ok": true,
  "service": "HubSpot Recommendation Tool API"
}
```

### Analyze query parameters

- `url` (**required**) — target URL to analyze
- `pretty` (optional) — use `1` or `true` for pretty-printed JSON
- `includeMeta` (optional) — include extra metadata when supported by the analyzer route

Example:

```http
GET /api/analyze?url=https://react.dev&pretty=1&includeMeta=1
```

---

## Authentication

This backend supports optional **HTTP Basic Authentication**.

When enabled:

- API routes require valid credentials
- static frontend routes also require valid credentials
- health routes can remain public if `AUTH_ALLOW_HEALTH=1`

Important:

- Basic Auth is only appropriate when the app is served over **HTTPS**
- for production, credentials should come from environment variables or deployment secrets
- if auth is enabled but credentials are missing, the server refuses to start

---

## Static frontend serving

When `SERVE_STATIC=1`, the backend serves a built frontend from `STATIC_DIST_DIR`.

Typical production flow:

- the root project builds the Vite frontend
- the built files are placed in the configured static directory
- this backend serves those files directly
- non-API browser navigation requests can fall back to `index.html` for SPA routing

Notes:

- hashed frontend assets can be cached aggressively
- HTML is served with `no-store`
- static serving is optional and should usually be enabled in production only

---

## Environment configuration

Copy the example environment file before running locally:

```bash
cp .env.example .env
```

Key environment variables include:

### Core runtime

- `PORT` — backend port (default: `3001`)
- `NODE_ENV` — runtime environment
- `REQUEST_LOG` — enable structured request logging

### Analysis/fetching

- `FETCH_TIMEOUT_MS`
- `MAX_FETCH_BYTES`
- `MAX_CONCURRENT_ANALYSES`
- `MAX_QUEUED_ANALYSES`
- `DATA_ROOT`

### Static serving

- `SERVE_STATIC` — enable static frontend serving
- `STATIC_DIST_DIR` — path to built frontend output
- `STATIC_ASSET_CACHE_SECONDS` — cache duration for hashed assets

### CORS

- `CORS_ALLOW_ORIGIN`
  - `*` for simple local development
  - set a specific origin for tighter control
  - set to `off` to disable CORS headers entirely

### Authentication

- `AUTH_ENABLED`
- `AUTH_USERNAME`
- `AUTH_PASSWORD`
- `AUTH_REALM`
- `AUTH_ALLOW_HEALTH`

### Failed-auth rate limiting

- `AUTH_RATE_LIMIT_ENABLED`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX_FAILURES`
- `AUTH_RATE_LIMIT_BLOCK_MS`

For the full current behavior, see:

- `src/core/config.js`
- `docs/API.md`
- `docs/SECURITY.md`

---

## Local development

### 1. Backend only

From the backend directory:

```bash
cp .env.example .env
npm install
npm run dev
```

This starts the backend on:

```text
http://localhost:3001
```

### 2. Frontend during development

The frontend is developed separately from the backend during local development.

From the frontend directory:

```bash
npm install
npm run dev
```

In that setup:

- frontend runs on the Vite dev server
- backend runs separately
- static serving from this backend is usually disabled

---

## Production / integrated app behavior

In production, the intended setup is different from local dev:

- the frontend is built at the **root project level**
- the root Docker setup handles the frontend build
- the backend is configured to serve the built frontend statically

So even though this backend has static-serving support, the Docker build and frontend artifact preparation happen outside this folder.

---

## Scripts

Available npm scripts:

```bash
npm run dev
npm run dev:api
npm run start
npm run validate-config
npm run smoke
npm run test
npm run test:watch
npm run test:coverage
npm run cli
npm run cli:help
npm run cli:human
npm run cli:pretty
npm run cli:tax
npm run update:techdb
```

### Notes

- `npm start` runs `validate-config` first via `prestart`
- `npm run smoke` performs a lightweight smoke test
- CLI commands are useful for local inspection/testing outside the HTTP API

---

## Production deployment notes

### Docker

Docker for the full app is handled from the **root project**, not from this backend folder.

That root-level setup is expected to:

- build the frontend
- make the built frontend available to the backend
- run this backend as the application server

### Render

A common deployment pattern is a single web service with:

- TLS handled by Render
- `AUTH_ENABLED=1`
- `AUTH_USERNAME` and `AUTH_PASSWORD` stored as secrets
- health check pointed at `/health`

---

## Health and operations

Operational recommendations:

- keep `/health` available for container/platform health checks unless you have a specific reason to protect it
- enable auth in production
- serve the app behind HTTPS
- review `docs/RUNBOOK.md` and `docs/OPERATIONS_GUIDE.md` before deployment

---

## Related documentation

- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `docs/CLI.md`
- `docs/DEVELOPER_GUIDE.md`
- `docs/OPERATIONS_GUIDE.md`
- `docs/RUNBOOK.md`
- `docs/SECURITY.md`

---

## Summary

This backend is intentionally small and focused.

It is designed to:

- keep the API surface stable
- support a Vite frontend in integrated deployments
- remain easy to run locally
- avoid unnecessary framework complexity
- be straightforward to deploy behind a root-level Docker setup
