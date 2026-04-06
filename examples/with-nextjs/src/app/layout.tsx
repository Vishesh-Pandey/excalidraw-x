export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <body style={{ margin: 0, height: "100%", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
