# Testing Guide

This project intentionally keeps the API surface small. The most important production checks are:

- `/health` returns 200
- `/analyze` works for a normal public website URL
- Static frontend loads and can call `/analyze`

---

## 1) Local smoke test (Node)

```bash
cd backend
npm install
npm run smoke
```

This tests:

- `GET /health`
- `GET /analyze?url=...`

---

## 2) Docker smoke test (local)

### Start

```bash
cp .env.example .env
# set AUTH_USERNAME / AUTH_PASSWORD in .env
docker compose up -d --build
```

### Health (should be 200 without auth)

```bash
curl -i http://localhost:3001/health
```

### Auth gate (only applies when `AUTH_ENABLED=1`)

```bash
# Without credentials — should be 401 when auth is enabled:
curl -i http://localhost:3001/

# With credentials — should be 200:
curl -i -u "$AUTH_USERNAME:$AUTH_PASSWORD" http://localhost:3001/
```

> Auth is off by default (`AUTH_ENABLED=0`). Skip these steps unless auth is enabled.

---

## 3) Manual UI test

Open:

- `http://localhost:3001/`

Confirm:

- Browser prompts for login
- After login, the page loads
- Running an analysis returns a result

---

## 4) Production sanity checks (Render)

In Render:

- Set Health Check Path to `/health`
- Confirm deploy succeeds (service becomes “Live”)

Then:

- Open the Render URL and confirm login prompt appears
- Run one analysis request from the UI

If deploy fails, check Render logs for:

- `FATAL: AUTH_ENABLED=1 but AUTH_USERNAME/AUTH_PASSWORD are missing...`
