import { NextRequest, NextResponse } from "next/server";

// GET /api/pantry/items - list current inventory
// POST /api/pantry/items - manually add an item
export async function GET(req: NextRequest) {
  // TODO: fetch `pantry_items` for the authenticated user
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}

export async function POST(req: NextRequest) {
  // TODO: insert a manually-added `pantry_items` row
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
