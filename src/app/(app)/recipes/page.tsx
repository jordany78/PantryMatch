"use client";

import { useEffect, useState } from "react";

type RecipeResult = {
  id: string;
  name: string;
  cuisine: string | null;
  prepTimeMinutes: number | null;
  instructions: string;
  dietaryTags: string[];
  match: {
    matchPercent: number;
    missingIngredients: { ingredientId: string; name: string }[];
  };
};

type SortOption = "match_desc" | "match_asc" | "prep_time";

export default function RecipePage() {
  const [recipes, setRecipes] = useState<RecipeResult[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [diet, setDiet] = useState("");
  const [maxPrep, setMaxPrep] = useState("");
  const [sort, setSort] = useState<SortOption>("match_desc");
  const [minMatch, setMinMatch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ sort, min_match: String(minMatch) });
    if (query) params.set("q", query);
    if (cuisine) params.set("cuisine", cuisine);
    if (diet) params.set("diet", diet);
    if (maxPrep) params.set("max_prep", maxPrep);

    setLoading(true);
    fetch(`/api/recipes?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load recipes.");
        return data;
      })
      .then((data) => {
        setRecipes(data.recipes ?? []);
        setError("");
      })
      .catch((fetchError: Error) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [cuisine, diet, maxPrep, minMatch, query, sort]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6fcf97]">
          Cook from what you have
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-100">Recipes</h1>
        <p className="mt-2 max-w-xl text-sm text-gray-400">
          Your catalog ranked by how much of each recipe is already in your pantry.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(searchInput.trim());
        }}
        className="flex max-w-2xl gap-2"
      >
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search for a recipe"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600"
        />
        <button type="submit" className="rounded-md bg-[#6fcf97] px-4 py-2 text-sm font-medium text-[#0d0f0d]">
          Search
        </button>
      </form>

      <section className="grid gap-3 border-y border-white/10 py-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs text-gray-400">
          Cuisine
          <input value={cuisine} onChange={(event) => setCuisine(event.target.value)} placeholder="e.g. Italian" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600" />
        </label>
        <label className="text-xs text-gray-400">
          Dietary tag
          <input value={diet} onChange={(event) => setDiet(event.target.value)} placeholder="e.g. vegetarian" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600" />
        </label>
        <label className="text-xs text-gray-400">
          Max prep time
          <input type="number" min="1" value={maxPrep} onChange={(event) => setMaxPrep(event.target.value)} placeholder="Minutes" className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600" />
        </label>
        <label className="text-xs text-gray-400">
          Minimum match: <span className="text-gray-200">{minMatch}%</span>
          <input type="range" min="0" max="100" step="10" value={minMatch} onChange={(event) => setMinMatch(Number(event.target.value))} className="mt-4 w-full accent-[#6fcf97]" />
        </label>
        <label className="text-xs text-gray-400">
          Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100">
            <option value="match_desc">Best match</option>
            <option value="match_asc">Lowest match</option>
            <option value="prep_time">Prep time</option>
          </select>
        </label>
      </section>

      {loading && <p className="text-sm text-gray-400">Checking your pantry...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className="text-sm text-gray-400">No recipes match those filters.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {recipes.map((recipe) => {
          const isHighMatch = recipe.match.matchPercent >= 80;
          return (
            <article
              key={recipe.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <a
                    href={`/recipes/${recipe.id}`}
                    className="text-left text-lg font-medium text-gray-100 underline-offset-4 hover:text-[#6fcf97] hover:underline focus:outline-none focus:ring-2 focus:ring-[#6fcf97]"
                  >
                    {recipe.name}
                  </a>
                  <p className="mt-1 text-xs text-gray-500">
                    {[recipe.cuisine, recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : null].filter(Boolean).join(" · ") || "Recipe"}
                  </p>
                </div>
                <strong className={`shrink-0 text-xl ${isHighMatch ? "text-[#6fcf97]" : "text-amber-300"}`}>
                  {recipe.match.matchPercent}%
                </strong>
              </div>
              {recipe.dietaryTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {recipe.dietaryTags.map((tag) => <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-xs text-gray-400">{tag}</span>)}
                </div>
              )}
              {isHighMatch && recipe.match.missingIngredients.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400">Missing ingredients</h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {recipe.match.missingIngredients.map((ingredient) => ingredient.name).join(", ")}
                  </p>
                </div>
              )}
              {isHighMatch && recipe.match.missingIngredients.length === 0 && (
                <p className="mt-5 border-t border-white/10 pt-4 text-sm text-[#6fcf97]">Everything required is in your pantry.</p>
              )}
            </article>
          );
        })}
      </div>

    </div>
  );
}