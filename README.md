# Waypoint Kanban

A React and TypeScript Kanban board with a small FastAPI service for reading cards from Supabase.

## Frontend

```sh
cd frontend
npm ci
npm run dev
```

The board supports creating, editing, deleting, searching, filtering, and moving tasks between columns. Tasks are stored in the browser's local storage.

## Backend

```sh
cd backend
uv sync
```

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the backend process environment, then start the API:

```sh
uv run fastapi dev main.py
```

The service exposes `GET /health` and `GET /cards`. The cards route uses the publishable key, so Supabase row-level security must allow the requested reads. Do not use the secret key for this unauthenticated endpoint.