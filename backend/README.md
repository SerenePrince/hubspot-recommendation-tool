# Backend Documentation

This backend is the analysis engine and HTTP API for the HubSpot Recommendation Tool. It runs a five-phase detection pipeline, returns a frontend-friendly report, and can optionally serve the built frontend.

It is a vanilla Node.js server (`http.createServer`) with no Express framework.

## Operating Modes

### API-only mode (development)

- Run backend directly from `backend/`
- Frontend runs separately via Vite dev server
- Usually `SERVE_STATIC=0`

### Integrated mode (production)

- Root-level Docker build compiles frontend
- Backend serves frontend files + API from one process
- `SERVE_STATIC=1` and `STATIC_DIST_DIR` set to frontend build path

## What This Backend Does

- Exposes `GET /health`, `GET /api/health`, `GET /analyze`, and `GET /api/analyze`
- Runs analysis pipeline:
  1. load technology DB
  2. fetch page with SSRF checks
  3. normalize signals
  4. detect technologies with matcher set
  5. enrich/group/summarize and build recommendations
- Applies optional HTTP Basic Auth for API and static routes
- Applies in-memory auth-failure rate limiting when enabled
- Applies in-memory analysis concurrency/queue limits

## Local Run

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend default URL:

```text
http://localhost:3001
```

## NPM Scripts

From `backend/package.json`:

- `npm run dev`: start API server
- `npm run dev:api`: start API server (alias)
- `npm start`: run `prestart` then start API server
- `npm run prestart`: runs `npm run validate-config`
- `npm run validate-config`: validate env and required files
- `npm run smoke`: smoke test (`analyzeUrl` direct mode by default; API mode with `SMOKE_BASE_URL`)
- `npm run test`: Jest test run
- `npm run test:watch`: Jest watch mode
- `npm run test:coverage`: Jest coverage run
- `npm run cli:check`: CLI smoke check (help, taxonomy, and all format/flag combinations)
- `npm run cli`: CLI analyzer (`src/cli/index.js`)
- `npm run cli:help`: CLI help
- `npm run cli:human`: CLI human format
- `npm run cli:pretty`: CLI pretty JSON format
- `npm run cli:tax`: taxonomy dump CLI
- `npm run update:techdb`: run dataset update shell script

## Auth Behavior Summary

- Auth is controlled by `AUTH_ENABLED`
- If enabled and credentials are missing, server exits at startup
- Auth gate covers:
  - API routes
  - static frontend routes
- Health can remain public if `AUTH_ALLOW_HEALTH=1`
- On bad/missing credentials:
  - `401` with `WWW-Authenticate`
- If auth rate limiter blocks:
  - `429` + `Retry-After` + JSON retry payload

## Related Docs

- Architecture: `docs/ARCHITECTURE.md`
- API contract: `docs/API.md`
- Developer setup and extension: `docs/DEVELOPER_GUIDE.md`
- Environment variables: `docs/ENVIRONMENT.md`
- Security model: `docs/SECURITY.md`
- Operations and troubleshooting: `docs/OPERATIONS_GUIDE.md`
- Quick operational checklist: `docs/RUNBOOK.md`
- CLI details: `docs/CLI.md`
