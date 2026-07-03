import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import TopNav from "@/components/TopNav";
import "./globals.css";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixelify",
});

export const metadata: Metadata = {
  title: "Trokk — AI Agent Research Simulation",
  description: "Experiment control panel and observation dashboard for AI agent simulations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${pixelify.variable} font-[family-name:var(--font-pixelify)]`}>
        <TopNav />
        <main className="max-w-7xl mx-auto px-4 py-6 page-enter">{children}</main>
      </body>
    </html>
  );
}
