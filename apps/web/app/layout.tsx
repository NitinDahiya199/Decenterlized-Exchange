import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEX Terminal",
  description: "Devnet-only hybrid DEX simulator — educational trading terminal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
