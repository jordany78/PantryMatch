# PantryMatch

Snap a photo of your grocery receipt, and PantryMatch turns it into a live inventory of your fridge and pantry — then tells you exactly which recipes you can cook right now, and how close you are to the ones you can't.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Recipe Matching Algorithm](#recipe-matching-algorithm)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

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

**Frontend**
- React (Vite) or Next.js — component-driven UI, easy image upload handling
- Tailwind CSS — utility-first styling for rapid iteration
- React Query / TanStack Query — server state, caching for inventory & recipe queries

**Backend**
- Node.js (Express or Fastify) or Python (FastAPI) — REST or GraphQL API layer
- PostgreSQL — relational data (users, inventory, recipes, ingredients) with strong support for full-text search (`pg_trgm`) for the manual-add search
- Redis (optional) — caching recipe match computations for large catalogs

**OCR / Receipt Parsing**
- Google Cloud Vision API, AWS Textract, or Tesseract.js (self-hosted/open-source alternative) for text extraction
- Custom parsing layer (regex + heuristics, or a lightweight ML classifier) to segment raw OCR text into item/quantity/price triples
- Fuzzy string matching (e.g. `pg_trgm`, Fuse.js, or Levenshtein-based matching) against a canonical ingredients table

**Infrastructure**
- Docker for local dev parity
- Cloud object storage (S3 / GCS) for storing uploaded receipt images
- CI/CD via GitHub Actions
- Hosting: Vercel/Netlify (frontend) + Render/Railway/Fly.io or AWS (backend), or a unified platform like Render for both

**Auth**
- JWT-based auth or a managed provider (Auth0, Clerk, Supabase Auth)

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐
│   Frontend   │◄────►│    API Server     │◄────►│   PostgreSQL    │
│ (React/Next) │      │ (Express/FastAPI) │      │  (users, items, │
└─────────────┘      └──────────────────┘      │  recipes, etc.) │
       │                      │                  └────────────────┘
       │                      ▼
       │              ┌──────────────┐
       │              │  OCR Service  │
       │              │ (Vision API /  │
       │              │  Tesseract)   │
       │              └──────────────┘
       ▼
┌─────────────┐
│ Object Store │  (raw receipt images)
│  (S3 / GCS)  │
└─────────────┘
```

The OCR/parsing step is best implemented as an isolated service or queued job (rather than inline in the request/response cycle) since receipt processing can be slow and error-prone — this keeps the upload UX responsive and allows retries without blocking the user.

## Data Model

High-level schema (simplified):

```
users
 ├─ id, email, password_hash, created_at

ingredients (canonical catalog)
 ├─ id, name, category, default_unit, aliases[]

pantry_items (user inventory)
 ├─ id, user_id, ingredient_id, quantity, unit,
 │  storage_location (fridge | freezer | pantry),
 │  purchase_date, expires_at (nullable), source (receipt | manual)

receipts
 ├─ id, user_id, image_url, uploaded_at, status (processing | reviewed | failed)

receipt_line_items
 ├─ id, receipt_id, raw_text, matched_ingredient_id (nullable),
 │  quantity, unit, price, confidence_score, confirmed (bool)

recipes
 ├─ id, name, cuisine, prep_time_minutes, instructions, dietary_tags[]

recipe_ingredients
 ├─ id, recipe_id, ingredient_id, quantity, unit, is_optional (bool)
```

## Recipe Matching Algorithm

For a given user and recipe:

1. Fetch `recipe_ingredients` for the recipe.
2. Fetch the user's `pantry_items`, normalized to comparable units.
3. For each required ingredient, check whether the user has it in sufficient quantity (or at all, for a simpler v1).
4. Compute:

   ```
   match_% = (matched_ingredients / total_required_ingredients) × 100
   ```

   Optional refinements:
   - Weight core ingredients (e.g. protein, base starch) higher than garnishes/seasonings.
   - Treat `is_optional` ingredients as bonus, not required, in the denominator.
   - Quantity-aware matching (e.g. "have 1 egg, need 3" counts as partial credit rather than binary have/don't-have).

5. Return `missing_ingredients[]` — the required ingredients not currently in the pantry — so the UI can render "You're missing: garlic, heavy cream."

This computation can run on-demand per recipe view, or be pre-computed/cached and invalidated whenever the pantry changes (recommended once the recipe catalog grows large, to avoid recomputing every recipe on every inventory update).

## Project Structure

```
pantrymatch/
├── apps/
│   ├── web/                # Frontend (React/Next.js)
│   └── api/                # Backend API server
├── packages/
│   ├── ocr-service/        # Receipt image → structured line items
│   ├── matching-engine/    # Recipe match % computation
│   └── shared-types/       # Shared TS types/interfaces across apps
├── db/
│   ├── migrations/
│   └── seed/                # Seed data: canonical ingredients, sample recipes
├── docker-compose.yml
├── .env.example
└── README.md
```

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

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `OCR_PROVIDER` | `vision` \| `textract` \| `tesseract` |
| `OCR_API_KEY` | API key for chosen cloud OCR provider (not needed for Tesseract) |
| `STORAGE_BUCKET` | Object storage bucket name for receipt images |
| `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | Credentials for object storage |
| `JWT_SECRET` | Secret for signing auth tokens |
| `REDIS_URL` | (Optional) Redis connection string for caching |

## API Reference

A minimal sketch of the core endpoints (adjust to REST/GraphQL preference):

```
POST   /api/receipts                 Upload a receipt image, kicks off OCR job
GET    /api/receipts/:id             Poll receipt processing status + parsed items
PATCH  /api/receipts/:id/line-items  Confirm/edit/reject parsed line items
POST   /api/pantry/items             Manually add an item to inventory
GET    /api/pantry/items             List current inventory
DELETE /api/pantry/items/:id         Remove an item (used up, expired, etc.)
GET    /api/ingredients/search?q=    Autocomplete search for manual add
GET    /api/recipes                  List recipes, sorted/filtered by match %
GET    /api/recipes/:id/match        Detailed match breakdown + missing items
```

## Roadmap

- [ ] MVP: receipt upload → OCR → review → pantry → recipe match %
- [ ] Manual item search & add
- [ ] Expiration tracking with "use soon" notifications
- [ ] Auto-generated shopping lists from missing ingredients
- [ ] Barcode scanning as an alternative to receipt OCR
- [ ] Dietary preference/allergen filtering on recipes
- [ ] Meal planning calendar built on top of match %
- [ ] Mobile app (React Native) sharing the same API
- [ ] Community-submitted recipes with automatic ingredient parsing

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a PR. For smaller fixes, feel free to open a PR directly.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a PR

## License

MIT — see [LICENSE](LICENSE) for details.
