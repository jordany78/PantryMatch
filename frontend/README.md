# PantryMatch — Frontend

The UI: receipt upload flow, pantry view, recipe browsing, auth. Runs independently from `../backend`, on port 3000, and talks to it over HTTP.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase Auth (for login/signup — the frontend authenticates users directly against Supabase, then the backend trusts that session)

## Structure

```
src/
├── app/
│   ├── (auth)/login, (auth)/signup   # Auth pages
│   ├── pantry/                        # Pantry inventory view
│   ├── receipts/, receipts/[id]/      # Upload + review flow
│   └── recipes/, recipes/[id]/        # Recipe browsing + detail
├── components/
│   ├── pantry/       # PantryList, ManualAddSearch
│   ├── receipts/     # ReceiptUploader, LineItemReview
│   ├── recipes/      # RecipeCard, MatchBadge
│   └── ui/           # Shared primitives (Button, Input)
├── lib/
│   ├── supabase/client.ts   # Browser Supabase client (auth only)
│   └── utils.ts
└── types/index.ts    # Shared types (kept in sync with ../backend/src/types)
```

Every page and component here is currently a placeholder — they render but don't fetch data yet. Each has a comment describing what it needs to do and which backend endpoint it should call.

## Getting Started

```bash
npm install
cp .env.example .env   # fill in NEXT_PUBLIC_API_URL + Supabase keys
npm run dev             # runs at http://localhost:3000
```

Make sure `../backend` is running on port 4000 first (or update `NEXT_PUBLIC_API_URL` if it's running elsewhere) — the frontend has no data of its own, it's entirely dependent on the backend API.

## Talking to the backend

Use `process.env.NEXT_PUBLIC_API_URL` as the base URL for all API calls, e.g.:

```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pantry/items?user_id=${userId}`);
```

Note: the backend currently expects `user_id` as a query param/body field rather than reading it from an auth session (see `../backend/README.md`) — that's a temporary stand-in until Supabase Auth is wired up here and the backend switches to reading the real session.
