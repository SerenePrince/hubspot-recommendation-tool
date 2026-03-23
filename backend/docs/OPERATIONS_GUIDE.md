# Operations Guide

## Purpose

This guide covers how to run, configure, monitor, and troubleshoot the backend in development and production-style environments.

This backend is part of a larger application that includes:

- a Vite frontend
- this Node.js backend
- root-level deployment/build configuration

Important operational note:

- this backend folder does **not** own the Docker build for the full app
- the root project Docker setup is responsible for building the frontend
- the backend may then serve the built frontend statically in integrated deployments

---

## Runtime model

The backend can operate in two common modes.

### 1. API-only mode

Used mainly during local backend development.

Typical behavior:

- backend runs on its own
- frontend runs separately on the Vite dev server
- static serving is usually disabled
- CORS may be enabled for local frontend access

### 2. Integrated app mode

Used mainly in production.

Typical behavior:

- frontend is built outside this folder, usually at the root project level
- built frontend assets are made available to the backend
- backend serves API routes and static frontend files
- browser navigation for SPA routes can fall back to `index.html`

---

## Starting the service

From the backend directory:

```bash id="n4q90z"
npm install
cp .env.example .env
npm run dev
```

````

For a production-style start:

```bash id="q9r6gn"
npm start
```

Important startup behavior:

- `npm start` runs config validation first via `prestart`
- if config validation fails, startup should stop
- if auth is enabled but auth credentials are missing, the server refuses to start
- technology database preload is attempted at startup, but preload failure does **not** stop the server

---

## Health checks

The backend exposes:

- `GET /health`
- `GET /api/health`

Expected healthy response:

```json id="e99h5f"
{
  "ok": true,
  "service": "HubSpot Recommendation Tool API"
}
```

### Operational guidance

Use `/health` for:

- platform health checks
- container liveness/readiness style checks
- quick manual verification after deploy

If authentication is enabled:

- health routes can remain public when `AUTH_ALLOW_HEALTH=1`
- this is often the simplest deployment setup for hosting platforms

---

## Core API route

The primary API endpoint is:

- `GET /analyze`
- `GET /api/analyze`

Required query parameter:

- `url`

Useful optional query parameters:

- `pretty=1` or `pretty=true`
- `includeMeta=1`

Example:

```bash id="9bs3mu"
curl "http://localhost:3001/api/analyze?url=https://react.dev&pretty=1"
```

---

## Environment configuration

The backend is environment-driven. Operational behavior is controlled primarily through `.env` values.

### Core runtime

- `PORT`
- `NODE_ENV`
- `REQUEST_LOG`

### Analysis/fetch safety

- `FETCH_TIMEOUT_MS`
- `MAX_FETCH_BYTES`
- `MAX_CONCURRENT_ANALYSES`
- `MAX_QUEUED_ANALYSES`
- `DATA_ROOT`

### Static serving

- `SERVE_STATIC`
- `STATIC_DIST_DIR`
- `STATIC_ASSET_CACHE_SECONDS`

### CORS

- `CORS_ALLOW_ORIGIN`

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

For exact runtime handling, check:

- `src/core/config.js`
- `src/api/server.js`

---

## Static frontend operations

When `SERVE_STATIC=1`, the backend can serve the frontend build output.

Operational expectations:

- `STATIC_DIST_DIR` must point to a valid built frontend directory
- direct file requests are served from that directory
- non-API browser navigation requests may fall back to `index.html`
- HTML responses are not cached
- hashed assets may be cached aggressively

### Common production pattern

1. root project builds the Vite frontend
2. built frontend artifacts are made available to the backend
3. backend serves both:
   - API routes
   - static frontend assets

### Operational checks

After deployment in integrated mode, verify:

- `/health` returns `200`
- `/api/health` returns `200`
- `/api/analyze?...` works
- the frontend loads
- refreshing a frontend route still works
- static assets load correctly
- auth behavior is correct for both API and frontend routes

---

## Authentication operations

Authentication is optional but recommended for production if this app is not otherwise protected.

### Behavior when enabled

- API requests require valid HTTP Basic Auth
- static frontend requests also require valid auth
- health requests may remain public if configured

### Important operational notes

- use Basic Auth only behind HTTPS
- store credentials in deployment secrets, not in committed files
- if credentials are missing while auth is enabled, the server exits at startup
- repeated failed login attempts can trigger temporary IP-based blocking if auth rate limiting is enabled

### Recommended production posture

For a simple deployment:

- enable HTTPS at the hosting/platform layer
- enable backend auth if the app is private
- allow unauthenticated health checks unless your platform setup requires otherwise

---

## Logging

The backend supports lightweight structured request logging.

When enabled, logs can include:

- request id
- method
- path
- status code
- duration

This is useful for:

- deploy verification
- debugging unexpected route behavior
- checking health probe behavior
- confirming auth and static route handling

### Operational note

Because logs are intentionally lightweight, deeper troubleshooting may still require reproducing requests locally or adding temporary diagnostics during development.

---

## CORS operations

CORS is configurable.

Typical usage:

- local dev: permissive or specific frontend origin
- integrated production deployment: same-origin frontend/backend usually means permissive CORS is unnecessary
- special reverse-proxy setups: CORS may be disabled or handled upstream

### Recommendations

- avoid unnecessary wildcard CORS in production
- prefer same-origin serving when possible
- only expose cross-origin access when the deployment actually needs it

---

## Rate limiting and back-pressure

The backend includes lightweight protections in a few areas.

### Auth failure rate limiting

Used to reduce repeated failed authentication attempts.

Characteristics:

- in-memory only
- best effort
- IP-based
- resets on successful auth

### Analysis concurrency controls

The backend also includes analysis limiting/configuration controls to avoid unbounded concurrent processing.

Operationally, these settings matter if:

- many requests arrive at once
- upstream fetches are slow
- the service is deployed on limited infrastructure

---

## Deployment checklist

Before deploying, verify:

- environment variables are set correctly
- auth credentials are present if auth is enabled
- `STATIC_DIST_DIR` is correct if static serving is enabled
- frontend build artifacts exist in the expected location
- config validation passes
- health checks respond correctly
- analysis requests succeed on known test URLs
- HTTPS is enabled at the platform or proxy layer if using Basic Auth

---

## Post-deploy smoke checks

Recommended checks immediately after deployment:

### Backend health

```bash id="mt6w4k"
curl https://your-service.example/health
```

### API health

```bash id="33kk02"
curl https://your-service.example/api/health
```

### Analyze route

```bash id="4jv2ue"
curl "https://your-service.example/api/analyze?url=https://react.dev"
```

### Auth-protected analyze route

```bash id="1q7y5n"
curl -u "$AUTH_USERNAME:$AUTH_PASSWORD" \
  "https://your-service.example/api/analyze?url=https://react.dev&pretty=1"
```

### Frontend route refresh test

Open a non-root frontend route in the browser and refresh the page to confirm SPA fallback is working in integrated mode.

---

## Common operational issues

### 1. Server starts locally but frontend is not served

Possible causes:

- `SERVE_STATIC` is disabled
- `STATIC_DIST_DIR` is wrong
- frontend build artifacts do not exist yet
- frontend was built in the root project but not copied/mounted where the backend expects it

### 2. Health check works but app page returns 404

Possible causes:

- static serving is disabled
- SPA fallback conditions are not being met
- frontend build output is missing
- request is hitting an unexpected path or proxy rule

### 3. Auth appears to block everything

Possible causes:

- wrong username or password
- browser/client not sending auth header
- failed-auth rate limiter has temporarily blocked the client
- health route is not exempt and the platform health check lacks credentials

### 4. Server exits immediately on startup

Possible causes:

- config validation failure
- auth enabled without required credentials
- invalid environment variable values

### 5. Analyze requests are slow or failing

Possible causes:

- upstream site is slow or blocking requests
- fetch timeout too low
- target content too large
- concurrency settings too aggressive for the deployment environment

---

## Incident response suggestions

For a small deployment, practical response steps are:

1. confirm `/health`
2. confirm auth behavior
3. confirm `/api/analyze` on a known-good URL
4. confirm static frontend behavior if enabled
5. inspect structured request logs
6. verify environment variables and build artifact paths
7. redeploy only after reproducing and understanding the failure mode

---

## Recommended production approach

For the current project stage, the most practical setup is:

- root-level Docker builds the frontend
- backend serves the built frontend statically
- HTTPS is terminated by the hosting platform or reverse proxy
- backend auth is enabled if the app is private
- health checks use `/health`
- logging is enabled during deployment and debugging

This approach keeps the architecture simple while matching the current codebase.

---

## Related documents

- `README.md`
- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `docs/RUNBOOK.md`
- `docs/SECURITY.md`
````
