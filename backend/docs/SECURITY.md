# Security

## Purpose

This document describes the current security posture of the backend and the practical security expectations for deployment.

This project is a student-led application, so the goal is not to present it as an enterprise security platform. The goal is to make the current backend as safe, clear, and deployment-ready as possible without introducing high-risk late-stage changes.

---

## Security model overview

The backend uses a lightweight, practical security model built around:

- small API surface area
- constrained server behavior
- input validation
- upstream fetch protections
- optional HTTP Basic Authentication
- lightweight failed-auth rate limiting
- static file serving protections
- conservative response headers
- deployment-time configuration controls

This security model is appropriate for the current scope of the project, especially when paired with HTTPS and standard hosting-platform protections.

---

## Current exposed surface

The backend intentionally keeps its HTTP surface small.

Primary routes:

- `GET /health`
- `GET /api/health`
- `GET /analyze`
- `GET /api/analyze`

When static serving is enabled, the backend may also serve:

- built frontend assets
- the frontend application's `index.html`
- SPA fallback responses for browser navigation

A smaller exposed surface is one of the simplest and most effective security advantages in this project.

---

## Authentication

### Supported authentication model

The backend supports optional **HTTP Basic Authentication**.

When enabled:

- API routes require valid credentials
- static frontend routes also require valid credentials
- health routes may remain public if `AUTH_ALLOW_HEALTH=1`

### Important limitations

Basic Auth is intentionally simple and should be understood clearly:

- it is **not** a full identity system
- it does not provide roles, sessions, or user management
- it should only be used behind **HTTPS**
- credentials must be treated as secrets and stored securely in deployment settings

### Production guidance

If the app is private or limited-access, recommended practice is:

- terminate HTTPS at the hosting platform or reverse proxy
- store auth credentials in environment secrets
- avoid exposing the app publicly without protection
- allow unauthenticated health checks only when necessary for platform operations

### Startup safety

If authentication is enabled but required credentials are missing, the server refuses to start.

This is a useful safety check because it helps prevent accidental unauthenticated deployments.

---

## Failed-auth rate limiting

The backend supports a lightweight in-memory failed-auth rate limiter.

Characteristics:

- IP-based
- best effort
- temporary blocking after repeated failures
- cleared on successful authentication
- reset on restart because it is in-memory only

### What it helps with

This can reduce:

- repeated bad-password attempts
- simple brute-force behavior
- noisy automated retries with invalid credentials

### What it does not provide

It is not a substitute for:

- platform firewalling
- WAF protections
- reverse-proxy rate limiting
- enterprise-grade abuse detection

It is intentionally small and practical for the current deployment scope.

---

## Static file serving protections

When static serving is enabled, the backend serves files from a configured frontend build directory.

Security-sensitive behaviors include:

- only `GET` and `HEAD` requests are served as static files
- request paths are decoded safely
- malformed path encoding is handled safely
- path traversal outside the configured static root is blocked
- direct file serving and SPA fallback are separated from API routes

### Path traversal protection

The static layer verifies that the resolved request path remains inside the configured static root.

This is important because file-serving code is a common place for accidental traversal bugs.

The current implementation is designed to prevent:

- `../` traversal attempts
- encoded traversal attempts
- sibling-directory escape cases caused by weak string-prefix checks

---

## Input validation

The backend keeps validation close to the request and analysis flow.

Important validation areas include:

- query parameter presence
- URL parsing and normalization
- config validation at startup
- fetch-related limits and analysis controls

This helps reduce:

- malformed request handling issues
- undefined runtime behavior
- accidental production misconfiguration

---

## SSRF protections

The backend performs remote fetches as part of website analysis, which makes SSRF protection especially important.

Relevant protections are implemented in the fetch layer.

Security goals include preventing fetches to:

- internal/private network targets
- loopback/local-only destinations
- unsafe or unexpected hosts depending on fetch policy

This is one of the most important backend security areas because analyze-style endpoints can otherwise become SSRF vectors.

For implementation details, review:

- `src/core/fetch/ssrf.js`
- `src/core/fetch/fetchPage.js`

---

## Fetch limits and resource controls

The backend includes safeguards around outbound analysis/fetch behavior.

Examples include controls for:

- request timeout
- maximum fetched bytes
- concurrency limits
- queued analysis limits

These controls help reduce:

- resource exhaustion
- hanging requests
- oversized responses
- accidental denial-of-service against the application itself

They are not a complete anti-abuse system, but they are important defensive limits.

---

## Security headers

The backend sets a small set of conservative security-related headers, including:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `X-Frame-Options: DENY`

These help reduce some common browser-side risks.

### CSP note

A Content Security Policy is **not** hard-coded in the backend server.

This is intentional.

Because the backend may serve a built frontend, a useful CSP depends on:

- the actual frontend build output
- inline script/style behavior
- third-party assets or APIs used by the frontend
- deployment environment and reverse-proxy policy

For this project, CSP is better handled:

- at the reverse proxy / hosting layer, or
- together with the finalized frontend deployment policy

A hard-coded backend CSP added blindly would carry unnecessary risk of breaking the app late in the project.

---

## CORS

CORS behavior is configurable.

Operationally:

- permissive CORS may be acceptable in local development
- production deployments serving frontend and backend from the same origin usually do not need permissive CORS
- CORS should be restricted or disabled when cross-origin access is not required

CORS should be treated as an exposure-control setting, not as an authentication mechanism.

---

## Error handling and information exposure

The backend uses a simple error model.

In production:

- unexpected failures return generic `500` responses
- internal details are not intentionally exposed in error messages

In non-production environments:

- more detailed error messages may be returned to support debugging

This is a practical balance between operational usefulness and unnecessary error-detail exposure.

---

## Logging considerations

The backend supports lightweight structured request logging.

Operationally useful fields may include:

- request id
- method
- path
- status code
- duration

### Logging guidance

Avoid adding logs that expose:

- Basic Auth credentials
- sensitive deployment secrets
- excessive raw request data
- unnecessary internal state dumps in production

The current lightweight request logging model is appropriate for this project stage.

---

## Deployment security recommendations

For the current project, the safest practical deployment posture is:

- use HTTPS
- keep the app behind platform TLS termination or a reverse proxy
- enable Basic Auth if the app is private
- store secrets in deployment configuration, not in the repository
- keep `/health` public only if required by the hosting environment
- restrict CORS unless cross-origin access is truly needed
- verify static file path configuration carefully
- keep environment configuration minimal and explicit

---

## What is intentionally not included

The backend does **not** currently implement:

- user accounts
- session management
- RBAC/permissions
- CSRF token flows
- OAuth/OpenID Connect
- persistent abuse tracking
- advanced WAF-like protections
- enterprise audit logging

That is acceptable for the current project scope, as long as the deployment model remains simple and the app is handled as a controlled-access tool rather than a broad public internet platform.

---

## Practical security checklist

Before deployment, confirm:

- HTTPS is enabled
- auth is enabled if the app should be private
- auth credentials are stored as secrets
- health route behavior matches platform requirements
- CORS is not more permissive than necessary
- static serving points to the correct build directory
- startup config validation passes
- analyze/fetch limits are set to sane values
- tests pass
- no debug-only logging or unsafe temporary code remains

---

## Security testing suggestions

Practical checks before release:

### Auth checks

- request a protected route without credentials and confirm `401`
- request with valid credentials and confirm success
- intentionally fail auth repeatedly and confirm rate limiting if enabled

### Static file checks

- request a known frontend asset and confirm it serves correctly
- request a frontend route and confirm SPA fallback works
- attempt traversal-style paths and confirm they are not served

### API checks

- send invalid analyze requests and confirm clean error responses
- test a known-good analyze request
- confirm non-existent API routes return JSON `404`

### Deployment checks

- verify health endpoint behavior
- verify HTTPS is active
- verify secrets are coming from deployment configuration
- verify logs do not expose credentials or sensitive values

---

## Final notes

This backend uses a modest but sensible security posture for its scope.

Its strongest security qualities are:

- small and understandable server surface
- practical fetch and static-serving protections
- optional auth with startup safeguards
- conservative defaults
- limited complexity

That is the right direction for this project stage: improve real safety, reduce obvious risks, and avoid introducing large late-stage changes that could create new bugs.

---

## Related documents

- `README.md`
- `docs/API.md`
- `docs/ARCHITECTURE.md`
- `docs/OPERATIONS_GUIDE.md`
- `docs/RUNBOOK.md`
