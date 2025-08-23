import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fieldwork Activity Tracker",
  description: "Track and manage your outdoor activities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}