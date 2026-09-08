import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketday — Better groceries, delivered",
  description: "A modern wet-market grocery experience.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Marketday — Better groceries, delivered",
    description: "Fresh produce, quality cuts, and the freshest catch delivered to your table.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
