"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const FOOTER_LINKS = [
    { label: "Case Studies", link: "/explore" },
    { label: "Branding", link: "/explore/branding" },
    { label: "Graphic Designs", link: "/explore/graphic-design" },
  ];

  return (
    <footer
      id="footer-section"
      data-theme="dark"
      className="relative w-full bg-zinc-950 text-white pt-24 pb-12 px-6 sm:px-8 md:px-12 border-t border-zinc-900 z-10 flex flex-col justify-center overflow-hidden"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col">
        {/* Large Centered Typographic Stack (Editorial Gilroy) */}
        <div className="flex flex-col items-center justify-center font-sans font-bold text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] tracking-tighter leading-[1.05] select-none text-center mb-12 uppercase">
          {FOOTER_LINKS.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;
            return (
              <Link
                key={idx}
                href={item.link}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`transition-colors duration-500 ease-out py-0.5 ${
                  isHovered
                    ? "text-white"
                    : isDimmed
                      ? "text-zinc-800"
                      : "text-zinc-500"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Center horizontal row of navigation pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 select-none mb-20">
          <Link
            href="/#contact-section"
            className="px-6 py-2.5 rounded-full bg-white text-zinc-950 font-sans font-semibold text-xs sm:text-sm hover:bg-[#ffd230] transition-colors duration-300 shadow-md active:scale-98"
          >
            Work with me
          </Link>
          <Link
            href="/explore"
            className="font-sans font-medium text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors duration-300"
          >
            Explore
          </Link>
          <Link
            href="/about"
            className="font-sans font-medium text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors duration-300"
          >
            About
          </Link>
          <Link
            href="/pricing"
            className="font-sans font-medium text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors duration-300"
          >
            Pricing
          </Link>
        </div>

        {/* Bottom controls panel */}
        <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-12 md:gap-6 border-t border-zinc-900/60 pt-16">
          {/* Left Column: Newsletter Subscription */}
          <div className="w-full md:w-1/2 flex flex-col items-start gap-3">
            <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest select-none">
              Keep up to date
            </span>
            {subscribed ? (
              <span className="font-sans font-semibold text-[#ffd230] text-sm py-3">
                Subscribed! Thank you for staying updated.
              </span>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="w-full max-w-sm flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/80 rounded-full px-5 py-3 focus-within:border-zinc-500 transition-colors duration-300"
              >
                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Your email"
                  className="bg-transparent border-0 focus:outline-hidden focus:ring-0 text-white placeholder:text-zinc-700 text-sm font-sans w-full"
                />
                <button type="submit" className="focus:outline-hidden cursor-pointer">
                  <ArrowRight className="w-4 h-4 text-zinc-400 hover:text-white transition-colors duration-300" />
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Social Links */}
          <div className="w-full md:w-1/2 flex flex-wrap items-center gap-6 sm:gap-8 justify-start md:justify-end select-none">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans font-bold text-sm sm:text-base text-white hover:text-[#ffd230] transition-colors duration-300"
            >
              X (Twitter)
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans font-bold text-sm sm:text-base text-white hover:text-[#ffd230] transition-colors duration-300"
            >
              LinkedIn
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans font-bold text-sm sm:text-base text-white hover:text-[#ffd230] transition-colors duration-300"
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Legal & Copyright Row */}
        <div className="w-full border-t border-zinc-900/40 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <span className="font-sans text-[10px] sm:text-xs text-zinc-600">
            © {new Date().getFullYear()} TY STUDIO. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="font-sans text-[10px] sm:text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-300"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="font-sans text-[10px] sm:text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-300"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
