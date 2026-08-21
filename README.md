# PantryMatch

Snap a photo of your grocery receipt, and PantryMatch turns it into a live inventory of your fridge and pantry — then tells you exactly which recipes you can cook right now, and how close you are to the ones you can't.

## Overview

Most people either over-buy groceries and let food go to waste, or stare into a fridge full of ingredients with no idea what to cook. PantryMatch closes that gap by making inventory tracking as frictionless as taking a photo, and by turning that inventory into actionable recipe suggestions ranked by how "match-ready" they are.

**The core loop:**
1. Upload a photo of a grocery receipt.
2. OCR + parsing extracts line items (name, quantity, price).
3. Review a checklist of detected items and confirm which go into your pantry/fridge database.
4. Optionally add items manually via search (for things not bought on a receipt, e.g. garden produce, gifted items, staples you already had).
5. Browse recipes ranked by **match percentage** — the share of required ingredients you currently have on hand.
6. For recipes that are almost there (e.g. 90%), see exactly which items are missing so you know what to add to your next shopping list.

## Core Features

### 🧾 Receipt Scanning & Parsing
- Upload an image (JPEG/PNG/HEIC) or PDF of a receipt.
- OCR extracts raw text; a parsing layer segments it into structured line items (item name, quantity/unit, price).
- Fuzzy-matches messy receipt text (e.g. `ORG BANANA 2LB`) against a canonical grocery item database (e.g. resolves to "Organic Bananas").
- Confidence scoring flags low-certainty matches for manual review instead of silently guessing wrong.

### ✅ Review & Confirm Workflow
- After scanning, users see a checklist of all detected items, pre-checked by default.
- Users can uncheck items they don't want tracked (e.g. non-food purchases, one-off items), correct misread names/quantities, and assign a storage location (fridge, freezer, pantry).
- Confirmed items are inserted into the user's personal inventory with a purchase date and optional expiration estimate.

### 🔍 Manual Item Entry
- Full-text/autocomplete search against the canonical ingredient database.
- Add quantity, unit, storage location, and optional expiration date.
- Supports quick-add for common staples (salt, oil, flour, etc.) so the pantry reflects reality, not just receipt history.

### 📦 Fridge/Pantry Inventory
- Central dashboard of everything currently on hand, grouped by storage location.
- Quantity tracking with unit normalization (e.g. grams vs. ounces) so matching logic can compare like with like.
- Expiration tracking with "use soon" flags to reduce food waste (stretch goal, see [Roadmap](#roadmap)).

### 🍳 Recipe Matching & Discovery
- Every recipe in the catalog is scored against the user's current inventory as a **match percentage**: `(ingredients on hand / total ingredients required) × 100`, with optional weighting for ingredient importance.
- Recipes are sortable/filterable by match %, cuisine, prep time, and dietary tags.
- Recipes at high match % (e.g. ≥80%) surface a "Missing Ingredients" list so users know precisely what to pick up.
- Optional: auto-generate a shopping list from a chosen recipe's missing ingredients.

## How It Works

```
Receipt Photo
     │
     ▼
[OCR Engine] ──► Raw text
     │
     ▼
[Line Item Parser] ──► { name, qty, unit, price }[]
     │
     ▼
[Ingredient Matcher] ──► Canonical ingredient IDs (+ confidence)
     │
     ▼
[Review UI] ──► User confirms/edits/rejects
     │
     ▼
[Pantry Database] ◄──── [Manual Search Add]
     │
     ▼
[Recipe Matching Engine] ──► Ranked recipe list with % match
```

## Tech Stack

- **Next.js 14**, **React 18**, and **TypeScript** in one application
- **Supabase** for PostgreSQL and authentication
- **Google Cloud Vision** for receipt text extraction
- SQL migrations and seed data in `db/`
- npm scripts for development, linting, and production builds

## Project Structure

```
pantrymatch/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Frontend: authentication pages (route group)
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── reset-password/
│   │   │   └── update-password/
│   │   ├── api/                    # Backend: API routes
│   │   │   ├── ingredients/
│   │   │   ├── pantry/
│   │   │   ├── receipts/
│   │   │   └── recipes/
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Home page
│   │
│   ├── lib/                        # Shared/server-side clients and domain logic
│   │   ├── matching/               # Recipe match calculation
│   │   ├── ocr/                    # Receipt OCR and line-item parsing
│   │   └── supabase/               # Browser, server, and admin clients
│   └── types/                      # Shared TypeScript types
│
├── db/
│   ├── migrations/                 # SQL schema migrations
│   └── seed/                       # Seed data: canonical ingredients, sample recipes
│
├── package.json                   # Scripts and dependencies
├── package-lock.json               # Reproducible npm dependency versions
├── tsconfig.json
├── next.config.js
├── .env.example
└── README.md
```

**Key Separation:**
- **Frontend**: `src/app/(auth)/` — user-facing pages
- **Backend**: `src/app/api/` and `src/lib/` — API routes and backend logic
- **Shared**: `src/lib/` and `src/types/` — utilities accessible by both frontend and backend
- **Database**: `db/` — migrations and seed data

## Getting Started

### Prerequisites
- Node.js 20 or newer, including npm
- A Supabase project (the hosted free tier is sufficient for local development)
- Git
- A Google Cloud Vision API key only if you want to scan receipts

Docker, Redis, and a separate PostgreSQL server are not required by the current repository.

### Setup
```bash
# Clone the repo
git clone https://github.com/jordany78/pantrymatch.git
cd pantrymatch

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start the Next.js application
npm run dev
```

Open `http://localhost:4000`. The API is served by the same Next.js process under `/api`;
there is no second server on port 3000.

### Configure Supabase

1. Create a project at [supabase.com](https://supabase.com/).
2. In **Project Settings > API**, copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`
     and the publishable/anon key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY`. Keep this key server-only
     and never expose it in client-side code.
4. In the Supabase **SQL Editor**, run these files in order:
     `db/migrations/0001_init.sql`, `db/migrations/0002_rls.sql`,
     `db/seed/ingredients.sql`, then `db/seed/recipes.sql`.
