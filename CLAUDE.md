# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

ChoreQuest is a gamified family chore management PWA. Kids earn XP, level up a pet, and unlock rewards by completing chores. Parents manage assignments and approvals. There is an admin role for system-wide settings.

## Development Commands

### Backend
```bash
# From repo root
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8122 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Dev server on :5173, proxies /api and /ws to :8122
npm run deploy       # Build and copy to ../static/ (for serving via backend)
```

Both must run simultaneously for local development. The Vite dev proxy means the full app is available on port 5173.

### Docker (production-equivalent)
```bash
docker compose up -d   # App at http://localhost:8122
```

### No test suite exists. No lint config exists.

## Architecture

**Backend** — FastAPI (async) + SQLAlchemy 2.0 (async) + SQLite (WAL mode)

- `backend/main.py` — app entry point: middleware, lifespan (init DB, seed, start daily reset task), WebSocket endpoint, static file serving
- `backend/database.py` — async engine, `init_db()` runs `CREATE TABLE IF NOT EXISTS` + inline `ALTER TABLE ADD COLUMN` migrations on every startup. No Alembic.
- `backend/models.py` — all SQLAlchemy ORM models (~27 tables)
- `backend/schemas.py` — all Pydantic request/response schemas
- `backend/routers/` — 22 route modules (auth, chores, rewards, family, calendar, stats, admin, etc.)
- `backend/services/` — business logic extracted from routers (assignment generation, pet leveling, push notifications, recurrence, rotation, rank computation, stats helpers)
- `backend/seed.py` — called on startup to populate default categories, achievements, quest templates, and app settings

**Auth** — JWT access tokens (15 min) + httpOnly refresh cookie (30 days) + optional 6-digit PIN for kids. `backend/auth.py` + `backend/dependencies.py` (`get_current_user`, `require_parent`).

**Real-time** — WebSocket manager at `backend/websocket_manager.py`. Per-user channels. Frontend hook: `src/hooks/useWebSocket.js`.

**Frontend** — React 18 + Vite 6 + Tailwind CSS 4 (no `tailwind.config.js` — config is via CSS `@theme` in `src/index.css`) + Framer Motion + React Router v6

- `frontend/src/App.jsx` — root router with lazy-loaded routes, auth check, role-based dashboard routing
- `frontend/src/api/client.js` — fetch wrapper that auto-refreshes expired access tokens and retries the request once on 401
- `frontend/src/hooks/` — `useAuth`, `useTheme`, `useSettings`, `useWebSocket`, `useNotifications`, `usePushNotifications`, `usePullToRefresh`
- `frontend/src/pages/` — `KidDashboard`, `ParentDashboard`, `AdminDashboard`, and 15+ other pages
- `frontend/src/components/avatar/` — SVG-based avatar renderer (no external image dependencies)

**Database** — SQLite file at `data/chores_os.db`. Migrations are additive-only, applied inline in `init_db()` via try/except `ALTER TABLE ADD COLUMN`. No migration tool.

**Build pipeline** — Multi-stage Dockerfile: Node 20 builds the frontend, Python 3.12-slim runs the backend and serves the built static assets from `/app/static/`.

## Required Environment Variable

Only `SECRET_KEY` is required (min 16 chars). All others have defaults. See `backend/config.py` for the full list. In development, create a `.env` file in the repo root.

## Key Conventions

- All API routes are prefixed `/api/`. WebSocket is at `/ws/{user_id}`.
- The daily reset (streak updates, chore regeneration) runs as an `asyncio` background task in `main.py`, triggered at `DAILY_RESET_HOUR` (UTC, default midnight).
- Photo proof uploads go to `data/uploads/` and are served at `/uploads/{filename}`.
- Tailwind CSS 4 is used — no `tailwind.config.js`. Theme tokens are defined in `src/index.css` using `@theme {}`.
