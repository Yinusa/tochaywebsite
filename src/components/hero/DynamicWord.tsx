"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap-config";

export interface WordConfig {
  id: string;
  word: string;
  fontClass: string;
  ariaLabel: string;
}

export const ROTATING_WORDS: WordConfig[] = [
  {
    id: "intention",
    word: "intention.",
    fontClass: "font-editorial italic font-normal text-zinc-950 tracking-tight leading-none",
    ariaLabel: "Ogg Medium Italic Editorial Serif",
  },
  {
    id: "creativity",
    word: "creativity.",
    fontClass: "font-script font-normal text-zinc-950 scale-[1.1] origin-bottom-left leading-[0.7]",
    ariaLabel: "Amsterdam Signature Script",
  },
  {
    id: "conviction",
    word: "conviction.",
    fontClass: "font-sans font-bold text-zinc-950 tracking-[-0.04em] leading-none",
    ariaLabel: "Gilroy Bold",
  },
  {
    id: "clarity",
    word: "clarity.",
    fontClass: "font-mono font-medium text-zinc-950 tracking-tighter leading-none",
    ariaLabel: "Space Mono Monospace",
  },
];

export default function DynamicWord() {
  const [index, setIndex] = useState(0);
  const wordRef = useRef<HTMLSpanElement | null>(null);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAnimating.current || !wordRef.current) return;
      isAnimating.current = true;

      const nextIndex = (index + 1) % ROTATING_WORDS.length;

      // Morph animation timeline: vertical slide out top, content update, slide in from bottom
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });

      tl.to(wordRef.current, {
        y: -24,
        opacity: 0,
        filter: "blur(4px)",
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          setIndex(nextIndex);
        },
      });

      tl.fromTo(
        wordRef.current,
        {
          y: 24,
          opacity: 0,
          filter: "blur(4px)",
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.45,
          ease: "power3.out",
        }
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [index]);

  const current = ROTATING_WORDS[index];

  return (
    <span
      ref={containerRef}
      className="inline-block relative min-w-[140px] sm:min-w-[220px] md:min-w-[260px] text-left align-baseline"
      aria-live="polite"
      aria-label={`Current swapping style: ${current.ariaLabel}`}
    >
      <span
        ref={wordRef}
        className={`inline-block select-none align-baseline ${current.fontClass}`}
      >
        {current.word}
      </span>
    </span>
  );
}
