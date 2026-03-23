# CLI Guide – HubSpot Recommendation Tool

## Overview

The backend includes a CLI for running analysis and producing human-readable or machine-readable output. This is useful for:

- Quick verification in development
- Ad-hoc analysis without opening the UI
- Smoke testing or debugging input/output

## Running the CLI

From the backend directory:

```bash
cd backend
npm run cli -- <url> [flags]
```

You can also use convenience scripts:

- `npm run cli:pretty -- <url>` (same as `--format json-pretty`)
- `npm run cli:human -- <url> [human flags]` (same as `--format human`)
- `npm run cli:help`

## Flags

### Output selection

- `--format <json|json-pretty|human>` (default: `json`)
- `--human` (alias for `--format human`)
- `--pretty` (alias for `--format json-pretty`)
- `--raw` (prints the full internal analysis report; useful for debugging)
- `--meta` (kept for backwards compatibility; the default output already includes metadata)
- `--help` / `-h`

### Human format rendering (only when `--format human` / `--human`)

- `--wide` (disable truncation; may exceed terminal width)
- `--wrap` (wrap long cells to fit within table width)
- `--max-width <n>` (override table width; defaults to terminal width, capped at 120)
- `--inspect <tech>` (show a detailed view for one detected technology)

## Examples

Basic JSON:

```bash
npm run cli -- https://react.dev
```

Pretty JSON:

```bash
npm run cli:pretty -- https://react.dev
# or: npm run cli -- https://react.dev --format json-pretty
```

Human-readable report:

```bash
npm run cli:human -- https://react.dev --wide
# or: npm run cli -- https://react.dev --format human --wide
```

Inspect a specific technology (human mode):

```bash
npm run cli -- https://react.dev --format human --inspect WordPress --wrap
```

## Taxonomy Helper

A taxonomy helper script is available:

```bash
npm run cli:tax
# add --pretty for formatted JSON:
npm run cli:tax -- --pretty
```
