# Handoff Checklist – HubSpot Recommendation Tool

Use this checklist during handoff to ensure the client has everything needed to operate the tool.

## Access & Ownership

- [ ] Confirm the hosting URL is correct and accessible
- [ ] Identify and document the internal technical owner (name/team/queue)
- [ ] Identify escalation path for outages or security concerns

## Deployment

- [ ] Confirm deployment mechanism (Docker Compose / host service / platform)
- [ ] Confirm service starts cleanly after reboot
- [ ] Confirm TLS/HTTPS is enabled at the proxy/host layer

## Authentication & Security

- [ ] Provide shared username/password via a secure channel
- [ ] Confirm auth is enabled (`AUTH_ENABLED=1`)
- [ ] Confirm health endpoints behave as expected (`AUTH_ALLOW_HEALTH`)
- [ ] Confirm auth rate limiting is enabled and configured

## Verification

- [ ] Health check passes: `GET /health`
- [ ] Smoke test passes: `SMOKE_BASE_URL=https://<host> npm run smoke`
- [ ] UI loads and core analysis is usable end-to-end

## Documentation

- [ ] Client guide provided: `docs/CLIENT_GUIDE.md`
- [ ] Ops guide provided: `docs/OPERATIONS_GUIDE.md`
- [ ] Dev guide provided: `docs/DEVELOPER_GUIDE.md`
- [ ] Security model provided: `docs/SECURITY.md`
- [ ] Runbook provided: `docs/RUNBOOK.md`

## Password Rotation Drill (Recommended)

- [ ] Rotate password once in staging/test to confirm the procedure
- [ ] Confirm users can log in with new credentials after restart

---

## Render deployment checklist (if using Render)

- [ ] Service created as a **Web Service** (Docker)
- [ ] Health check path set to `/health`
- [ ] `AUTH_USERNAME` and `AUTH_PASSWORD` set as **Secrets**
- [ ] Confirm login prompt appears on the main URL
- [ ] Confirm `/health` returns 200 without auth
- [ ] Confirm an analysis succeeds from the UI
- [ ] Confirm the client receives:
  - the URL
  - the username/password delivery method (out of band)
  - the Client Guide (non-technical)
