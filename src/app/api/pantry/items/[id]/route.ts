import { NextRequest, NextResponse } from "next/server";

// DELETE /api/pantry/items/:id - remove an item (used up, expired, etc.)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: delete `pantry_items` row scoped to the authenticated user
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
