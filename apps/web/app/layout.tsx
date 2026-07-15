import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Astraya 星脉 · 水晶臻选 · 大师解惑",
  description:
    "每一颗水晶都有来处，每一次解惑皆可溯源。Astraya 为你收藏星辰脉络中的能量之石与东方玄学的智慧对话。",
  openGraph: {
    title: "Astraya 星脉",
    description: "水晶臻选 · 大师解惑 · 链上溯源",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <SiteHeader />
        <main className="min-h-[70vh]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
