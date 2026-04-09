# Frontend – HubSpot Recommendation Tool

## A. Overview

This React + Vite single-page app:

- lets a user enter a website URL,
- calls the backend `/api/analyze` endpoint, and
- displays detected technologies and HubSpot recommendations in a responsive table.

The backend is responsible for all analysis and mapping logic; the frontend is a thin, UI‑focused layer.

---

## B. Structure

- **`src/App.jsx`**
  - Top-level layout and page copy.
  - Wires together the URL input and report components.

- **`src/components/UrlInput.jsx`**
  - Controlled URL input + submit button.
  - Uses the analysis hook and surfaces loading/errors.

- **`src/components/UrlReport.jsx`**
  - Renders the analysis result as a responsive table (grid on desktop, stacked “cards” on small screens).

- **`src/hooks/useWebsiteAnalysis.js`**
  - Custom hook that owns the API request lifecycle (loading, error, cancellation, latest result).

- **Styling**
  - `src/index.css` – main layout, responsive breakpoints, and component styles (including report table, header, and footer).

---

## C. Data flow

1. User enters a URL and submits the form in `UrlInput`.
2. `UrlInput` calls `useWebsiteAnalysis.analyzeUrl(url)`.
3. The hook performs `GET {API_BASE_URL}/analyze?url=...&pretty=true` and:
   - exposes `loading` and `errorMessage` to the UI,
   - returns the parsed JSON response on success.
4. `App` stores the latest successful report in state.
5. `UrlReport` renders the technologies + HubSpot products from that report.

---

## D. Running locally (frontend dev)

```bash
cd frontend
npm install
npm run dev
```

By default, the frontend will call:

- `VITE_API_URL` if set, otherwise
- `/api` on the same origin.

If your backend runs on `http://localhost:3001`, you can point the frontend at it with:

```bash
VITE_API_URL=http://localhost:3001/api npm run dev
```

---

## E. Environment variables

- **`VITE_API_URL`** (optional)
  - When set, overrides the API base URL used in `useWebsiteAnalysis`.
  - Example: `VITE_API_URL=http://localhost:3001/api`
  - In Docker / production, this is typically **not needed**, because the backend serves the frontend and `/api` from the same origin.

---

## F. Build & production integration

- `npm run build` runs the Vite production build and outputs files under `dist/`.
- The root‑level `Dockerfile`:
  - builds this frontend in a separate stage, and
  - copies `dist/` into the final image at `/app/frontend/dist`.
- The backend then serves the built assets when `SERVE_STATIC=1`:
  - static files from `STATIC_DIST_DIR` (default `/app/frontend/dist` in Docker),
  - API routes under `/api/*`.

In most deployments you do **not** run the Vite dev server in production; you use the combined Docker image built from the project root.

---

## G. Styling & UX conventions

- Layout uses a centered card (`.app`) with responsive padding and shadows.
- Forms:
  - URL input and submit button are visually paired on desktop, stacked on small screens.
  - Disabled state and hover/active states are consistent across buttons.
- Messages:
  - `.error` is used for validation and API error text.
  - `.helper` is used for neutral guidance and loading messages.
- Report table:
  - Desktop: three-column table header row, with alternating row backgrounds for easier scanning.
  - Small screens: header row hidden, rows rendered as stacked cards with `data-label` pseudo-headers.
- Footer:
  - Uses CSS grid to adapt from three columns on desktop to stacked sections on the smallest screens.***