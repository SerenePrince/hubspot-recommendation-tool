# HubSpot Recommendation Tool

Paste in a prospect's website URL and instantly see what technologies they use — and which HubSpot products could replace them.

Built as a capstone project by Team Debug (Algonquin College) for Inbox, a HubSpot Platinum Solutions Partner in Ottawa.

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Node](https://img.shields.io/badge/Node-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)](https://docker.com)

## Demo

**Live:** https://hubspot-recommendation-tool.onrender.com/

## What It Does

Inbox previously identified replacement opportunities manually during client discovery calls. This tool automates the entire process: fetch the target site, fingerprint its technology stack using a Wappalyzer-style detection engine, and map each detected tool to the HubSpot product that could replace it — in seconds.

Key capabilities:

- Detects hundreds of technologies via a 10-matcher fingerprint pipeline (HTTP headers, script sources, DOM, cookies, meta tags, inline scripts, CSS, and more)
- Maps detections to HubSpot products via a configurable JSON file — no code changes required to add or update recommendations
- Optional HTTP Basic Auth with in-memory failed-auth rate limiting
- CLI tool for running analyses directly from the terminal
- Single-container Docker deployment; live instance hosted on Render

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/noahparknguyen/hubspot-recommendation-tool.git
cd hubspot-recommendation-tool
cp .env.example .env
docker compose up --build
```

Open http://localhost:3001 or verify the API:

```bash
curl http://localhost:3001/health
```

Optional: enable auth in `.env` before starting:

```dotenv
AUTH_ENABLED=1
AUTH_USERNAME=your-user
AUTH_PASSWORD=your-pass
```

### Local development

```bash
# Backend (terminal 1)
cd backend && npm install && npm run dev

# Frontend (terminal 2)
cd frontend && npm install && npm run dev
```

Frontend runs at http://localhost:5173 and proxies `/api` to the backend at http://localhost:3001.

### Quick API call

```bash
curl "http://localhost:3001/api/analyze?url=https://react.dev"
```

## Tech Stack

| Layer          | Technology                                                                               |
| -------------- | ---------------------------------------------------------------------------------------- |
| Frontend       | React 18, Vite 7                                                                         |
| Backend        | Node.js 20 (vanilla `http` — no framework)                                               |
| Detection data | [WebAppAnalyzer](https://github.com/enthec/webappanalyzer) fingerprint dataset (GPL-3.0) |
| HTML parsing   | Cheerio                                                                                  |
| Testing        | Jest                                                                                     |
| Deployment     | Docker, Render                                                                           |

## Documentation

Full docs live in `backend/docs/`:

| File                  | Contents                                      |
| --------------------- | --------------------------------------------- |
| `ARCHITECTURE.md`     | Five-phase analysis pipeline and request flow |
| `API.md`              | Endpoint contracts and response shapes        |
| `DEVELOPER_GUIDE.md`  | Local setup, extension guide, adding matchers |
| `ENVIRONMENT.md`      | All environment variables and defaults        |
| `SECURITY.md`         | SSRF protection, auth model, rate limiting    |
| `OPERATIONS_GUIDE.md` | Deployment, monitoring, troubleshooting       |
| `RUNBOOK.md`          | Quick operational checklist                   |
| `CLI.md`              | CLI usage and flags                           |

Client-facing guides: [`CLIENT_GUIDE.md`](CLIENT_GUIDE.md), [`TEAM_GUIDE.md`](TEAM_GUIDE.md)

## Third-Party Licenses

The technology fingerprint dataset in `backend/data/vendor/webappanalyzer/` is sourced from [WebAppAnalyzer](https://github.com/enthec/webappanalyzer) (enthec) and licensed under [GPL-3.0](https://github.com/enthec/webappanalyzer/blob/main/LICENSE). See [`NOTICE`](NOTICE) for full details.

---

Capstone project · Team Debug · Algonquin College Computer Engineering Technology · Built for Inbox
