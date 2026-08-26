alter table recipes
  add column spoonacular_id integer unique;

create index recipes_name_trgm_idx on recipes using gin (name gin_trgm_ops);
create index recipes_spoonacular_id_idx on recipes (spoonacular_id);