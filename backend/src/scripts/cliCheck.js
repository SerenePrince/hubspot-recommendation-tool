#!/usr/bin/env node
// Quick CLI smoke-check script (not production code — run manually via npm run cli:check)
// Tests each CLI mode and flag combination against a real URL or offline if DNS is unavailable.

const { execSync } = require("node:child_process");
const dns = require("node:dns").promises;
const path = require("node:path");

const CLI = path.resolve(__dirname, "../cli/index.js");
const TAX = path.resolve(__dirname, "../cli/taxonomy.js");

async function run(label, cmd, { expectJson = false, expectText = null } = {}) {
  try {
    const out = execSync(`node ${cmd}`, {
      cwd: path.resolve(__dirname, "../.."),
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    process.stdout.write(`\n✓ ${label}\n`);
    if (expectJson) {
      try {
        JSON.parse(out);
        process.stdout.write(`  (valid JSON, ${out.length} chars)\n`);
      } catch {
        process.stdout.write(
          `  ✗ Expected valid JSON but got: ${out.slice(0, 200)}\n`,
        );
        process.exitCode = 1;
      }
    } else if (expectText) {
      if (out.includes(expectText)) {
        process.stdout.write(`  (contains expected: "${expectText}")\n`);
      } else {
        process.stdout.write(
          `  ✗ Expected to contain "${expectText}" but output was:\n${out.slice(0, 400)}\n`,
        );
        process.exitCode = 1;
      }
    } else {
      process.stdout.write(`  (${out.length} chars)\n`);
    }
    return out;
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString().trim() : String(e.message || e);
    process.stdout.write(`\n✗ ${label}\n  Error: ${msg.slice(0, 300)}\n`);
    process.exitCode = 1;
    return null;
  }
}

async function main() {
  process.stdout.write("=== CLI smoke check ===\n");

  // 1. --help should exit 0 and print usage
  process.stdout.write("\n-- Help output --\n");
  try {
    const helpOut = execSync(`node ${CLI} --help`, {
      cwd: path.resolve(__dirname, "../.."),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (helpOut.includes("Usage:") && helpOut.includes("--format")) {
      process.stdout.write(`✓ --help prints usage (exit 0)\n`);
    } else {
      process.stdout.write(
        `✗ --help output unexpected: ${helpOut.slice(0, 200)}\n`,
      );
      process.exitCode = 1;
    }
  } catch (e) {
    process.stdout.write(
      `✗ --help failed (exit ${e.status}): ${(e.stderr || "").slice(0, 200)}\n`,
    );
    process.exitCode = 1;
  }

  // 2. Check whether DNS is available before attempting network commands
  let canReach = false;
  try {
    const records = await dns.lookup("example.com", { all: true });
    canReach = records && records.length > 0;
  } catch {
    canReach = false;
  }

  if (!canReach) {
    process.stdout.write(
      "\n⚠ DNS not available in this environment — skipping network CLI tests.\n",
    );
    process.stdout.write(
      "  Run manually: node src/cli/index.js https://example.com --format human\n",
    );
  } else {
    const TEST_URL = "https://example.com";
    process.stdout.write(`\n-- Fetching ${TEST_URL} --\n`);

    await run("json (default)", `${CLI} ${TEST_URL} --format json`, {
      expectJson: true,
    });
    await run("json-pretty", `${CLI} ${TEST_URL} --format json-pretty`, {
      expectJson: true,
    });
    await run("--pretty alias", `${CLI} ${TEST_URL} --pretty`, {
      expectJson: true,
    });
    await run("human", `${CLI} ${TEST_URL} --format human`, {
      expectText: "HubSpot Recommendation Tool",
    });
    await run("human --wide", `${CLI} ${TEST_URL} --format human --wide`, {
      expectText: "Technologies",
    });
    await run("human --wrap", `${CLI} ${TEST_URL} --format human --wrap`, {
      expectText: "Technologies",
    });
    await run("human --human alias", `${CLI} ${TEST_URL} --human`, {
      expectText: "Technologies",
    });
    await run("--raw flag", `${CLI} ${TEST_URL} --raw --format json`, {
      expectJson: true,
    });
    await run(
      "--meta flag (no-op)",
      `${CLI} ${TEST_URL} --meta --format json`,
      { expectJson: true },
    );
    await run("--format=json= style", `${CLI} ${TEST_URL} --format=json`, {
      expectJson: true,
    });
    await run("flag before URL", `${CLI} --format json ${TEST_URL}`, {
      expectJson: true,
    });
  }

  // 3. Taxonomy CLI (no network needed)
  process.stdout.write("\n-- Taxonomy CLI --\n");
  await run("taxonomy JSON", `${TAX}`, { expectJson: true });
  await run("taxonomy --pretty", `${TAX} --pretty`, { expectJson: true });

  process.stdout.write(
    `\n=== Done (exit code: ${process.exitCode || 0}) ===\n` +
      (canReach
        ? ""
        : "\nNOTE: Network tests were skipped. DNS not available from this shell.\n"),
  );
}

main().catch((e) => {
  process.stderr.write(`Fatal: ${e.message}\n`);
  process.exit(1);
});
