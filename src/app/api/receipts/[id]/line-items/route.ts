import { NextRequest, NextResponse } from "next/server";

// PATCH /api/receipts/:id/line-items
// Confirms/edits/rejects parsed line items; confirmed items get inserted
// into `pantry_items`.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: update `receipt_line_items`, insert confirmed rows into `pantry_items`
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
