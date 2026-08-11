// Wraps Google Cloud Vision's text detection API and hands raw OCR text
// off to the line-item parser.
//
// Swap this file's implementation to change OCR providers (e.g. Tesseract.js)
// without touching the rest of the app.

export interface OcrResult {
  rawText: string;
}

export async function extractTextFromReceipt(
  imageUrl: string
): Promise<OcrResult> {
  // TODO: call Google Cloud Vision API with GOOGLE_CLOUD_VISION_API_KEY
  throw new Error("not implemented");
}

export interface ParsedLineItem {
  rawText: string;
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
  confidence: number;
}

// Segments raw OCR text into structured line items and fuzzy-matches
// each against the canonical `ingredients` table.
export async function parseLineItems(
  rawText: string
): Promise<ParsedLineItem[]> {
  // TODO: regex/heuristic segmentation + pg_trgm fuzzy match against ingredients
  throw new Error("not implemented");
}
