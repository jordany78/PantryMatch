export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">PantryMatch</h1>
      <p className="mt-2 text-gray-600">
        Upload a receipt, build your pantry, and see which recipes you can
        make right now.
      </p>
      {/* TODO: link to /receipts (upload), /pantry, /recipes */}
    </main>
  );
}
