// Recipe detail: full ingredient list, match %, missing ingredients.
// Data source: GET /api/recipes/:id/match

export default function RecipeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Recipe {params.id}</h1>
    </main>
  );
}
