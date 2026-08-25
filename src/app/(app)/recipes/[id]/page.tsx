"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type RecipeDetail = {
  recipe: {
    name: string;
    cuisine: string | null;
    prepTimeMinutes: number | null;
    instructions: string;
    dietaryTags: string[];
  };
  matchPercent: number;
  ingredients: {
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
    isOptional: boolean;
    isMissing: boolean;
  }[];
};

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setDetail(null);
    setError("");

    fetch(`/api/recipes/${params.id}/match`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load recipe.");
        return data;
      })
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((fetchError: Error) => {
        if (active && fetchError.name !== "AbortError") setError(fetchError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [params.id]);

  if (loading) return <p className="text-sm text-gray-400">Loading recipe...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!detail) return <p className="text-sm text-gray-400">Recipe not found.</p>;

  const { recipe, ingredients, matchPercent } = detail;
  const missingCount = ingredients.filter((ingredient) => ingredient.isMissing).length;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/recipes" className="text-sm text-[#6fcf97] hover:underline">
        Back to recipes
      </Link>

      <header className="border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6fcf97]">Recipe details</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-100">{recipe.name}</h1>
            <p className="mt-2 text-sm text-gray-400">
              {[recipe.cuisine, recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : null].filter(Boolean).join(" · ") || "Recipe"}
            </p>
          </div>
          <strong className={`text-2xl ${matchPercent >= 80 ? "text-[#6fcf97]" : "text-amber-300"}`}>
            {matchPercent}% match
          </strong>
        </div>
        {recipe.dietaryTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.dietaryTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/5 px-2 py-1 text-xs text-gray-400">{tag}</span>
            ))}
          </div>
        )}
      </header>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-medium text-gray-100">Ingredients</h2>
          <span className="text-sm text-gray-500">{missingCount} missing</span>
        </div>
        <ul className="mt-3 divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.03]">
          {ingredients.map((ingredient) => (
            <li key={ingredient.ingredientId} className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${ingredient.isMissing ? "bg-amber-400/10 text-amber-200" : "text-gray-300"}`}>
              <span>
                {ingredient.name}
                {ingredient.isOptional && <span className="ml-2 text-xs text-gray-500">optional</span>}
                {ingredient.isMissing && <span className="ml-2 text-xs font-medium uppercase tracking-wide text-amber-300">missing</span>}
              </span>
              <span className="shrink-0 text-gray-500">{ingredient.quantity} {ingredient.unit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-white/10 pt-6">
        <h2 className="text-lg font-medium text-gray-100">Instructions</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-400">{recipe.instructions}</p>
      </section>
    </div>
  );
}
