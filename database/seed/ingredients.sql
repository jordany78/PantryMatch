-- Sample canonical ingredients to seed local dev.
-- TODO: expand this list or import from a public ingredient dataset.

insert into ingredients (name, category, default_unit, aliases) values
  ('Banana', 'produce', 'each', array['bananas', 'org banana']),
  ('Garlic', 'produce', 'clove', array['garlic clove', 'garlic cloves']),
  ('Chicken Breast', 'meat', 'lb', array['chkn breast', 'boneless chicken breast']),
  ('Whole Milk', 'dairy', 'ml', array['milk', 'homo milk']),
  ('All-Purpose Flour', 'pantry', 'g', array['ap flour', 'flour']),
  ('Olive Oil', 'pantry', 'ml', array['evoo', 'extra virgin olive oil']),
  ('Salt', 'pantry', 'g', array['table salt', 'sea salt']),
  ('Eggs', 'dairy', 'each', array['large eggs', 'egg']);
