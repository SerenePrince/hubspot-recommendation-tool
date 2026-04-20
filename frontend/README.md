# Frontend Documentation

This frontend is a React + Vite single-page application for Inbox staff. It collects a website URL, calls the backend analysis endpoint, and renders detected technologies with HubSpot replacement options.

The frontend does not perform detection logic. It only handles user input, API request state, and presentation.

## How It Fits The System

- User enters URL in `UrlInput`
- `useWebsiteAnalysis` calls backend `GET /api/analyze`
- `App` stores latest successful report
- `UrlReport` renders technologies and mapped HubSpot products
- In production, backend serves this built frontend and API from the same origin

See `backend/docs/ARCHITECTURE.md` and `backend/docs/API.md` for backend details.

## File Structure

```text
frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── hooks/
│   │   └── useWebsiteAnalysis.js
│   └── components/
│       ├── Header.jsx
│       ├── Footer.jsx
│       ├── UrlInput.jsx
│       └── UrlReport.jsx
└── package.json
```

- `src/main.jsx`: React bootstrap and root mount guard
- `src/App.jsx`: page layout and top-level state for analysis result
- `src/hooks/useWebsiteAnalysis.js`: API lifecycle (`loading`, `errorMessage`, cancellation, latest `result`)
- `src/components/UrlInput.jsx`: form input, client URL validation, submit handling
- `src/components/UrlReport.jsx`: table output and no-result state
- `src/components/Header.jsx`, `src/components/Footer.jsx`: static brand/footer UI
- `src/index.css`: all styling and responsive behavior

## Data Flow

1. User types URL in `UrlInput`.
2. `UrlInput` validates format (`http`/`https` only) before submit.
3. On submit, `useWebsiteAnalysis.analyzeUrl(url)` runs:
   - aborts any in-flight request
   - sends `GET ${API_BASE_URL}/analyze?url=...&pretty=true`
   - sets `loading` and `errorMessage`
4. On success, `App` stores response in `analysisResult`.
5. `UrlReport` reads `analysisResult.technologies` and renders:
   - technology name
   - category + description
   - `tech.hubspot.products[*].hubspotProduct`

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server is Vite. Run backend separately (see `backend/README.md` and `backend/docs/DEVELOPER_GUIDE.md`).

## Environment Variables

- `VITE_API_URL` (optional)
  - Type: string URL prefix
  - Default: `/api`
  - Used in: `src/hooks/useWebsiteAnalysis.js`
  - Example:

```bash
VITE_API_URL=http://localhost:3001/api npm run dev
```

If not set, requests go to `/api` on the same origin.

## Build And Production Integration

- Build command:

```bash
npm run build
```

- Output directory: `frontend/dist`
- Root `Dockerfile` builds the frontend in a dedicated stage and copies `dist` to `/app/frontend/dist`
- Backend serves static files when:
  - `SERVE_STATIC=1`
  - `STATIC_DIST_DIR=/app/frontend/dist` (Docker default)

In integrated mode, frontend and API share origin and route prefixes:

- Frontend pages: `/...`
- API endpoints: `/api/...` (and `/...` aliases for health/analyze)