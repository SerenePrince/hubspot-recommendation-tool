# Client Guide (Non-Technical)

This guide is for **non-technical users** and client stakeholders.

- If you just want to **use** the application, start with **“Using the app”**.
- If your team needs to **run** the application (IT/admin), use **“Running the app (Docker)”**.

---

## What this application does (plain English)

You paste a website address into the app. The app:

1. Visits that website using only publicly available information
2. Detects which technologies the site appears to use (for example: analytics tools, CMS platforms, marketing tools)
3. Produces a report and recommends HubSpot alternatives where available

Important notes:

- It does **not** log in to the target site.
- It does **not** require credentials for the target site.
- Results are “best effort” because websites can block automated requests or hide signals.

---

## Using the app

### 1) Open the app link

Your team will provide a URL that looks like:

- `https://<your-domain>` (preferred), or
- a hosted service URL (for example, Render)

Open it in Chrome, Edge, Firefox, or Safari.

### 2) Log in (if prompted)

You may see a browser login prompt. If so, enter the **shared username and password** provided by your administrator.

If you are not prompted but expected to be, contact your administrator.

### 3) Run an analysis

1. Paste a full website URL (example: `https://example.com`)
2. Click **Analyze**
3. Wait for results

If an error appears, copy the error text and send it to your support contact.

---

## Running the app (Docker) — IT/Admin steps

These steps are for someone who can run Docker on a server or workstation.

### Prerequisites

- Install Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Ensure the machine can reach the public internet (the app fetches public websites)

### 1) Create the configuration file

In the project root, create a `.env` file.

Minimum recommended settings:

```dotenv
AUTH_ENABLED=1
AUTH_USERNAME=change-me
AUTH_PASSWORD=change-me
AUTH_ALLOW_HEALTH=1

PORT=3001
NODE_ENV=production
REQUEST_LOG=1
SERVE_STATIC=1
```

Notes:

- Treat `AUTH_USERNAME` and `AUTH_PASSWORD` as secrets.
- In real deployments, set these through your hosting platform’s “secrets” UI rather than committing them.

### 2) Start the app

From the project root:

```bash
docker compose up --build
```

### 3) Verify it is running

- App: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

To verify from a terminal:

```bash
curl http://localhost:3001/health
```

---

## Configuration changes (safe guidance)

### Changing the login credentials

- Update `AUTH_USERNAME` / `AUTH_PASSWORD`
- Restart the service (Docker restart / redeploy)

### Changing timeouts and safety limits

If your environment is slow or you see timeouts, your operator can adjust fetch limits.

The authoritative configuration reference is:

- `backend/docs/ENVIRONMENT.md`

---

## Deployment overview (high level)

This application can run on:

- A single VM/server with Docker
- A managed container hosting platform (for example, Render)

Recommended deployment posture:

- Use **HTTPS**
- Keep **Basic Auth enabled** (unless protected upstream)
- Keep `/health` available if the hosting platform requires it

---

## Troubleshooting (common issues)

### “Authentication required” or repeated login prompts

- Confirm you are using the correct credentials
- If credentials were recently changed, close and reopen the browser and try again

### “Invalid URL format”

- Ensure the URL starts with `https://` (or `http://`)
- Try opening the URL in a browser tab first

### “Request failed” / “Internal server error”

Common causes:

- The target website blocked automated requests
- Temporary network issues
- The service is overloaded or misconfigured

What to send support:

- The exact URL you tried to analyze
- The time it happened
- A screenshot of the error

---

## Support contact (fill this in before handoff)

- Name:
- Email:
- Hours:
