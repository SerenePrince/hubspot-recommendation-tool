# HubSpot Recommendation Tool

This project is the capstone handoff for Team Debug (Algonquin College, Computer Engineering Technology), built for Inbox, a HubSpot Platinum Solutions Partner in Ottawa. It is an internal tool that analyzes a public website URL, detects technologies in use, and returns HubSpot replacement recommendations.

Inbox previously did this work manually during client discovery. This tool reduces that process from hours to seconds by automating fetch, detection, and recommendation steps.

## Start Here (30 seconds)

1. Run with Docker:
   - copy env: `cp .env.example .env`
   - set `AUTH_USERNAME` and `AUTH_PASSWORD`
   - start: `docker compose up --build`
2. Open `http://localhost:3001`
3. Read `backend/docs/DEVELOPER_GUIDE.md` for full dev setup

## Who This Is For

- Inbox internal employees using the tool during prospect audits
- Developers maintaining or extending the codebase after handoff
- IT/admin staff deploying the integrated app with Docker

## Tech Stack

- Frontend: React + Vite SPA (`frontend/`)
- Backend: vanilla Node.js HTTP server, no Express (`backend/`)
- Detection data: local WebAppAnalyzer/Wappalyzer-style dataset (`backend/data/vendor/webappanalyzer/src`)
- Deployment: root `Dockerfile`, `docker-compose.yml`, and `render.yaml`
- Local runtime requirement (non-Docker): Node.js `>=20`

## Run Locally With Docker (5 Steps)

1. Copy the root environment template.

```bash
cp .env.example .env
```

2. Set at least these auth variables in `.env`:

```dotenv
AUTH_ENABLED=1
AUTH_USERNAME=your-user
AUTH_PASSWORD=your-pass
```

3. Build and start the integrated app.

```bash
docker compose up --build
```

4. Open the app UI.

```text
http://localhost:3001
```

5. Verify health.

```bash
curl http://localhost:3001/health
```

## Quick API Example

```bash
curl -u "$AUTH_USERNAME:$AUTH_PASSWORD" \
  "http://localhost:3001/api/analyze?url=https://react.dev&pretty=1&includeMeta=1"
```

## Project Documentation

- Root/client handoff:
  - `CLIENT_GUIDE.md`
- Frontend:
  - `frontend/README.md`
- Backend overview:
  - `backend/README.md`
- Backend deep docs:
  - `backend/docs/ARCHITECTURE.md`
  - `backend/docs/API.md`
  - `backend/docs/DEVELOPER_GUIDE.md`
  - `backend/docs/ENVIRONMENT.md`
  - `backend/docs/SECURITY.md`
  - `backend/docs/OPERATIONS_GUIDE.md`
  - `backend/docs/RUNBOOK.md`
  - `backend/docs/CLI.md`
