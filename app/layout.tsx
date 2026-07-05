import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, Oswald } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-dm-sans",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "MouvementInk — Projects",
  description: "Private project tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${oswald.variable}`}>
      <body className="min-h-screen text-charcoal font-sans antialiased bg-white">
        {children}
      </body>
    </html>
  );
}
