# Backend Test Suite

All tests are Jest unit tests using `jest.resetModules()` + `jest.doMock()` per test to prevent cross-test state leakage.

Run tests: `npm test`  
Run with coverage: `npm run test:coverage`

---

## Test files

### `analysisLimiter.test.js`

Concurrency limiter that gates `/analyze` requests.

- Slot acquisition up to `MAX_CONCURRENT_ANALYSES`
- Queued requests resolve when a slot is released
- Queue overflow returns a 503 `AppError` with code `ANALYZE_OVERLOADED`

### `analyzeRoute.test.js`

HTTP handler for `GET /analyze`.

- Input validation: missing URL, invalid format, bad protocol, URL > 2048 chars
- Success path: limiter acquired, `analyzeUrl` called, `buildSimpleReport` applied
- `AppError` with `expose=true` passes its message to the client
- `AppError` with `expose=false` returns `"Request failed"` — internal message is hidden
- Generic non-`AppError` returns 500
- Limiter `release()` is always called on both success and error paths

### `analyzer.test.js`

Orchestrator that wires all analysis phases together.

- `initTechDb` loads the DB exactly once even with concurrent calls
- `analyzeUrl` produces a stable output shape with detections sorted by confidence desc, then name asc
- `_debugSignals` is included only when `config.debugSignals=true`

### `cleanReport.test.js`

Frontend-facing report builder (`buildSimpleReport` / `buildCleanReport`).

- `sanitizeName` strips Wappalyzer markdown link syntax (`[text](url)` → `text`) from tech names
- Output shape: `apiVersion: "2.0"`, `technologies`, `byGroup`, `recommendations`, `summary`
- `ok` is `false` when `report.ok` is not strictly `true` (including `null` input)
- `meta` is absent by default; present in `buildCleanReport`
- Technology-triggered product assignment via `triggeredBy[].triggerType === "technology"`
- Category-triggered product assignment via `triggeredBy[].triggerType === "category"` (reverse-maps to all detections in the matched category)
- Markdown tech names are sanitized before category lookup — fixes `primaryProduct: null` for names like `[WordPress.com](http://WordPress.com)`
- Technology with no matching trigger has `primaryProduct: null`
- `primaryProduct` is the highest-priority product when a tech maps to multiple
- `triggeredBySummary`: formats `Tech: / Category: / Group:` entries, appends `+N` overflow, is `null` for empty `triggeredBy`
- `topRecommendations`: capped at 5, priority-first then `hubspotProduct` alphabetical

### `detectTechnologies.test.js`

Phase 4: technology detection across all matcher signals.

- Confidence aggregation uses probabilistic OR formula: `1 - ∏(1 - cᵢ)`, bounded to `[0, 100]`
- Version is taken from the single strongest evidence match
- Evidence strings are collected and de-duplicated
- A matcher throwing does not crash the pipeline (defensive try/catch per matcher)
- `minConfidence` filter is applied _after_ relationship resolvers (so resolvers can promote detections above the threshold)
- Passing a `null` DB throws a clear `"Tech DB is not loaded"` error

### `loadTechDb.test.js`

Phase 1: database loading from the Wappalyzer/Webappanalyzer vendor dataset.

- Missing any required technology shard file (`.json`) throws with a helpful message
- Malformed JSON throws with "Failed to parse JSON"
- Technologies from all shards are merged into a single map
- The `index` correctly records which matcher buckets (`headers`, `scriptSrc`, `implies`, etc.) each tech participates in
- `meta.technologyFilesLoaded` and `meta.techCount` reflect actual loaded state

### `mappingValidator.test.js`

Validates the `hubspot-mapping.json` schema before it is used at runtime.

- Rejects non-object roots (`null`, arrays, strings)
- Accepts an empty mapping object (all sections are optional)
- Validates `byTechnology`, `byCategory`, and `byGroup` section types (must be `{key: RecommendationItem[]}`)
- Rejects `null` and non-object items inside recommendation arrays
- Required fields: `hubspotProduct`, `priority` (must be `"high" | "medium" | "low"`)
- Optional string fields: `description`, `url`, `reason`, `inboxOffer` — rejected if present but wrong type
- `tags`: must be an array of strings if present

### `recommendations.test.js`

Phase 5: recommendation building from enriched detections.

- Invalid mapping degrades gracefully to an empty list (no crash)
- Duplicates are merged by `hubspotProduct`: `triggeredBy` is unioned, highest priority wins, tags are merged
- Detections below `minConfidence` (default 50) are excluded
- `byCategoryId` trigger matches on numeric category `id`
- `capGroupNoise`: when multiple group-triggered recs target the same `hubspotProduct`, only the highest-scored one is kept

### `signals.test.js`

Phase 3: signal normalization from raw fetch output.

- Meta tags extracted as `{ key: value }` map (keys lowercased)
- Cookies extracted as names only (privacy: values are not kept)
- Script `src` and CSS `href` are resolved to absolute URLs against `finalUrl`
- Non-fetchable schemes (`data:`, `javascript:`, `mailto:`) are filtered out
- All signal outputs are capped to configured char limits (`maxHtmlChars`, `maxTextChars`, etc.)
- URL params are extracted as `[{key, value}]` pairs and capped at `maxUrlParamPairs`

### `ssrf.test.js`

SSRF protection layer in Phase 2 (page fetching).

`isBlockedIp`:

- Blocks `0.0.0.0/8` (current-network), `127.0.0.0/8` (loopback), `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` (link-local), `100.64.0.0/10` (CGNAT)
- Blocks IPv6 loopback (`::1`, `::`), ULA (`fc00::/7`), link-local (`fe80::/10`)
- Blocks IPv4-mapped IPv6 that map to a blocked IPv4 address (`::ffff:127.0.0.1`)

`assertPublicHost`:

- Empty or whitespace-only hostname → `SSRF_BLOCKED_HOST`
- Localhost-ish names (`.localhost`, `.local`, `.internal`, `.lan`) → `SSRF_BLOCKED_HOST`
- Blocked IP literals → `SSRF_BLOCKED_IP`
- Public IP literals → resolves immediately without DNS
- DNS failure → `SSRF_DNS_FAIL`
- DNS returns empty records → `SSRF_DNS_EMPTY`
- Any single blocked IP in a multi-record response → `SSRF_BLOCKED_IP` (no partial-pass)
- All-public multi-record response → resolves with all IPs

---

## What is intentionally not tested

| Module                                                             | Reason                                                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `cli/formatHuman.js`, `cli/formatPretty.js`                        | Presentation-only string formatting with no branching logic                                                                          |
| `enrichDetections.js`, `groupDetections.js`                        | Pure data transforms; behavior exercised implicitly via `analyzer.test.js`                                                           |
| `api/static.js`                                                    | Static file serving is platform behavior, not business logic                                                                         |
| `api/auth.js`, `api/rateLimit.js`                                  | Middleware; integration-level concern                                                                                                |
| `matchers/*.js`                                                    | Each matcher is a thin pattern application; correctness is tested end-to-end via `detectTechnologies.test.js` with controlled inputs |
| `resolve/requires.js`, `resolve/implies.js`, `resolve/excludes.js` | Covered via mock-controlled scenarios in `detectTechnologies.test.js`                                                                |
