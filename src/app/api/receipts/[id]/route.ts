import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/receipts/:id?user_id=<uuid>
// Returns receipt status and its parsed line items (populated once OCR
// completes in POST /api/receipts).
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json(
      { error: "user_id query param is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (receiptError || !receipt) {
    return NextResponse.json({ error: "receipt not found" }, { status: 404 });
  }

  const { data: lineItems, error: lineItemsError } = await supabase
    .from("receipt_line_items")
    .select("*, ingredients(name, category)")
    .eq("receipt_id", params.id);

  if (lineItemsError) {
    return NextResponse.json({ error: lineItemsError.message }, { status: 500 });
  }

  return NextResponse.json({ receipt, lineItems });
}
