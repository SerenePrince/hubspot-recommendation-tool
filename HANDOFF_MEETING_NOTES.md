# Handoff Meeting Talking Points
## HubSpot Recommendation Tool — Team Debug → Inbox Communications

Quick-reference for the handoff meeting. Work through these top to bottom.

---

## 1. Access & Live URL

- **Live URL:** https://hubspot-recommendation-tool.onrender.com/
- Auth is enabled. Credentials are delivered separately (not in any doc or repo).
- Health check (no auth needed): https://hubspot-recommendation-tool.onrender.com/health

---

## 2. Things Inbox Must Do Before Internal Rollout

### Fill in the support contacts in `CLIENT_GUIDE.md` (root)
The three `Inbox to provide` placeholders at the bottom of the client guide need real names/channels before the guide is shared with staff.

### Fill in the handoff email template
`backend/docs/HANDOFF_EMAIL_TEMPLATE.md` has `[Client Name]`, `https://your-deployed-host`, and `[name/team]` placeholders. Complete these before sending.

### Update `render.yaml` if forking the repo
Line 8 of `render.yaml` points to the student's GitHub: `https://github.com/SerenePrince/hubspot-recommendation-tool`. If Inbox forks or transfers the repo, this must be updated to point to their fork before reconnecting the Render service. The comment in the file already says this.

### Auth is off by default — enable it if you need access control
`AUTH_ENABLED=0` is the default. The tool can be used without any login prompt. If Inbox ever wants to restrict access (e.g., staging environment, internal-only deployment), set `AUTH_ENABLED=1` with `AUTH_USERNAME` and `AUTH_PASSWORD` in the Render dashboard or `.env` file. No code changes required.

---

## 3. Render Free Tier — Cold Starts

The live deployment uses Render's **free plan** (`plan: free` in `render.yaml`). Render spins the service down after ~15 minutes of inactivity. The **first request after a cold start can take 30–60 seconds** — this is normal, not a crash. Subsequent requests are fast.

Options if this becomes a problem:
- Upgrade to Render's paid tier (eliminates cold starts).
- Set up an external uptime monitor (e.g., UptimeRobot on a free plan) to ping `/health` every 10 minutes and keep the service warm.

---

## 4. Credential Rotation — How To Change the Password (if auth is enabled)

Auth is off by default. If Inbox enables it:

1. Update `AUTH_USERNAME` and/or `AUTH_PASSWORD` in the Render dashboard (Environment → Secrets).
2. Trigger a redeploy (or Render auto-deploys on save).
3. Verify with: `curl -u "newuser:newpass" "https://hubspot-recommendation-tool.onrender.com/health"`
4. Notify all Inbox staff of the new credentials — there is one shared login for everyone.

**Docker deployment:** Update the same vars in the root `.env` file and run `docker compose up -d`.

---

## 5. The Two Ongoing Maintenance Points

These are the only two files that require manual upkeep after handoff. Everything else is self-contained.

### A. `backend/data/alternatives/hubspot-mapping.json`
The HubSpot recommendation mapping. When Inbox wants to add, remove, or adjust recommendations (e.g., new HubSpot products, updated messaging), they edit this JSON file directly. The schema is straightforward: `byTechnology` and `byCategory` keys, each containing arrays of `{ title, hubspotProduct, priority, description }` objects.

Run `npm run validate-config` after edits to catch schema errors before deploying.

### B. WebAppAnalyzer detection dataset
The technology fingerprinting data lives at `backend/data/vendor/webappanalyzer/src/`. When the upstream Wappalyzer-style dataset receives significant updates (new frameworks, new SaaS tools), Inbox can pull the latest:

```bash
cd backend
npm run update:techdb
```

This runs `src/scripts/update-webappanalyzer-db.sh`, which fetches the latest release from GitHub and replaces the local dataset. Requires `curl`, `python3`, and `unzip`.

> **Tip:** Run this once every few months. New tools that prospects use may not be detected until the dataset is refreshed.

---

## 6. `DEBUG_SIGNALS` Must Stay Off in Production

The `.env.example` shows `DEBUG_SIGNALS=0`. This must never be set to `1` on a deployed instance — it exposes raw internal detection signals in every API response. It is development-only.

---

## 7. If Auth Is Enabled, It Only Works Safely Over HTTPS

Auth is off by default. If it is ever turned on: HTTP Basic Auth sends credentials in Base64 (not encrypted). Render provides HTTPS automatically. If Inbox ever self-hosts with Docker, HTTPS termination at the proxy/load balancer layer is required before auth provides any real protection.

---

## 8. `npm run validate-config` — Run Before Every Deploy

When changing environment variables or the mapping file, run this first:

```bash
cd backend
npm run validate-config
```

It catches mismatched timeouts, missing auth credentials, wrong data paths, and other config errors before they cause a silent failure at runtime.

---

## 9. Smoke Test — Verify Any Deployment in 30 Seconds

```bash
# Against the live Render URL:
cd backend
SMOKE_BASE_URL=https://hubspot-recommendation-tool.onrender.com npm run smoke

# Against a local Docker instance:
SMOKE_BASE_URL=http://localhost:3001 npm run smoke
```

---

## 10. Where the Docs Are

| Audience | Document |
|---|---|
| Inbox staff (end users) | `CLIENT_GUIDE.md` (root) |
| Inbox ops / IT (deployers) | `backend/docs/OPERATIONS_GUIDE.md`, `backend/docs/RUNBOOK.md` |
| Developers extending the tool | `backend/docs/DEVELOPER_GUIDE.md`, `backend/docs/ARCHITECTURE.md` |
| Security overview | `backend/docs/SECURITY.md` |
| Environment variable reference | `backend/docs/ENVIRONMENT.md` |
| API contract | `backend/docs/API.md` |
| CLI usage | `backend/docs/CLI.md` |
| Pre-handoff checklist | `backend/docs/HANDOFF_CHECKLIST.md` |
