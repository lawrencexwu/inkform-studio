import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "墨象 Inkform Studio",
  description:
    "Traditional Chinese calligraphy composition tool — compose, style and export ink artwork in the browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
