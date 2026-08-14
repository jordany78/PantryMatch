# PantryMatch

Upload a grocery receipt, build a fridge/pantry inventory, and see which recipes you can make — ranked by what percentage of ingredients you already have.

## Project Structure

This is a monorepo with three independent pieces:

```
pantrymatch/
├── frontend/    # Next.js UI — pages, components, auth forms
├── backend/     # Next.js API routes — receipts, pantry, recipes, matching
└── database/    # SQL migrations + seed data (Supabase/PostgreSQL)
```

`frontend/` and `backend/` are separate Next.js projects with their own `package.json`, run independently on different ports, and talk to each other over HTTP (frontend calls backend via `NEXT_PUBLIC_API_URL`). `database/` isn't a runnable project — it's the SQL that gets run against your shared Supabase project.

## Who Owns What

- **Backend + database** — API routes, Supabase schema/RLS policies, OCR integration, recipe matching logic.
- **Frontend** — pages, components, calling the backend's API, Supabase Auth UI (login/signup).

Both sides need the **same Supabase project** (same `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`) since the frontend authenticates users directly against Supabase, while the backend reads/writes data for those same users.

## Getting Started

1. **Database**: run the SQL files in `database/` (in numeric order) against your Supabase project's SQL Editor. See `database/README.md`.
2. **Backend**: see `backend/README.md` — runs on `http://localhost:4000`.
3. **Frontend**: see `frontend/README.md` — runs on `http://localhost:3000`, expects the backend already running.

## Tech Stack

- **Frontend**: Next.js (React) + TypeScript + Tailwind CSS, Supabase Auth
- **Backend**: Next.js API routes + TypeScript, Supabase (server/admin clients)
- **Database**: PostgreSQL via Supabase, with `pg_trgm` for fuzzy ingredient matching
- **OCR**: Google Cloud Vision
