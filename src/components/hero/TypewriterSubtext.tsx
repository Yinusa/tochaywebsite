"use client";

import React, { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, TextPlugin } from "@/lib/gsap-config";

interface TypewriterSubtextProps {
  sentence?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const DEFAULT_SENTENCE =
  "Building brand systems that drive clarity, positioning, and revenue for scale-ups.";

export default function TypewriterSubtext({
  sentence = DEFAULT_SENTENCE,
  triggerRef,
}: TypewriterSubtextProps) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!textRef.current) return;

      const targetTrigger = triggerRef?.current || containerRef.current;
      if (!targetTrigger) return;

      // Start with empty content
      textRef.current.textContent = "";

      // GSAP ScrollTrigger to type / delete text on scroll
      gsap.to(textRef.current, {
        text: {
          value: sentence,
          delimiter: "",
        },
        ease: "none",
        scrollTrigger: {
          trigger: "body",      // Bind directly to body to avoid React ref mounting race conditions
          start: "10px top",    // Start typing only when the user scrolls down past 10px
          end: "300px top",     // Complete typing when user scrolls down 300px
          scrub: 0.5,           // Syncs scrubbing with scroll position
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [sentence, triggerRef]);

  return (
    <div
      ref={containerRef}
      className="relative max-w-[280px] sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto min-h-[5rem] sm:min-h-[3.5rem] text-center"
    >
      <span
        ref={textRef}
        className="font-sans font-normal text-zinc-500 text-xs sm:text-sm md:text-base tracking-tight select-none leading-relaxed"
      >
        {/* Injected/backspaced characters go here */}
      </span>
      <span
        className="inline-block w-[1.5px] h-[1.1em] bg-zinc-950 ml-1 translate-y-[2px] animate-[pulse_0.9s_infinite] select-none"
        aria-hidden="true"
      />
    </div>
  );
}
