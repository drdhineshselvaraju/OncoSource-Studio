import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OncoSource Studio | Clinical Trial eSource Demo",
  description:
    "A standards-informed eSource and EDC portfolio prototype for a synthetic Phase II oncology study.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
