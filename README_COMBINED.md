# Combined App Deployment Guide

This document describes how the **full application** is deployed from the root project.

The root project contains:

- a **frontend** built with Vite
- a **backend** built with Node.js
- root-level deployment files such as:
  - `Dockerfile`
  - `docker-compose.yml`
  - `render.yaml`

In production, the frontend is built first, and the backend serves the frontend build output statically.

---

## Project layout

Typical structure:

```text
root/
├── frontend/              # Vite frontend
├── backend/               # Node.js backend
├── Dockerfile             # root-level multi-stage build
├── docker-compose.yml     # local combined-container run
├── render.yaml            # Render deployment config
└── README_COMBINED.md
```

---

## Deployment model

The application is deployed as a **single containerized app**.

### Build flow

1. the frontend is built from the root Docker context
2. the backend dependencies are installed
3. the final runtime image contains:
   - backend source
   - backend dependencies
   - backend data
   - frontend build output

### Runtime flow

At runtime:

- the backend starts the Node.js server
- the backend serves API routes
- the backend also serves the built frontend statically
- SPA browser navigation can fall back to `index.html`

This is why the backend does not need its own Dockerfile inside the backend folder.

---

## What the Dockerfile does

The root `Dockerfile` uses a multi-stage build:

### Stage 1: frontend build

- installs frontend dependencies
- runs the Vite production build
- produces the frontend `dist/` output

### Stage 2: backend dependencies

- installs backend production dependencies
- prepares the backend runtime dependency layer

### Stage 3: final runtime image

- copies backend source and data
- copies frontend build output
- sets runtime environment variables
- starts the backend server

The backend then serves the built frontend from:

```text
STATIC_DIST_DIR=/app/frontend/dist
```

---

## Local Docker usage

To run the combined app locally with Docker Compose:

```bash
docker compose up --build
```

This will:

- build the full application from the root
- run the backend on port `3001`
- serve the frontend through the backend
- load runtime variables from:

```text
./.env
```

### Local URL

```text
http://localhost:3001
```

### Notes

- health route: `http://localhost:3001/health`
- API health route: `http://localhost:3001/api/health`
- analyze route: `http://localhost:3001/api/analyze?url=https://react.dev`
- if auth is enabled, protected routes require Basic Auth credentials
- for local Docker testing, you can either:
  - set `AUTH_ENABLED=0`, or
  - keep `AUTH_ENABLED=1` and provide `AUTH_USERNAME` / `AUTH_PASSWORD` in the root `.env`

---

## Environment configuration

The combined deployment mainly relies on backend runtime configuration.

In local Compose usage, Docker loads variables from:

```text
./.env
```

Important runtime values include:

### Static serving

- `SERVE_STATIC=1`
- `STATIC_DIST_DIR=/app/frontend/dist`

### Core runtime

- `PORT=3001`
- `NODE_ENV=production`
- `REQUEST_LOG=1`

### Auth

- `AUTH_ENABLED=1`
- `AUTH_USERNAME=...`
- `AUTH_PASSWORD=...`
- `AUTH_REALM=Internal Tool`
- `AUTH_ALLOW_HEALTH=1`

### Fetch / analysis limits

- `FETCH_TIMEOUT_MS`
- `MAX_FETCH_BYTES`
- `MAX_CONCURRENT_ANALYSES`
- `MAX_QUEUED_ANALYSES`

### Data path

- `DATA_ROOT=/app/backend/data/vendor/webappanalyzer/src`

---

## Authentication behavior

The backend supports optional HTTP Basic Authentication.

When enabled in the combined deployment:

- API routes require valid credentials
- frontend/static routes also require valid credentials
- health routes may remain public if `AUTH_ALLOW_HEALTH=1`

### Recommendation

Use Basic Auth only behind HTTPS in deployed environments.

For local Docker use, Basic Auth is fine for simple access control during testing.

---

## Health checks

Supported health endpoints:

- `/health`
- `/api/health`

Expected response:

```json
{
  "ok": true,
  "service": "HubSpot Recommendation Tool API"
}
```

These endpoints are useful for:

- local smoke tests
- platform health checks
- deployment verification

---

## Example local checks

### Health check

```bash
curl http://localhost:3001/health
```

### API health check

```bash
curl http://localhost:3001/api/health
```

### Analyze request

```bash
curl "http://localhost:3001/api/analyze?url=https://react.dev&pretty=1"
```

### Analyze request with auth

```bash
curl -u "$AUTH_USERNAME:$AUTH_PASSWORD" \
  "http://localhost:3001/api/analyze?url=https://react.dev&pretty=1"
```

---

## Render deployment

The root project also includes a `render.yaml` for deployment configuration.

Typical Render approach:

- deploy as a web service
- use the root `Dockerfile`
- expose port `3001`
- set secrets such as:
  - `AUTH_USERNAME`
  - `AUTH_PASSWORD`
- use `/health` as the health check route

### Production recommendations

- terminate HTTPS at Render
- keep auth enabled if the app is private
- store credentials as secrets, not in committed files
- verify static frontend serving after deployment
- verify SPA route refresh behavior after deployment

---

## Common issues

### Frontend does not load

Check:

- frontend built successfully in Docker
- `SERVE_STATIC=1`
- `STATIC_DIST_DIR=/app/frontend/dist`
- backend server started correctly

### Frontend loads but route refresh fails

Check:

- SPA fallback behavior
- static build output exists
- request is reaching the backend correctly

### Health works but app/API fails

Check:

- auth settings
- environment values
- backend logs
- frontend asset availability
- analyze route behavior separately from frontend behavior

### Auth blocks everything

Check:

- `AUTH_USERNAME`
- `AUTH_PASSWORD`
- `AUTH_ALLOW_HEALTH`
- whether the client is sending valid credentials

---

## Practical deployment checklist

Before deploying the combined app, verify:

- frontend builds successfully
- backend tests pass
- backend config validation passes
- Docker image builds successfully
- auth secrets are configured
- health route works
- frontend loads
- SPA route refresh works
- analyze endpoint works on a known-good URL

---

## Related documents

- `backend/README.md`
- `backend/docs/API.md`
- `backend/docs/ARCHITECTURE.md`
- `backend/docs/OPERATIONS_GUIDE.md`
- `backend/docs/RUNBOOK.md`
- `backend/docs/SECURITY.md`
