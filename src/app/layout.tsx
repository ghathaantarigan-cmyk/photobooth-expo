import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Expo Photobooth - UIN SMH Banten",
  description:
    "Web Photobooth Stand Kontingen UIN Sultan Maulana Hasanuddin Banten",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={poppins.variable}>
      {/* Ganti bg-slate-900 menjadi bg-white */}
      <body
        className={`${poppins.className} font-sans antialiased text-slate-800 bg-white`}
      >
        {children}
      </body>
    </html>
  );
}
