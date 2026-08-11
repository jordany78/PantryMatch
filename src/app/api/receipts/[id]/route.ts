import { NextRequest, NextResponse } from "next/server";

// GET /api/receipts/:id
// Returns receipt status and parsed line items (once OCR completes).
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: fetch `receipts` row + associated `receipt_line_items`
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
