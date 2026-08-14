import type { MatchResult } from "@/lib/matching/computeMatch";
import type { Recipe } from "@/types";
import { MatchBadge } from "./MatchBadge";

// Summary card for a recipe list item, showing its match %.
// TODO: image, name, cuisine/prep time, <MatchBadge />

export function RecipeCard({
  recipe,
  match,
}: {
  recipe: Recipe;
  match: MatchResult;
}) {
  return (
    <div>
      <h3>{recipe.name}</h3>
      <MatchBadge percent={match.matchPercent} />
    </div>
  );
}
