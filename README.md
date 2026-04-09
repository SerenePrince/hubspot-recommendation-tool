# HubSpot Recommendation Tool (Full-Stack)

This application analyzes a website URL, detects the technologies in use (Wappalyzer-style patterns), and generates HubSpot-focused recommendations.

## Quick start (Docker, 3–5 steps)

1) Clone the repo

2) Create your environment file:

```bash
cp .env.example .env
```

3) Edit `.env` and set:

- `AUTH_USERNAME`
- `AUTH_PASSWORD`

4) Build + run:

```bash
docker compose up --build
```

5) Open:

- App UI: `http://localhost:3001`
- Health: `http://localhost:3001/health`

## Example usage (API)

```bash
curl -u "$AUTH_USERNAME:$AUTH_PASSWORD" \
  "http://localhost:3001/api/analyze?url=https://react.dev&pretty=1"
```

## Configuration

- Authoritative env var reference: `backend/docs/ENVIRONMENT.md`
- Ops + troubleshooting: `backend/docs/OPERATIONS_GUIDE.md`, `backend/docs/RUNBOOK.md`
- Security posture: `backend/docs/SECURITY.md`

## Client handoff

- Client-friendly guide: `CLIENT_GUIDE.md`

## Developer onboarding

- Start here: `backend/docs/DEVELOPER_GUIDE.md`
- Architecture overview: `backend/docs/ARCHITECTURE.md`
- API reference: `backend/docs/API.md`
