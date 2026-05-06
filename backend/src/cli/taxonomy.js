#!/usr/bin/env node
// backend/src/cli/taxonomy.js

const { loadTechDb } = require("../core/techdb/loadTechDb");
const { formatPretty } = require("./formatPretty");

/**
 * CLI: dump taxonomy information (categories and groups).
 *
 * Usage:
 *   node src/cli/taxonomy.js [--pretty] [--human]
 *
 * Output:
 *   JSON: { categories: [...], groups: [...] }
 *   Human: readable list of categories grouped by section
 */

async function main() {
  const args = new Set(process.argv.slice(2));
  const pretty = args.has("--pretty");
  const human = args.has("--human");

  const db = await loadTechDb();

  const categories = Object.entries(db.categoriesById || {})
    .map(([id, c]) => ({
      id,
      name: c.name ?? null,
      groups: Array.isArray(c.groups) ? c.groups.map(String) : [],
    }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  const groups = Object.entries(db.groupsById || {})
    .map(([id, g]) => ({
      id,
      name: g.name ?? null,
    }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  if (human) {
    process.stdout.write(formatHumanTaxonomy(categories, groups, db.meta) + "\n");
    return;
  }

  const payload = { categories, groups, meta: db.meta || null };

  process.stdout.write((pretty ? formatPretty(payload) : JSON.stringify(payload)) + "\n");
}

/**
 * Format taxonomy as a human-readable report for non-technical users.
 * Shows all category names (sorted A–Z) and the group each belongs to.
 */
function formatHumanTaxonomy(categories, groups, meta) {
  const groupNamesById = new Map(groups.map((g) => [g.id, g.name]));

  // Group categories by their first group membership (or "Uncategorised")
  const byGroup = new Map();

  for (const cat of categories) {
    const groupId = cat.groups[0] ?? null;
    const groupName = groupId ? (groupNamesById.get(groupId) ?? `Group ${groupId}`) : "Other";
    if (!byGroup.has(groupName)) byGroup.set(groupName, []);
    byGroup.get(groupName).push(cat.name ?? `Category ${cat.id}`);
  }

  // Sort group names A–Z, keeping "Other" last
  const sortedGroups = Array.from(byGroup.keys()).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  const lines = [];
  const border = "─".repeat(60);

  lines.push("┌" + border + "┐");
  lines.push("│" + "  Technology Categories — HubSpot Recommendation Tool".padEnd(60) + "│");
  lines.push("└" + border + "┘");
  lines.push("");

  if (meta?.updatedAt) {
    lines.push(`Database updated: ${meta.updatedAt}`);
    lines.push("");
  }

  lines.push(`${categories.length} categories across ${sortedGroups.length} groups`);
  lines.push("");

  for (const groupName of sortedGroups) {
    const cats = byGroup.get(groupName);
    lines.push(`== ${groupName} (${cats.length}) ==`);
    for (const name of cats) {
      lines.push(`  • ${name}`);
    }
    lines.push("");
  }

  lines.push("Tip: use these category names when editing hubspot-mapping.json (byCategory section).");
  lines.push("Tip: use --pretty (JSON) to get IDs for programmatic use.");

  return lines.join("\n");
}

main().catch((err) => {
  process.stderr.write(`Error: ${err?.message || String(err)}\n`);
  process.exit(1);
});
