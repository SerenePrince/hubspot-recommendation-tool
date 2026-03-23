# Runbook

## Purpose

This runbook is the practical, quick-reference version of the operations docs.

Use it for:

- deployment verification
- smoke testing
- triage during incidents
- common production troubleshooting

This backend is part of a larger project with a Vite frontend and root-level deployment/build configuration.

Important:

- the backend folder does **not** own the Docker build for the full application
- the root project build process is expected to build the frontend
- this backend may then serve the built frontend statically when configured

---

## Quick facts

- server type: minimal Node.js HTTP server
- primary API routes:
  - `GET /health`
  - `GET /api/health`
  - `GET /analyze`
  - `GET /api/analyze`
- optional static frontend serving: yes
- optional HTTP Basic Auth: yes
- auth failure rate limiting: yes, lightweight/in-memory
- startup config validation: yes

---

## Pre-deploy checklist

Before deployment, confirm:

- environment variables are correct
- `npm test` passes
- config validation passes
- auth credentials are set if auth is enabled
- frontend build artifacts exist if static serving is enabled
- `STATIC_DIST_DIR` points to the correct built frontend output
- HTTPS is available at the platform/proxy layer if using Basic Auth

---

## Start commands

From the backend directory:

### Development

```bash id="u3n1wn"
npm run dev
```

````

### Production-style start

```bash id="uv3bta"
npm start
```

Important startup behavior:

- `npm start` runs config validation first
- server exits if required config is invalid
- server exits if auth is enabled but username/password are missing
- technology DB preload is attempted, but preload failure does not stop startup

---

## Health verification

### Expected endpoints

- `/health`
- `/api/health`

### Expected response

```json id="b7f8j1"
{
  "ok": true,
  "service": "HubSpot Recommendation Tool API"
}
```

### Smoke test

```bash id="p3s83e"
curl http://localhost:3001/health
```

Or in deployed form:

```bash id="0jzqn5"
curl https://your-service.example/health
```

---

## Analyze verification

### Example local request

```bash id="p67j29"
curl "http://localhost:3001/api/analyze?url=https://react.dev&pretty=1"
```

### Example deployed request

```bash id="zwds0w"
curl "https://your-service.example/api/analyze?url=https://react.dev&pretty=1"
```

### With Basic Auth

```bash id="4r9w2r"
curl -u "$AUTH_USERNAME:$AUTH_PASSWORD" \
  "https://your-service.example/api/analyze?url=https://react.dev&pretty=1"
```

Expected result:

- HTTP `200`
- valid JSON response
- no auth challenge when credentials are correct

---

## Static frontend verification

Only relevant when static serving is enabled.

### Verify direct frontend load

Open the deployed app root in a browser and confirm:

- the page loads
- CSS and JS assets load
- no obvious missing static files

### Verify SPA fallback

Open a non-root frontend route directly or refresh it in the browser.

Expected result:

- backend serves `index.html`
- app loads rather than returning a 404

### Verify API separation

Confirm that API requests still behave like API routes and do not fall back to the SPA.

Example:

```bash id="8g2nf0"
curl -i "https://your-service.example/api/not-a-route"
```

Expected result:

- HTTP `404`
- JSON response
- not `index.html`

---

## Auth verification

Only relevant when `AUTH_ENABLED=1`.

### Expected behavior

- API routes require valid Basic Auth
- static frontend routes also require valid Basic Auth
- health routes may be public if `AUTH_ALLOW_HEALTH=1`

### Check unauthenticated request

```bash id="f43a95"
curl -i "https://your-service.example/api/analyze?url=https://react.dev"
```

Expected result:

- HTTP `401`
- `WWW-Authenticate` header present

### Check authenticated request

```bash id="4m6ii4"
curl -i -u "$AUTH_USERNAME:$AUTH_PASSWORD" \
  "https://your-service.example/api/analyze?url=https://react.dev"
```

Expected result:

- not `401`
- request proceeds normally

### If repeated failures happen

If auth rate limiting is enabled, repeated bad credentials may trigger:

- HTTP `429`
- `Retry-After` header
- JSON body with `retryAfterSeconds`

---

## Common deploy-day checks

Run these after every deployment.

### 1. Health route

```bash id="db58ec"
curl https://your-service.example/health
```

### 2. API route

```bash id="n7oy8r"
curl "https://your-service.example/api/analyze?url=https://react.dev"
```

### 3. Auth behavior

- confirm protected routes require credentials
- confirm valid credentials work
- confirm health route accessibility matches config

### 4. Frontend behavior

- app root loads
- refresh on SPA route works
- assets load correctly

### 5. Logs

Review request logs for:

- repeated 401s
- repeated 429s
- unexpected 404s
- unexpected 500s
- incorrect health probe paths

---

## Troubleshooting matrix

### Problem: server does not start

Check:

- env vars are present and valid
- `npm start` output for config validation failure
- auth credentials exist if auth is enabled

Likely causes:

- invalid config values
- missing `AUTH_USERNAME`
- missing `AUTH_PASSWORD`

---

### Problem: health checks fail

Check:

- correct route (`/health` or `/api/health`)
- auth configuration
- whether platform health check is sending credentials
- whether `AUTH_ALLOW_HEALTH=1` is needed

Likely causes:

- health check pointed to wrong path
- auth blocks health route
- service not actually listening yet

---

### Problem: API works locally but fails in production

Check:

- deployed env vars
- auth credentials
- reverse proxy or platform routing
- whether the request path changed between local and production

Likely causes:

- missing secrets
- wrong base URL
- proxy configuration mismatch
- production-only auth or CORS settings

---

### Problem: frontend is blank or missing assets

Check:

- frontend was built successfully
- `STATIC_DIST_DIR` is correct
- static serving is enabled
- asset files exist where expected
- browser devtools network panel for missing files

Likely causes:

- wrong build artifact path
- frontend build not copied/mounted to expected directory
- asset path mismatch
- static serving disabled

---

### Problem: frontend loads but route refresh returns 404

Check:

- backend static serving is enabled
- request is a browser HTML navigation request
- path is not being rewritten incorrectly upstream

Likely causes:

- SPA fallback not reached
- proxy intercepting the path
- frontend artifacts missing

---

### Problem: repeated 401 or 429 responses

Check:

- correct auth credentials
- whether browser/client cached old credentials
- whether the auth failure rate limiter is active
- whether a previous bad-credential loop triggered blocking

Likely causes:

- typo in credentials
- stale client credentials
- automated retries with wrong password

---

### Problem: `500 Internal Server Error`

Check:

- request logs
- environment values
- known-good analyze request against a stable target
- whether the issue affects all requests or only specific targets

Likely causes:

- unexpected analyzer failure
- upstream fetch problem
- config edge case
- malformed deployment state

In production, error messages may be intentionally generic, so logs matter.

---

## Recovery steps

### Safe first-response sequence

1. verify `/health`
2. verify auth behavior
3. verify `/api/analyze` with a known-good URL
4. verify static frontend behavior if enabled
5. review structured logs
6. verify env vars and artifact paths
7. only redeploy after identifying the actual failure mode

---

## Recommended known-good test set

Use a small, repeatable smoke test set:

### Health

```bash id="ab1xrw"
curl https://your-service.example/health
```

### Pretty API response

```bash id="cc8j7f"
curl -u "$AUTH_USERNAME:$AUTH_PASSWORD" \
  "https://your-service.example/api/analyze?url=https://react.dev&pretty=1"
```

### SPA route refresh

Manually refresh a non-root frontend route in the browser.

### Invalid API route

```bash id="lhjlwm"
curl -i https://your-service.example/api/does-not-exist
```

Expected result:

- JSON `404`
- no SPA fallback for API paths

---

## Escalation notes

If an issue is not obvious, gather:

- exact request path
- exact status code
- whether auth was enabled
- whether static serving was enabled
- whether the issue affected API only, frontend only, or both
- relevant request logs around the failure
- current env configuration values excluding secrets

This usually narrows the issue quickly without guesswork.

---

## Related documents

- `README.md`
- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `docs/OPERATIONS_GUIDE.md`
- `docs/SECURITY.md`
````
