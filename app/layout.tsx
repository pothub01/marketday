import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketday — Better groceries, delivered",
  description: "A modern wet-market grocery experience.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
