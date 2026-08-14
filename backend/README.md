# PantryMatch — Backend

The API: receipt upload/OCR, pantry inventory, and recipe matching. Runs independently from `../frontend`, on port 4000.

## Stack
- Next.js (App Router, API routes only) + TypeScript
- Supabase (PostgreSQL, Auth, Storage)
- Google Cloud Vision (OCR)

## Endpoints

```
POST   /api/receipts                 Upload a receipt image, kicks off OCR job
GET    /api/receipts/:id             Poll receipt processing status + parsed items
PATCH  /api/receipts/:id/line-items  Confirm/edit/reject parsed line items
POST   /api/pantry/items             Manually add an item to inventory        ✅ implemented
GET    /api/pantry/items             List current inventory                   ✅ implemented
DELETE /api/pantry/items/:id         Remove an item                           ✅ implemented
GET    /api/ingredients/search?q=    Autocomplete search for manual add        ✅ implemented
GET    /api/recipes                  List recipes, sorted/filtered by match %
GET    /api/recipes/:id/match        Detailed match breakdown + missing items
```

Unmarked routes currently return `501 not implemented` with a `TODO` describing the logic.

## Structure

```
src/
├── app/api/          # Route handlers (see Endpoints above)
├── lib/
│   ├── supabase/
│   │   ├── server.ts  # Session-based client (for real auth, once frontend has it wired up)
│   │   └── admin.ts   # Service-role client (bypasses RLS — used for testing/manual-add for now)
│   ├── ocr/           # Google Cloud Vision wrapper + line-item parser
│   └── matching/       # Recipe match % algorithm (implemented)
└── types/             # Shared TypeScript interfaces (kept in sync with ../frontend/src/types)
```

Database schema and migrations live in `../database`, not here.

## Getting Started

```bash
npm install
cp .env.example .env   # fill in Supabase + Google Cloud Vision keys
npm run dev             # API runs at http://localhost:4000
```

Run the SQL in `../database` against your Supabase project before starting the server — see `../database/README.md`.

## Testing endpoints locally

`requests.http` in this folder has ready-to-run requests for the VS Code REST Client extension. Get a test user id from Supabase → Authentication → Users, paste it into the `@userId` variable at the top, and click "Send Request" above each one.

## Docker (optional)

Not required for the current deploy plan (Vercel + hosted Supabase don't need it). `Dockerfile`, `Dockerfile.dev`, and the `docker-compose*.yml` files are here in case that changes — e.g. deploying somewhere that isn't Vercel, or wanting a fully containerized local dev environment.

## Notes
- Auth is a placeholder right now — routes take `user_id` directly (query param/body) instead of reading a session, since there's no frontend auth flow wired up yet. Once `../frontend` has Supabase Auth working, switch these routes to `lib/supabase/server.ts` and drop the `user_id`-in-request pattern.
- CORS is open (`*`) in `next.config.js` for local dev against a separate frontend origin — restrict this before deploying.
