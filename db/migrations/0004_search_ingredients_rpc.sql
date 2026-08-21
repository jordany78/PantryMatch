-- Rank canonical ingredient names and aliases with pg_trgm similarity.
-- The function is security-invoker by default, so callers still follow the
-- RLS policy on ingredients.

create or replace function public.search_ingredients(
  search_query text,
  result_limit integer default 10,
  min_similarity real default 0.15
)
returns table (
  id uuid,
  name text,
  category text,
  default_unit text,
  aliases text[],
  similarity real
)
language sql
stable
set search_path = public
as $$
  select
    i.id,
    i.name,
    i.category,
    i.default_unit,
    i.aliases,
    greatest(
      similarity(lower(i.name), lower(trim(search_query))),
      coalesce(alias_match.similarity, 0)
    )::real as similarity
  from public.ingredients as i
  left join lateral (
    select max(similarity(lower(alias), lower(trim(search_query))))::real as similarity
    from unnest(i.aliases) as alias
  ) as alias_match on true
  where trim(search_query) <> ''
    and greatest(
      similarity(lower(i.name), lower(trim(search_query))),
      coalesce(alias_match.similarity, 0)
    ) >= min_similarity
  order by similarity desc, i.name asc
  limit least(greatest(result_limit, 1), 50);
$$;

grant execute on function public.search_ingredients(text, integer, real)
  to authenticated;