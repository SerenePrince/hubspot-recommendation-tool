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
  - Wrap long cells to fit table width
- `--max-width <n>`
  - Override table width (`40..400` clamp)
- `--inspect <tech>`
  - Detailed output for one detected technology

## Working Examples

Default JSON:

```bash
npm run cli -- https://react.dev
```

Pretty JSON:

```bash
npm run cli -- https://react.dev --format json-pretty
```

Human format:

```bash
npm run cli -- https://react.dev --format human
```

Human format wide:

```bash
npm run cli -- https://react.dev --human --wide
```

Human format wrapped at width 100:

```bash
npm run cli -- https://react.dev --human --wrap --max-width 100
```

Inspect one technology:

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

Flag:

- `--pretty`: pretty-print JSON

Example:

```bash
npm run cli:tax -- --pretty
```

## Notes

- URL must be absolute `http` or `https`
- Invalid URLs exit with code `1`
- Analyzer CLI uses same core pipeline as API (`analyzeUrl()`)
