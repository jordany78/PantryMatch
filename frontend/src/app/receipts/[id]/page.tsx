// Review screen for a single processed receipt.
// Data source: GET /api/receipts/:id
// Confirm/edit line items: PATCH /api/receipts/:id/line-items
// TODO: render <LineItemReview /> (src/components/receipts/)

export default function ReceiptReviewPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Review Receipt {params.id}</h1>
    </main>
  );
}
