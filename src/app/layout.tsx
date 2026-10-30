import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expo Photobooth",
  description: "Digital Web-based Photobooth Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-950 text-white">{children}</body>
    </html>
  );
}
