import { NextRequest, NextResponse } from "next/server";

// GET /api/recipes
// Lists recipes with computed match % against the user's pantry,
// sortable/filterable by match %, cuisine, prep time, dietary tags.
export async function GET(req: NextRequest) {
  // TODO: fetch `recipes`, run computeMatch() per recipe (src/lib/matching/computeMatch.ts)
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
