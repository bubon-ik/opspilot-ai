import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsPilot AI",
  description: "AI workflow triage dashboard for operations teams."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
