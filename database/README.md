# PantryMatch — Database

SQL for the shared Supabase/PostgreSQL project. Not a runnable project — run these files against your Supabase project's **SQL Editor** (Project → SQL Editor → New query → paste → Run).

## Order matters

1. `0001_init.sql` — creates the `pg_trgm` extension and all tables (ingredients, pantry_items, receipts, receipt_line_items, recipes, recipe_ingredients).
2. `0002_rls.sql` — enables Row Level Security and adds policies scoping user-owned tables (`pantry_items`, `receipts`, `receipt_line_items`) to `auth.uid()`, and opens read access on shared catalog tables (`ingredients`, `recipes`, `recipe_ingredients`).
3. `seed/ingredients.sql` — sample canonical ingredients for local dev/testing. Run after the migrations above.

## Adding a new migration

Name new files `000N_description.sql`, incrementing N, so the run order stays obvious. Keep each migration focused on one change (e.g. `0003_add_recipe_source.sql`) rather than batching unrelated schema changes together.
