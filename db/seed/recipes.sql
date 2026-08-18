-- Sample recipes for local dev/testing the match % feature.
-- Uses subselects on ingredient name rather than hardcoded UUIDs, since
-- ingredients.id is generated at insert time.
-- Run AFTER seed/ingredients.sql.

insert into recipes (name, cuisine, prep_time_minutes, instructions, dietary_tags)
values
  ('Garlic Butter Chicken', 'American', 25,
   'Season chicken with salt. Sear in olive oil. Add garlic in the last 2 minutes.',
   array['high-protein']),
  ('Simple Omelette', 'French', 10,
   'Whisk eggs with a splash of milk and a pinch of salt. Cook in a pan over low heat, folding once set.',
   array['vegetarian']),
  ('Banana Pancakes', 'American', 20,
   'Whisk flour, eggs, and milk into a batter. Fold in sliced banana. Cook on a griddle with a pinch of salt.',
   array['vegetarian']);

-- Garlic Butter Chicken: Chicken Breast, Garlic, Olive Oil, Salt (4 required)
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional)
select
  (select id from recipes where name = 'Garlic Butter Chicken'),
  i.id,
  v.quantity,
  v.unit,
  false
from (values
  ('Chicken Breast', 1, 'lb'),
  ('Garlic', 3, 'clove'),
  ('Olive Oil', 30, 'ml'),
  ('Salt', 2, 'g')
) as v(name, quantity, unit)
join ingredients i on i.name = v.name;

-- Simple Omelette: Eggs, Whole Milk, Salt (3 required) — good candidate to
-- test a high match % if you've added eggs + milk to your pantry.
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional)
select
  (select id from recipes where name = 'Simple Omelette'),
  i.id,
  v.quantity,
  v.unit,
  false
from (values
  ('Eggs', 3, 'each'),
  ('Whole Milk', 30, 'ml'),
  ('Salt', 1, 'g')
) as v(name, quantity, unit)
join ingredients i on i.name = v.name;

-- Banana Pancakes: Flour, Eggs, Milk, Banana required; Salt optional
-- (5 total, 4 required) — a good "90%" test case if you have 3 of the 4
-- required items but not all.
insert into recipe_ingredients (recipe_id, ingredient_id, quantity, unit, is_optional)
select
  (select id from recipes where name = 'Banana Pancakes'),
  i.id,
  v.quantity,
  v.unit,
  v.is_optional
from (values
  ('All-Purpose Flour', 200, 'g', false),
  ('Eggs', 2, 'each', false),
  ('Whole Milk', 250, 'ml', false),
  ('Banana', 2, 'each', false),
  ('Salt', 1, 'g', true)
) as v(name, quantity, unit, is_optional)
join ingredients i on i.name = v.name;
