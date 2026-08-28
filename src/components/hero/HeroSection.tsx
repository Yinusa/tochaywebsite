"use client";

import React, { useLayoutEffect, useRef } from "react";
import DynamicWord from "./DynamicWord";
import TypewriterSubtext from "./TypewriterSubtext";
import { gsap } from "@/lib/gsap-config";

export default function HeroSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Intro entrance timeline
      gsap.fromTo(
        containerRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.2 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen bg-[#f8f8f7] text-zinc-950 px-6 sm:px-8 md:px-12 overflow-hidden flex flex-col justify-center items-center"
    >
      {/* Centered layout box */}
      <div
        ref={containerRef}
        className="relative max-w-4xl w-full text-center select-none"
      >
        {/* Main Hero Headline - Gilroy Medium, centered, elegantly sized and kerned tightly (-35 tracking) */}
        <h1 className="font-sans font-medium text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[-0.035em] text-zinc-950 leading-tight">
          <span>Design with </span>
          <DynamicWord />
        </h1>
      </div>

      {/* Scroll-Driven Typewriter subtext positioned absolutely near the bottom */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full px-6 max-w-3xl mx-auto z-10">
        <TypewriterSubtext triggerRef={heroRef} />
      </div>
    </section>
  );
}
