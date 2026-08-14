// Receipt upload entry point.
// On upload: POST /api/receipts -> kicks off OCR job
// TODO: render <ReceiptUploader /> (src/components/receipts/)

export default function ReceiptsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Scan a Receipt</h1>
    </main>
  );
}
