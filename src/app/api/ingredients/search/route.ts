import { NextRequest, NextResponse } from "next/server";

// GET /api/ingredients/search?q=
// Autocomplete search against the canonical `ingredients` table,
// used for manual pantry add. Backed by pg_trgm for fuzzy matching.
export async function GET(req: NextRequest) {
  // TODO: query `ingredients` with pg_trgm similarity search
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
