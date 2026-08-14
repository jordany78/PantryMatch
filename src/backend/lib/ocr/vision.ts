import { createAdminClient } from "@/backend/lib/supabase/admin";

// Wraps Google Cloud Vision's text detection API and hands raw OCR text
// off to the line-item parser.
//
// Swap this file's implementation to change OCR providers (e.g. Tesseract.js)
// without touching the rest of the app — callers only depend on
// extractTextFromReceipt() and parseLineItems().

export interface OcrResult {
  rawText: string;
}

// Takes the raw image bytes directly (as base64) rather than a URL, so the
// caller doesn't need to first generate a public/signed URL for the file
// just to hand it to Vision.
export async function extractTextFromReceipt(
  imageBase64: string
): Promise<OcrResult> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_VISION_API_KEY is not set");
  }

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Vision API request failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const annotation = data.responses?.[0]?.fullTextAnnotation;
  const rawText: string = annotation?.text ?? "";

  if (!rawText) {
    throw new Error("Vision API returned no text for this image");
  }

  return { rawText };
}

export interface ParsedLineItem {
  rawText: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  matchedIngredientId: string | null;
  confidence: number;
}

// Lines that are clearly not grocery items — skip these during segmentation.
const NOISE_PATTERNS =
  /^(subtotal|total|tax|change|cash|visa|mastercard|debit|credit|card|balance|thank you|store|receipt|cashier|register|approved|auth|ref\s*#|\d{1,2}\/\d{1,2}\/\d{2,4})/i;

// A price at the end of a line, e.g. "ORG BANANA 2LB   3.98" or "MILK $4.29"
const PRICE_AT_END = /^(.+?)\s+\$?(\d+\.\d{2})\s*$/;

// Segments raw OCR text into structured line items and fuzzy-matches
// each against the canonical `ingredients` table.
//
// This is a first-pass heuristic parser, not a robust one — receipts vary
// wildly in layout. Expect to iterate on NOISE_PATTERNS and PRICE_AT_END
// against real receipts you test with, or replace this with an ML-based
// parser later if accuracy matters more than a fast MVP.
export async function parseLineItems(
  rawText: string
): Promise<ParsedLineItem[]> {
  const supabase = createAdminClient();

  // Fetch the full canonical ingredient list once, rather than a query per
  // line — the match check below is a substring scan we do in JS.
  const { data: allIngredients } = await supabase
    .from("ingredients")
    .select("id, name, aliases");

  const candidates =
    allIngredients?.map((ing) => ({
      id: ing.id,
      // Every string we'll check the receipt text against, longest first
      // so a more specific match (e.g. "free range egg" over "egg") wins.
      terms: [ing.name, ...(ing.aliases ?? [])]
        .map((t) => t.toLowerCase())
        .sort((a, b) => b.length - a.length),
    })) ?? [];

  // Receipt text is messy and brand-heavy ("GV ORGANIC MILK 2%"), while
  // canonical ingredient names are short ("Whole Milk", alias "milk"). So
  // the match direction is: does a short canonical term appear INSIDE the
  // longer receipt line — not the other way around.
  function matchIngredient(itemName: string): { id: string; confidence: number } | null {
    const lower = itemName.toLowerCase();
    let best: { id: string; termLength: number } | null = null;

    for (const candidate of candidates) {
      for (const term of candidate.terms) {
        if (term.length >= 3 && lower.includes(term)) {
          if (!best || term.length > best.termLength) {
            best = { id: candidate.id, termLength: term.length };
          }
          break; // longest term for this candidate already checked first
        }
      }
    }

    if (!best) return null;
    // Longer matched term relative to the item name = higher confidence.
    const confidence = Math.min(0.5 + best.termLength / lower.length, 0.95);
    return { id: best.id, confidence };
  }

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !NOISE_PATTERNS.test(l));

  const items: ParsedLineItem[] = [];

  for (const line of lines) {
    const priceMatch = line.match(PRICE_AT_END);
    if (!priceMatch) continue; // skip lines that don't look like "item ... price"

    const [, namePart, priceStr] = priceMatch;
    const price = parseFloat(priceStr);

    // Pull a leading quantity if present, e.g. "2 CHICKEN BREAST"
    const qtyMatch = namePart.match(/^(\d+)\s*[xX@]?\s+(.+)$/);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : null;
    const name = (qtyMatch ? qtyMatch[2] : namePart).trim();

    if (name.length < 2) continue;

    const matched = matchIngredient(name);

    items.push({
      rawText: line,
      name,
      quantity,
      unit: null,
      price,
      matchedIngredientId: matched?.id ?? null,
      confidence: matched?.confidence ?? 0.3,
    });
  }

  return items;
}