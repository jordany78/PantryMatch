export const metadata = {
  title: "PantryMatch API",
  description: "Kitchen inventory & recipe matching",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
