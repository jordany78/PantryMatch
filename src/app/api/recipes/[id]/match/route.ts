import { NextRequest, NextResponse } from "next/server";

// GET /api/recipes/:id/match
// Detailed match breakdown for a single recipe: matched vs. missing ingredients.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: fetch recipe_ingredients for :id, diff against pantry_items
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
