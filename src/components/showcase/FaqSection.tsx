"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FaqItem {
  number: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    number: "01",
    question: "What services do you offer?",
    answer: "We specialize in building cohesive brand identities, creative frontend design systems, and high-fidelity product interfaces. Our services span from visual strategy and print packaging to responsive Next.js architectures.",
  },
  {
    number: "02",
    question: "How long does a typical project take?",
    answer: "Most projects take between 4 to 8 weeks, depending on the scale and complexity. Brand sprints can be completed faster, while custom application builds require deep prototyping, testing, and production alignment.",
  },
  {
    number: "03",
    question: "What is your project pricing model?",
    answer: "We operate on a flat-fee, project-based pricing structure to ensure absolute transparency. Sprints and deliverables are scoped upfront, so there are never any unexpected hourly overruns.",
  },
  {
    number: "04",
    question: "Can we work together if we are in different time zones?",
    answer: "Yes, we work with scale-ups globally. We align our workflows with asynchronous tools (Slack, Figma, Notion) and schedule sync meetings at mutually convenient times.",
  },
  {
    number: "05",
    question: "How do you hand over completed code projects?",
    answer: "Codebases are handed over via clean GitHub repositories. We provide detailed setup guides, component design systems, and configuration variables (such as Supabase, Vercel, or custom API keys) for immediate launch.",
  },
];

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate left title column
      gsap.fromTo(
        leftColRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: leftColRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Animate right accordion rows
      if (rightColRef.current) {
        gsap.fromTo(
          rightColRef.current.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rightColRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const toggleAccordion = (idx: number) => {
    setActiveIndex(activeIndex === idx ? null : idx);
  };

  return (
    <section
      ref={containerRef}
      id="faq-section"
      className="relative w-full bg-[#f8f8f7] text-[#09090b] pb-24 md:pb-36 overflow-hidden z-30 flex flex-col justify-center border-t border-zinc-200/50"
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col md:flex-row items-start justify-between gap-12 md:gap-16 pt-16">
        {/* Left Column: Title & Info */}
        <div ref={leftColRef} className="w-full md:w-1/3 flex flex-col items-start gap-4 select-none">
          <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
            FAQ
          </span>
          <h3 className="font-sans font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-[#09090b] tracking-tight leading-[1.1] max-w-sm">
            Curiosities & Mechanics.
          </h3>
        </div>

        {/* Right Column: Interactive Accordion List */}
        <div ref={rightColRef} className="w-full md:w-2/3 flex flex-col border-t border-zinc-200">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = activeIndex === idx;
            const contentRef = useRef<HTMLDivElement>(null);

            return (
              <div
                key={idx}
                className="w-full flex flex-col border-b border-zinc-200 select-none group"
              >
                {/* Accordion Trigger Header Button */}
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between py-6 text-left cursor-pointer focus:outline-hidden"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-6 sm:gap-10 pr-6">
                    {/* Mono Brutalist numbering */}
                    <span className="font-mono text-xs sm:text-sm text-zinc-400 pt-1">
                      {item.number}
                    </span>
                    {/* Question Title */}
                    <span className="font-sans font-semibold text-lg sm:text-xl text-zinc-950 group-hover:text-zinc-600 transition-colors duration-300">
                      {item.question}
                    </span>
                  </div>

                  {/* Morphing plus icon symbol */}
                  <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                    <span
                      className={`absolute block w-4 h-[1.5px] bg-[#09090b] transition-transform duration-500 ease-out ${
                        isOpen ? "rotate-90" : "rotate-0"
                      }`}
                    />
                    <span
                      className={`absolute block w-[1.5px] h-4 bg-[#09090b] transition-transform duration-500 ease-out ${
                        isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Answer Body */}
                <div
                  ref={contentRef}
                  style={{
                    height: isOpen ? contentRef.current?.scrollHeight : 0,
                  }}
                  className="transition-[height] duration-500 ease-in-out overflow-hidden"
                >
                  <div className="pl-12 sm:pl-16 pb-6 pr-6 font-sans font-light text-zinc-500 text-sm sm:text-base leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
