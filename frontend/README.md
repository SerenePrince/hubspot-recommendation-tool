# Frontend (Vite + React)

This is the single-page UI for the HubSpot Recommendation Tool.

## Local development (UI-only)

```bash
cd frontend
npm install
npm run dev
```

By default, the frontend expects the backend API at:

- `/api` (same origin), or
- set `VITE_API_URL` to point at a different backend base URL

Example:

```bash
VITE_API_URL=http://localhost:3001/api npm run dev
```

## Production / Docker

In production, the root `Dockerfile` builds this frontend and the backend serves the built assets statically.