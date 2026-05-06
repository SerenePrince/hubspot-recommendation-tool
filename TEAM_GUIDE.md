# Team Guide — HubSpot Recommendation Tool

This guide is for the Inbox team working directly with the tool: running analyses, adding HubSpot recommendations, and keeping the technology database current. No coding experience is required for most tasks.

---

## Quick start: analyze a prospect's website without deploying anything

The CLI (command-line interface) lets you run a full tech-stack analysis and see HubSpot recommendations directly in your terminal — no browser, no server needed.

**One-time setup** (if you haven't done this yet):

```bash
# Clone the repo (only needed once)
git clone <repo-url>
cd hubspot-recommendation-tool/backend

# Install dependencies
npm install
```

**Run an analysis:**

```bash
npm run cli -- https://example.com --human
```

This prints a formatted report in the terminal showing:

- every technology detected on that website
- its category (e.g. CMS, CRM, Analytics)
- the mapped HubSpot replacement, if one exists
- a ranked list of HubSpot recommendations at the top

**Useful variations:**

```bash
# Wider output — prevents text from being cut off
npm run cli -- https://example.com --human --wide

# Word-wrap instead of truncating long cells
npm run cli -- https://example.com --human --wrap

# Deep-dive into one specific technology
npm run cli -- https://example.com --human --inspect WordPress

# Set a custom table width (useful on narrower terminals)
npm run cli -- https://example.com --human --max-width 120
```

**Reading the output:**

The report has three sections:

1. **Top Recommendations** — the highest-priority HubSpot products to lead with, sorted by priority.
2. **Technologies table** — every detected tool, its version (if known), its category, and the mapped HubSpot product.
3. **Recommendations table** — all triggered recommendations with notes, useful for call prep.

A line at the bottom tells you how many technologies were mapped: e.g. `Mapped replacements: 12/34 technologies`. Technologies with no mapped replacement show a blank HubSpot Recommendation cell — this is expected for tools not yet in the mapping file.

---

## Adding or updating HubSpot recommendations

The file that controls which HubSpot products are recommended for each technology is:

```
backend/data/alternatives/hubspot-mapping.json
```

Open it in any text editor. It has two sections:

### `byTechnology` — recommendations for specific tools

Use this when you want to recommend a HubSpot product whenever a specific technology is detected (e.g. WordPress, Salesforce, Mailchimp).

**Schema:**

```json
"byTechnology": {
  "WordPress": [
    {
      "title": "Migrate from WordPress to HubSpot Content Hub",
      "hubspotProduct": "Content Hub",
      "priority": "high",
      "description": "Move your website onto HubSpot for CRM-connected content, SEO tooling, lead capture, and unified reporting across the customer journey."
    },
    {
      "title": "Power growth with HubSpot Marketing Hub alongside WordPress",
      "hubspotProduct": "Marketing Hub",
      "priority": "high",
      "description": "Automate lead capture and attribution from site traffic."
    }
  ]
}
```

**Fields:**

| Field | What it does | Values |
|---|---|---|
| `title` | Short recommendation headline shown in the report | Any text |
| `hubspotProduct` | The HubSpot product being recommended | `Content Hub`, `Marketing Hub`, `Sales Hub`, `Service Hub`, `Operations Hub`, `Commerce Hub` |
| `priority` | How prominently this surfaces in the report | `high`, `medium`, `low` |
| `description` | Supporting notes shown in the Recommendations table | Any text |

**To add a new technology mapping:**

1. Open `backend/data/alternatives/hubspot-mapping.json`
2. Find or add a key under `byTechnology` that exactly matches the technology name as detected (check the CLI output for the exact name — casing matters)
3. Add one or more recommendation objects in the array, ordered primary-first
4. Save the file — the next CLI run or API call will pick up the change immediately (no restart needed)

**Example — adding Shopify:**

```json
"Shopify": [
  {
    "title": "Extend Shopify with HubSpot Commerce Hub",
    "hubspotProduct": "Commerce Hub",
    "priority": "high",
    "description": "Connect your Shopify store to HubSpot CRM for unified revenue attribution and post-purchase automation."
  },
  {
    "title": "Drive repeat purchases with HubSpot Marketing Hub",
    "hubspotProduct": "Marketing Hub",
    "priority": "medium",
    "description": "Automate abandoned cart flows, post-purchase sequences, and loyalty campaigns."
  }
]
```

### `byCategory` — recommendations for entire technology categories

Use this when you want to recommend a HubSpot product for any technology that falls into a category — even ones not individually listed in `byTechnology`. For example, if you add a mapping for the category "CRM", it will fire for Salesforce, HubSpot, Zoho, Dynamics, and any other CRM the scanner detects.

**Schema** (same fields as `byTechnology`):

```json
"byCategory": {
  "CRM": [
    {
      "title": "Consolidate your CRM into HubSpot",
      "hubspotProduct": "Sales Hub",
      "priority": "high",
      "description": "Replace fragmented CRM tools with HubSpot's unified CRM — contacts, deals, tasks, and reporting in one place."
    }
  ]
}
```

**To find the exact category names:** run the taxonomy command and use the `--human` flag:

```bash
npm run cli:tax -- --human
```

This prints a clean, readable list of every category grouped by type. Copy the name exactly as shown.

---

## Keeping the technology database current

The tool uses an open-source fingerprint database (WebAppAnalyzer) to detect technologies. This database is updated regularly by the open-source community. To pull the latest version:

```bash
cd backend
bash src/scripts/update-webappanalyzer-db.sh
```

This downloads the latest fingerprint files from GitHub and replaces the local copies. Run this periodically (monthly is a reasonable cadence) to ensure newly popular tools are detected. The script only touches files inside `backend/data/vendor/` — no other files are affected.

After updating, run a test analysis to confirm everything still works:

```bash
npm run cli -- https://example.com --human
```

---

## Checking what categories exist

When adding a `byCategory` mapping, you need the exact category name. Use the taxonomy command:

```bash
# Human-readable list (recommended)
npm run cli:tax -- --human

# Full JSON with IDs (for technical use)
npm run cli:tax -- --pretty
```

The human output groups all categories by type (e.g. Marketing, Analytics, CMS) with a count per group, making it easy to scan for the category you want to map.

---

## Tips

- Technology names in the mapping file are **case-sensitive**. `"wordpress"` will not match a detected `"WordPress"`. Use `--inspect` on the CLI to see the exact name as detected: `npm run cli -- https://example.com --human --inspect WordPress`
- You can add multiple recommendations per technology or category — list them in order of importance (primary first).
- `priority: "high"` surfaces recommendations at the top of the **Top Recommendations** section of the report and in the web app.
- Changes to `hubspot-mapping.json` take effect immediately — no restart or redeployment needed.
- If a technology shows a blank HubSpot Replacement in the report, it simply hasn't been mapped yet. Check the CLI output for the exact technology name, then add it to `byTechnology`.
