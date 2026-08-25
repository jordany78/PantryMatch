import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/server";
import { extractTextFromReceipt, parseLineItems } from "@/lib/ocr/vision";

// POST /api/receipts
// Multipart form data: { file: <image> }
//
// Uploads the image to Supabase Storage, runs OCR + parsing synchronously,
// and inserts the resulting line items. Synchronous is fine for an MVP —
// Vision API calls typically take 1-3s. If receipts get large or OCR gets
// slower providers swapped in, move this to a background job (e.g. a queue
// + a separate worker) instead of blocking the request.
//
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const { supabase, user } = await getAuthenticatedClient();

  if (!user) {
    return NextResponse.json({ error: "authentication required" }, { status: 401 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "file is required (multipart form field)" },
      { status: 400 }
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

  // Requires a "receipts" bucket to exist in Supabase Storage — create it
  // once via the dashboard (Storage -> New bucket -> name it "receipts").
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(storagePath, bytes, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: receipt, error: insertError } = await supabase
    .from("receipts")
    .insert({
      user_id: user.id,
      image_url: storagePath,
      status: "processing",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    const base64 = Buffer.from(bytes).toString("base64");
    const { rawText } = await extractTextFromReceipt(base64);
    const parsed = await parseLineItems(rawText, supabase);

    if (parsed.length > 0) {
      const { error: lineItemsError } = await supabase
        .from("receipt_line_items")
        .insert(
          parsed.map((item) => ({
            receipt_id: receipt.id,
            raw_text: item.rawText,
            matched_ingredient_id: item.matchedIngredientId,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            confidence_score: item.confidence,
            confirmed: false,
          }))
        );

      if (lineItemsError) {
        throw new Error(lineItemsError.message);
      }
    }

    // Stays "processing" — becomes "reviewed" once the user confirms line
    // items via PATCH /api/receipts/:id/line-items. This just means OCR
    // succeeded and the receipt is now awaiting review.
    return NextResponse.json({ receipt, lineItemCount: parsed.length }, { status: 201 });
  } catch (err) {
    await supabase
      .from("receipts")
      .update({ status: "failed" })
      .eq("id", receipt.id);

    return NextResponse.json(
      {
        receipt: { ...receipt, status: "failed" },
        error: err instanceof Error ? err.message : "OCR processing failed",
      },
      { status: 502 }
    );
  }
}
