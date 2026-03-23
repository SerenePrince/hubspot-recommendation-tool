# Architecture

## Overview

This backend is part of a larger full-stack project that contains:

- a frontend application built with Vite
- this backend service
- root-level deployment/build configuration

The backend is intentionally small and focused. It is responsible for:

- exposing a minimal HTTP API
- performing website analysis and recommendation generation
- optionally serving the built frontend statically in integrated deployments

The backend does **not** own the full build pipeline for the application. In this project, Docker and frontend build orchestration live at the **root project level**, not inside the backend folder.

---

## High-level project layout

Typical structure:

```text id="u8bh6n"
root/
├── frontend/   # Vite frontend
├── backend/    # Node.js backend
├── Dockerfile  # root-level app build/runtime
└── ...
```

This means the backend should be understood as one part of the overall application, not as a completely standalone deployment unit.

---

## Backend architecture goals

The backend is designed around a few simple goals:

- keep the HTTP surface small
- avoid unnecessary framework complexity
- keep analysis logic separate from transport/server logic
- support both local development and integrated production deployment
- remain easy to reason about and safe to change late in the project

---

## Main runtime responsibilities

### 1. HTTP server layer

The server is a minimal Node.js HTTP server.

Responsibilities:

- parse incoming requests
- apply security-related headers
- apply optional CORS behavior
- enforce optional authentication
- route requests to API handlers
- serve static frontend assets when enabled
- provide a SPA fallback for browser navigation when configured

Main files:

- `src/api/server.js`
- `src/api/static.js`
- `src/api/auth.js`
- `src/api/rateLimit.js`
- `src/api/analysisLimiter.js`

---

### 2. API route layer

The API surface is intentionally small.

Current public routes:

- `GET /health`
- `GET /api/health`
- `GET /analyze`
- `GET /api/analyze`

Main route file:

- `src/api/routes/analyze.js`

This route layer is intentionally thin. It should mostly:

- validate request input
- call the analysis pipeline
- shape HTTP responses
- avoid owning core business logic

---

### 3. Core analysis layer

The analysis logic lives under `src/core/`.

Responsibilities include:

- loading configuration and taxonomy data
- fetching and inspecting target pages
- applying SSRF protections and fetch limits
- detecting technologies
- mapping detections to recommendation logic
- generating response output

Important modules include:

- `src/core/analyzer.js`
- `src/core/config.js`
- `src/core/fetch/fetchPage.js`
- `src/core/fetch/ssrf.js`
- `src/core/detect/detectTechnologies.js`
- `src/core/techdb/loadTechDb.js`
- `src/core/report/mappingValidator.js`
- `src/core/report/recommendations.js`

This separation is important: the HTTP server should stay small, while the analysis pipeline remains testable and reusable.

---

### 4. CLI and developer tooling

The project also includes CLI and utility scripts for development and maintenance.

Responsibilities include:

- local analysis/testing outside the HTTP API
- config validation
- smoke testing
- taxonomy and technology database operations

Relevant files:

- `src/cli/index.js`
- `src/cli/taxonomy.js`
- `src/scripts/validateConfig.js`
- `src/scripts/smokeTest.js`

This helps keep debugging and maintenance workflows separate from the live server path.

---

## Deployment model

### Local development

In local development, the frontend and backend are usually run separately.

Typical setup:

- frontend runs on the Vite dev server
- backend runs independently
- static serving from the backend is usually disabled
- CORS may be enabled to allow frontend-to-backend requests

This mode is useful because it keeps frontend iteration fast while backend behavior remains easy to test independently.

---

### Integrated production deployment

In production, the system is typically run in an integrated way.

Typical flow:

1. the root project builds the frontend
2. the built frontend files are made available to the backend
3. the backend serves:
   - API routes
   - static frontend assets
   - SPA fallback for browser navigation

In this model, the backend acts as the application server for both API traffic and the built frontend.

This is why static serving exists in the backend even though the frontend build process itself happens elsewhere.

---

## Static serving behavior

When enabled, the backend static layer does the following:

- serves direct file requests from the configured dist directory
- only serves `GET` and `HEAD` requests
- prevents path traversal outside the configured root
- applies cache headers based on file type/path
- serves `index.html` as the SPA fallback for non-API browser navigation

Important behavior:

- API routes are handled before SPA fallback
- HTML is served with `no-store`
- hashed frontend assets may be cached aggressively
- static serving is optional and configuration-driven

---

## Authentication model

Authentication is intentionally simple.

The backend supports optional HTTP Basic Authentication.

When enabled:

- API routes require authentication
- static frontend routes also require authentication
- health routes may remain public if configured

A lightweight in-memory failed-auth rate limiter can also be enabled to reduce repeated brute-force attempts.

This model is sufficient for a student-led deployment or internal tool scenario, especially when the service is placed behind HTTPS and platform-level protections.

It is not intended to be a full identity/access management system.

---

## Request flow

### Health request

```text id="nmp58m"
client
  -> backend server
  -> auth check (optional, health may be exempt)
  -> health response
```

### Analyze request

```text id="d5bb3i"
client
  -> backend server
  -> auth check (optional)
  -> route validation
  -> analysis pipeline
  -> JSON response
```

### Frontend navigation request in integrated mode

```text id="a6tv6w"
browser
  -> backend server
  -> auth check (optional)
  -> static file lookup
  -> existing asset response OR SPA fallback (index.html)
```

---

## Configuration model

Configuration is centralized and environment-driven.

The backend uses environment variables to control:

- runtime mode
- fetch and analysis limits
- static serving behavior
- CORS behavior
- authentication
- failed-auth rate limiting
- logging

Main configuration file:

- `src/core/config.js`

This keeps deployment behavior configurable without requiring application code changes.

---

## Error-handling approach

The backend favors a simple and predictable error model:

- route-level validation errors return clear client responses
- unexpected failures return `500`
- production error messages are intentionally generic
- request logging remains structured and lightweight

The system aims for late-project stability over excessive abstraction.

---

## Security considerations

Key security measures currently built into the backend include:

- SSRF protections in fetch logic
- fetch size/time limits
- optional HTTP Basic Auth
- optional failed-auth rate limiting
- path traversal protection in static serving
- conservative default security headers
- optional CORS controls

These protections are intentionally lightweight but practical for the current scope of the project.

---

## Design philosophy

This backend is intentionally not over-engineered.

The current architecture favors:

- clarity over cleverness
- direct modules over heavy abstractions
- stable behavior over large refactors
- deployment practicality over framework complexity

That makes it a good fit for the current project stage, where the priority is to make the existing backend as reliable, readable, and maintainable as possible without introducing last-minute risk.

---

## Related documents

- `README.md`
- `docs/API.md`
- `docs/CLI.md`
- `docs/DEVELOPER_GUIDE.md`
- `docs/OPERATIONS_GUIDE.md`
- `docs/RUNBOOK.md`
- `docs/SECURITY.md`
