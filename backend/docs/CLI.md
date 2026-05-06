# CLI Guide

This guide documents the backend CLI commands in `src/cli/`.

## Analyzer CLI

Command:

```bash
cd backend
npm run cli -- <url> [flags]
```

Equivalent direct command:

```bash
node src/cli/index.js <url> [flags]
```

## Flags (`src/cli/index.js`)

- `--format <json|json-pretty|human>`
  - Output format
  - Default: `json`
- `--human`
  - Alias for `--format human`
- `--pretty`
  - Alias for `--format json-pretty`
- `--meta`
  - Backward-compatible flag; current output already uses clean report with metadata
- `--raw`
  - Print full internal report (`analyzeUrl()` output), bypassing clean report shaping
- `--help`, `-h`
  - Print usage text

Human format-only flags:

- `--wide`
  - No truncation; output may exceed terminal width
- `--wrap`
  - Wrap long cells to fit table width instead of truncating
- `--max-width <n>`
  - Override table width (`40..400` clamp); defaults to `110`
- `--inspect <tech>`
  - Detailed output for one detected technology (exact casing required)

## Human format output

The `--human` flag produces a terminal report with three sections:

1. **Top Recommendations** — up to 5 highest-priority HubSpot products, sorted by priority then product name.
2. **Technologies table** — columns: `Technology`, `Version`, `Category`, `HubSpot Recommendation`. One row per detected technology. Technologies without a mapped recommendation show a blank HubSpot Recommendation cell.
3. **Recommendations table** — columns: `Product`, `Priority`, `Recommendation`, `Notes`. One row per triggered recommendation. Use `--inspect <technology>` to see which technologies triggered a specific recommendation.

A coverage summary is printed below the Technologies table: e.g. `Mapped replacements: 12/34 technologies`.

## Working Examples

Default JSON:

```bash
npm run cli -- https://react.dev
```

Pretty JSON:

```bash
npm run cli -- https://react.dev --format json-pretty
```

Human format (recommended for prospect discovery):

```bash
npm run cli -- https://react.dev --human
```

Human format — no truncation:

```bash
npm run cli -- https://react.dev --human --wide
```

Human format — word-wrap at custom width:

```bash
npm run cli -- https://react.dev --human --wrap --max-width 120
```

Inspect a single detected technology:

```bash
npm run cli -- https://react.dev --human --inspect WordPress --wide
```

Raw internal report:

```bash
npm run cli -- https://react.dev --raw --format json-pretty
```

Help:

```bash
npm run cli:help
```

## Taxonomy CLI

Command:

```bash
npm run cli:tax
```

Equivalent direct:

```bash
node src/cli/taxonomy.js
```

Flags:

- `--human`: human-readable category list grouped by type — use this when editing `hubspot-mapping.json` to find exact category names
- `--pretty`: pretty-print JSON (includes category IDs for programmatic use)

Examples:

```bash
# Readable list for mapping work
npm run cli:tax -- --human

# Full JSON with IDs
npm run cli:tax -- --pretty
```

## Notes

- URL must be absolute `http` or `https`
- Invalid URLs exit with code `1`
- Analyzer CLI uses the same core pipeline as the API (`analyzeUrl()`)
- Technology names in `--inspect` are case-sensitive — use the Technologies table output to confirm exact casing
- Changes to `hubspot-mapping.json` take effect immediately without restarting the server
