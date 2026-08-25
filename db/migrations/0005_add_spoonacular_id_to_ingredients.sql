alter table ingredients
  add column spoonacular_id integer unique;

create index ingredients_spoonacular_id_idx on ingredients (spoonacular_id);