import { NextRequest, NextResponse } from "next/server";

// POST /api/receipts
// Accepts an uploaded receipt image, stores it in Supabase Storage,
// and kicks off OCR processing (src/lib/ocr/vision.ts).
export async function POST(req: NextRequest) {
  // TODO: parse multipart form data, upload to Supabase Storage,
  // insert a `receipts` row (status: "processing"), enqueue OCR job
  return NextResponse.json({ message: "not implemented" }, { status: 501 });
}
