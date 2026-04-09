# Developer Guide – HubSpot Recommendation Tool

## 1. Purpose

This guide is for developers maintaining or extending the HubSpot Recommendation Tool.

It includes:

- Local setup
- Key environment variables
- How frontend and backend integrate
- Authentication and rate limiting details
- CLI and scripts (smoke test, config validation)

## 2. Architecture Summary (Dev View)

- **Frontend:** React + Vite SPA
- **Backend:** Vanilla Node.js server (no Express)
  - Serves the SPA build output (`dist`)
  - Protects routes with shared Basic Auth (optional)
  - Implements rate limiting for failed auth attempts
  - Loads and queries a local dataset (read-only)
- **Dataset:** Public, stored locally under `DATA_ROOT`

For more detail: `ARCHITECTURE.md`

## 3. Local Setup

### 3.1 Prerequisites

- Node.js >= 20
- npm
- Docker (recommended for production parity)

### 3.2 Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 3.3 Frontend

```bash
cd frontend
npm install
npm run dev
```

In production, the frontend is built and served by the backend.
In development, you may run the Vite dev server and point it at the backend API.

## 4. Environment Variables (Common)

Environment variables are the primary configuration interface for this project.

For the **authoritative** and complete list (including defaults and operator guidance), see:

- `docs/ENVIRONMENT.md`

## 5. Authentication & Route Protection

When `AUTH_ENABLED=1`:

- Static assets and SPA fallback are protected
- API endpoints are protected
- Health endpoints may be exempted (default)

Auth uses:

- `Authorization: Basic ...`
- Constant-time credential comparison
- `WWW-Authenticate` challenge for browser login prompt

## 6. SPA Routing Behavior

In production:

- Backend serves `index.html` and static assets
- Non-API routes fall back to `index.html` so deep links work

## 7. Dataset Lifecycle

- Loaded at startup into memory
- Queried during analysis
- No persistence; restart resets in-memory state

If dataset files are missing/invalid, `validate-config` fails before `start`.

## 8. Backend Scripts & CLI

### 8.1 Start server

- `npm run dev` – dev mode
- `npm start` – production-style start (runs `validate-config` first)

### 8.2 Validate configuration

- `npm run validate-config`

Validates:

- Required env vars are present
- `DATA_ROOT` exists
- Required dataset files exist (taxonomy + technologies)

### 8.3 Smoke test

- `npm run smoke`

Modes:

- **Direct mode (default):** runs the analysis function directly (no server needed)
- **API mode:** set `SMOKE_BASE_URL` to hit a running server:
  ```bash
  SMOKE_BASE_URL=http://localhost:3000 npm run smoke
  ```

Optional:

- `SMOKE_URL=https://react.dev` targets a different URL.

### 8.4 CLI

- `npm run cli -- <url> [flags]`

Supported flags (most common):

- `--format json|json-pretty|human`
- `--human` (alias for `--format human`)
- `--pretty` (alias for `--format json-pretty`)
- `--raw` (prints full internal report)
- `--inspect <tech>` (human format exploration)
- `--wide`, `--wrap`, `--max-width <n>` (human output formatting)

Examples:

```bash
npm run cli -- https://react.dev
npm run cli:pretty -- https://react.dev
npm run cli:human -- https://react.dev --wide
npm run cli -- https://react.dev --format human --inspect WordPress --wrap
```

There is also a taxonomy helper:

- `npm run cli:tax`

## 9. Extending the System Safely

Guidelines when adding features:

- Enforce auth checks on new endpoints
- Validate and sanitize inputs
- Avoid blocking the event loop with heavy CPU work
- Keep the tool read-only unless requirements change intentionally

If you need persistence, user accounts, or audit logs, plan a redesign (DB + SSO + roles).
