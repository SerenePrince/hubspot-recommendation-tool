# API Reference

This document is the source-backed HTTP API contract for the backend server. It documents the exact routes and behavior implemented in `src/api/server.js` and `src/api/routes/analyze.js`.

## Base URL

Default local base URL:

```text
http://localhost:3001
```

API routes are available with and without `/api` prefix for health and analyze:

- `/health`, `/api/health`
- `/analyze`, `/api/analyze`

## Global Behavior

- Methods supported by API routes: `GET`
- `OPTIONS` gets `204` preflight response
- API JSON responses include:
  - `Content-Type: application/json; charset=utf-8`
  - `Cache-Control: no-store`
- Server always sets:
  - `X-Request-Id`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer`
  - `X-Frame-Options: DENY`

## Authentication Behavior (Per Route)

Auth is controlled by `AUTH_ENABLED`, `AUTH_USERNAME`, and `AUTH_PASSWORD`.

- If auth is disabled: all routes are open
- If auth is enabled:
  - `/analyze` and `/api/analyze` require Basic Auth
  - static frontend routes require Basic Auth
  - `/health` and `/api/health` are exempt only when `AUTH_ALLOW_HEALTH=1`

On auth failure:

- Status: `401`
- Headers:
  - `WWW-Authenticate: Basic realm="<AUTH_REALM>", charset="UTF-8"`
  - `Cache-Control: no-store`
- Body: plain text `Authentication required`

If auth-failure rate limiting blocks client:

- Status: `429`
- Headers include `Retry-After`
- JSON body:

```json
{
  "ok": false,
  "error": "Too many attempts. Please try again later.",
  "retryAfterSeconds": 60
}
```

## Route: `GET /health` and `GET /api/health`

Purpose: process health probe and manual availability check.

Query params:

- `pretty` (optional, `1` or `true`) pretty-print JSON

Success (`200`):

```json
{
  "ok": true,
  "service": "HubSpot Recommendation Tool API",
  "shuttingDown": false
}
```

During graceful shutdown:

- Status: `503`
- Body:

```json
{
  "ok": false,
  "shuttingDown": true,
  "service": "HubSpot Recommendation Tool API"
}
```

## Route: `GET /analyze` and `GET /api/analyze`

Purpose: analyze a public website URL and return frontend-friendly report.

Query params:

- `url` (required): absolute `http` or `https` URL
- `pretty` (optional): `1` or `true` for formatted JSON
- `includeMeta` (optional): `1` or `true` to include `meta.fetch` and `meta.timings`

Success (`200`) response shape:

```json
{
  "ok": true,
  "apiVersion": "2.0",
  "url": "https://example.com/",
  "finalUrl": "https://example.com/",
  "technologies": [],
  "byGroup": {},
  "recommendations": [],
  "summary": {
    "totals": {
      "technologiesDetected": 0,
      "categories": 0,
      "groups": 0,
      "recommendations": 0,
      "mappedReplacements": {
        "technologiesWithReplacements": 0,
        "totalTechnologies": 0
      }
    },
    "topRecommendations": []
  }
}
```

If `includeMeta=1`, adds:

```json
{
  "meta": {
    "fetch": {},
    "timings": {}
  }
}
```

## Status Codes And Causes

- `200`: successful health or analyze
- `400`: invalid analyze input or SSRF/URL validation failures
  - missing/invalid `url`
  - URL too long (`>2048`)
  - invalid URL format
  - unsupported protocol
  - SSRF blocked host/IP/DNS failure
- `401`: auth required and credentials missing/invalid
- `404`: route not found
- `413`: fetched response exceeded `MAX_FETCH_BYTES` (or external per-resource cap)
- `429`: auth-failure rate limit block
- `500`: uncaught server error
- `502`: upstream fetch failures, unreadable body, redirect issues, too many redirects
- `503`: server shutting down or analysis limiter overloaded
- `504`: fetch timeout

## Response Headers

Common:

- `X-Request-Id`
- `Content-Type` (for JSON responses)
- `Cache-Control: no-store` (JSON)

Conditional:

- `WWW-Authenticate` on `401`
- `Retry-After` on `429`
- CORS headers depending on `CORS_ALLOW_ORIGIN`

## cURL Examples

Health (no auth):

```bash
curl "http://localhost:3001/health"
```

Health pretty:

```bash
curl "http://localhost:3001/api/health?pretty=1"
```

Analyze:

```bash
curl "http://localhost:3001/api/analyze?url=https://react.dev"
```

Analyze with metadata:

```bash
curl "http://localhost:3001/api/analyze?url=https://react.dev&includeMeta=1&pretty=1"
```

Analyze with auth:

```bash
curl -u "$AUTH_USERNAME:$AUTH_PASSWORD" \
  "http://localhost:3001/api/analyze?url=https://react.dev&pretty=1"
```

Analyze with explicit Authorization header:

```bash
curl -H "Authorization: Basic $(printf '%s' "$AUTH_USERNAME:$AUTH_PASSWORD" | base64)" \
  "http://localhost:3001/analyze?url=https://react.dev"
```

Expected auth challenge check:

```bash
curl -i "http://localhost:3001/api/analyze?url=https://react.dev"
```

Non-existent API route:

```bash
curl -i "http://localhost:3001/api/does-not-exist"
```

## Related Docs

- `ARCHITECTURE.md`
- `ENVIRONMENT.md`
- `SECURITY.md`
- `OPERATIONS_GUIDE.md`
