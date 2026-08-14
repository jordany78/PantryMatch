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

**Frontend & Backend (Unified)**
- **Next.js 14** — React framework with built-in API routes, SSR, and full-stack capabilities
- **React 18** — component-driven UI
- **TypeScript** — static typing for type safety

**Database & Auth**
- **Supabase** — managed PostgreSQL database with real-time capabilities and built-in authentication
  - Full-text search (`pg_trgm`) for ingredient search
  - Row-level security (RLS) for multi-tenant data isolation
  - Supabase Auth for user authentication and session management

**OCR / Receipt Parsing**
- **Google Cloud Vision API** — text extraction from receipt images
- Custom parsing layer (regex + heuristics) to segment raw OCR text into item/quantity/price triples
- Fuzzy string matching against canonical ingredients table

**Tooling**
- **ESLint & Next.js linting** — code quality
- **npm/Node.js** — package management and runtime

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
│   ├── backend/                    # Backend-specific code
│   │   └── lib/
│   │       ├── matching/           # Recipe match % computation
│   │       ├── ocr/                # Receipt OCR processing
│   │       └── supabase/           # Database clients (admin, server)
│   │
│   ├── lib/                        # Shared utilities & types
│   │   ├── supabase/
│   │   │   └── client.ts           # Browser-side Supabase client
│   │   └── utils.ts                # Shared helpers
│   │
│   ├── components/                 # React components (for future use)
│   └── types/                      # Shared TypeScript types
│
├── db/
│   ├── migrations/                 # SQL schema migrations
│   └── seed/                       # Seed data: canonical ingredients, sample recipes
│
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.example
└── README.md
```

**Key Separation:**
- **Frontend**: `src/app/(auth)/` — user-facing pages
- **Backend**: `src/app/api/` and `src/backend/lib/` — API routes and backend logic
- **Shared**: `src/lib/` and `src/types/` — utilities accessible by both frontend and backend
- **Database**: `db/` — migrations and seed data

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use the provided Docker service)
- API key for chosen OCR provider (if not using self-hosted Tesseract)

### Setup

```bash
# Clone the repo
git clone https://github.com/jordany78/pantrymatch.git
cd pantrymatch

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start local services (Postgres, Redis)
docker-compose up -d

# Run database migrations and seed canonical ingredients
npm run db:migrate
npm run db:seed

# Start dev servers (frontend + backend)
npm run dev
```

The app should be available at `http://localhost:3000`, with the API at `http://localhost:4000`.
