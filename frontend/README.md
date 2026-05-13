# Frontend

React + Vite SPA for Inbox staff. Enter a public website URL to detect its tech stack and see HubSpot replacement options.

The frontend performs no detection logic — it only handles user input, API request state, and table display.

## How to Run (Local Dev)

```bash
cd frontend
npm install
npm run dev        # starts Vite dev server on port 5173
```

Run the backend separately (see `backend/README.md`). The Vite dev server proxies `/api` to `http://localhost:3001` by default.

### Environment Variable

| Variable       | Default | Purpose                             |
| -------------- | ------- | ----------------------------------- |
| `VITE_API_URL` | `/api`  | API base URL used by the fetch hook |

```bash
VITE_API_URL=http://localhost:3001/api npm run dev
```

## File Structure

```
frontend/src/
├── App.jsx                        — layout and top-level analysis state
├── main.jsx                       — React root mount
├── index.css                      — all styles (BEM, responsive)
├── hooks/
│   └── useWebsiteAnalysis.js      — fetch lifecycle, abort, loading/error state
├── components/
│   ├── UrlInput.jsx               — URL form, validation, submit handling
│   ├── UrlReport.jsx              — 3-column results table
│   ├── Header.jsx                 — static brand header
│   └── Footer.jsx                 — static brand footer
└── utils/
    └── mapApiToTableData.js       — transforms API response into table rows
```

## API Response Shape (Relevant Fields)

The table uses three columns. `mapApiToTableData` extracts only what is needed:

```jsonc
// GET /api/analyze?url=https://example.com
{
  "ok": true,
  "url": "https://example.com",
  "finalUrl": "https://example.com/",
  "technologies": [
    {
      "name": "React",
      "description": "A JavaScript library for building user interfaces.",
      "categories": [{ "id": 12, "name": "JavaScript frameworks" }],
      "hubspot": {
        "primaryProduct": "HubSpot CMS Hub",
        "products": [
          {
            "hubspotProduct": "HubSpot CMS Hub",
            "priority": "high",
          },
        ],
      },
    },
  ],
}
```

Mapped to table rows:
| Column | Source field | Fallback |
| ------------------ | ----------------------------------------- | ------------------------- |
| Technology | `tech.name` + `tech.categories[0].name` | `"Unknown"` |
| Description | `tech.description` | `"No description available"` |
| HubSpot Replacement| `tech.hubspot.primaryProduct` | `"No direct replacement"` |

## Constraints

- Table always has exactly **3 columns**: Technology, Description, HubSpot Replacement.
- Only the **primary HubSpot product** is shown per row.
- Input only accepts **https://** URLs.
- Raw API data is never passed directly into components — always goes through `mapApiToTableData`.

## Build

```bash
npm run build   # output: frontend/dist
```

In production, the backend serves `frontend/dist` as static files when `SERVE_STATIC=1`.
