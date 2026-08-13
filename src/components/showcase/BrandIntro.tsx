"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BrandIntro() {
  return (
    <section id="brand-intro" className="relative w-full bg-white text-zinc-950 py-24 sm:py-32 px-6 sm:px-8 md:px-12 z-30 flex justify-center">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
        {/* Left Column: Tiny text, button, metadata. Stacks below headline on mobile, floats left on desktop. */}
        <div className="md:col-span-5 flex flex-col justify-between gap-8 md:min-h-[16rem] order-2 md:order-1">
          <div className="space-y-6">
            <p className="font-sans font-light text-zinc-500 text-xs sm:text-sm md:text-base max-w-sm leading-relaxed tracking-tight">
              Independent designer specializing in custom logo marks, scalable visual systems, and polished graphics. I build brands for scale-ups, aligning positioning with aesthetics to drive clarity and revenue.
            </p>
            <div>
              <Link
                href="/about"
                className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-zinc-950 text-white font-sans font-medium text-xs sm:text-sm hover:bg-[#ffd230] hover:text-zinc-950 transition-all duration-300 shadow-sm active:scale-98"
              >
                <span>About Me</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 group-hover:text-zinc-950 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Main large headline text (Gilroy SemiBold, max 3 lines) */}
        <div className="md:col-span-7 order-1 md:order-2 w-full">
          <h2 className="font-sans font-semibold text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-zinc-950 leading-tight md:leading-[1.12] w-full">
            Brand Designer and Logo Architect shaping identities that scale.
          </h2>
        </div>
      </div>
    </section>
  );
}
