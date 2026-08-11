-- Enable fuzzy text matching used for OCR line-item matching and manual search
create extension if not exists pg_trgm;

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  default_unit text,
  aliases text[] not null default '{}'
);
create index ingredients_name_trgm_idx on ingredients using gin (name gin_trgm_ops);

create table pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id),
  quantity numeric not null,
  unit text not null,
  storage_location text not null check (storage_location in ('fridge', 'freezer', 'pantry')),
  purchase_date date not null default current_date,
  expires_at date,
  source text not null check (source in ('receipt', 'manual'))
);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  uploaded_at timestamptz not null default now(),
  status text not null check (status in ('processing', 'reviewed', 'failed'))
);

create table receipt_line_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  raw_text text not null,
  matched_ingredient_id uuid references ingredients(id),
  quantity numeric,
  unit text,
  price numeric,
  confidence_score numeric not null default 0,
  confirmed boolean not null default false
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cuisine text,
  prep_time_minutes int,
  instructions text not null,
  dietary_tags text[] not null default '{}'
);

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id),
  quantity numeric not null,
  unit text not null,
  is_optional boolean not null default false
);

-- TODO: add row-level security policies scoping pantry_items/receipts to auth.uid()
