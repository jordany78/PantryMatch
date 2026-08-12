-- Enable RLS and scope user-owned tables to auth.uid()

alter table pantry_items enable row level security;
alter table receipts enable row level security;
alter table receipt_line_items enable row level security;

-- pantry_items: users can only see/modify their own rows
create policy "Users can view own pantry items"
  on pantry_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own pantry items"
  on pantry_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pantry items"
  on pantry_items for update
  using (auth.uid() = user_id);

create policy "Users can delete own pantry items"
  on pantry_items for delete
  using (auth.uid() = user_id);

-- receipts: same pattern
create policy "Users can view own receipts"
  on receipts for select
  using (auth.uid() = user_id);

create policy "Users can insert own receipts"
  on receipts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own receipts"
  on receipts for update
  using (auth.uid() = user_id);

-- receipt_line_items: scoped via the parent receipt's user_id
create policy "Users can view own receipt line items"
  on receipt_line_items for select
  using (
    exists (
      select 1 from receipts
      where receipts.id = receipt_line_items.receipt_id
      and receipts.user_id = auth.uid()
    )
  );

create policy "Users can update own receipt line items"
  on receipt_line_items for update
  using (
    exists (
      select 1 from receipts
      where receipts.id = receipt_line_items.receipt_id
      and receipts.user_id = auth.uid()
    )
  );

-- ingredients and recipes/recipe_ingredients are shared catalog data,
-- not user-owned — readable by anyone, writable only via the service role key.
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;

create policy "Anyone can read ingredients"
  on ingredients for select
  using (true);

create policy "Anyone can read recipes"
  on recipes for select
  using (true);

create policy "Anyone can read recipe ingredients"
  on recipe_ingredients for select
  using (true);
