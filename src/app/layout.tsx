import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import SmoothScroll from "@/components/ui/SmoothScroll";
import "./globals.css";

// Only load Space Mono for the monospace word fallback
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TY STUDIO © — High-End Brand Systems & Creative Technology",
  description:
    "Building bespoke digital brand systems, creative frontend architectures, and high-end interactive websites for scale-ups. Powered by Next.js, TS, and GSAP.",
  keywords: [
    "Creative Technologist",
    "Lead Frontend Engineer",
    "Brand Systems",
    "Scale-ups Agency",
    "Next.js Portfolio",
    "GSAP Animation",
    "Lenis Smooth Scroll",
  ],
  authors: [{ name: "TY Studio", url: "https://tystudio.design" }],
  openGraph: {
    title: "TY STUDIO © — High-End Brand Systems & Creative Technology",
    description:
      "Building bespoke digital brand systems, creative frontend architectures, and high-end interactive websites for scale-ups.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceMono.variable} h-full antialiased selection:bg-zinc-950 selection:text-white`}
    >
      <body className="min-h-full flex flex-col bg-[#f8f8f7] text-zinc-950 font-sans">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
