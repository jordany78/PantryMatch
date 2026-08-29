-- Add created_at/updated_at audit columns to all tables that lack them,
-- and keep updated_at current via a shared trigger function.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table ingredients
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table pantry_items
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table receipts
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table receipt_line_items
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table recipes
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table recipe_ingredients
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

create trigger set_ingredients_updated_at
  before update on ingredients
  for each row execute function public.set_updated_at();

create trigger set_pantry_items_updated_at
  before update on pantry_items
  for each row execute function public.set_updated_at();

create trigger set_receipts_updated_at
  before update on receipts
  for each row execute function public.set_updated_at();

create trigger set_receipt_line_items_updated_at
  before update on receipt_line_items
  for each row execute function public.set_updated_at();

create trigger set_recipes_updated_at
  before update on recipes
  for each row execute function public.set_updated_at();

create trigger set_recipe_ingredients_updated_at
  before update on recipe_ingredients
  for each row execute function public.set_updated_at();
