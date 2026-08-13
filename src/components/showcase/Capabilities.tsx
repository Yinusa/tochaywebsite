"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CapabilityItem {
  name: string;
  subtitle: string;
  link: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    name: "Branding",
    subtitle: "Elevating businesses into memorable icons.",
    link: "/explore/branding",
  },
  {
    name: "Graphic Design",
    subtitle: "Stripping legacy down to its typographic core.",
    link: "/explore/graphic-design",
  },
  {
    name: "Product Design",
    subtitle: "Engineering intuitive user journeys on high-fidelity canvas.",
    link: "/explore/product-design",
  },
];

export default function Capabilities() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Fade and slide header block
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Fade and slide list items
      if (listRef.current) {
        gsap.fromTo(
          listRef.current.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: listRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="capabilities-section"
      className="relative w-full bg-[#f8f8f7] text-[#09090b] py-24 md:py-36 overflow-hidden z-30 flex flex-col justify-center border-t border-zinc-200/50"
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col">
        {/* Section Header */}
        <div ref={headerRef} className="flex flex-col items-start gap-4 select-none mb-14 md:mb-20">
          <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
            Capabilities
          </span>
          <h3 className="font-sans font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-[#09090b] tracking-tight leading-[1.1] max-w-2xl">
            Select a program to explore the archive of our work.
          </h3>
        </div>

        {/* Dynamic Capabilities List */}
        <div
          ref={listRef}
          className="w-full flex flex-col border-t border-zinc-200/80 select-none"
        >
          {CAPABILITIES.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const isDimmed = hoveredIndex !== null && hoveredIndex !== idx;

            return (
              <Link
                key={idx}
                href={item.link}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group w-full flex items-center justify-between py-7 px-4 sm:px-6 border-b transition-all duration-500 ease-out cursor-pointer ${
                  isHovered
                    ? "bg-zinc-950 text-white border-transparent rounded-2xl px-6 sm:px-8 shadow-xl scale-[1.01] -translate-y-0.5"
                    : isDimmed
                      ? "border-zinc-200/80 text-zinc-400 opacity-30"
                      : "border-zinc-200/80 text-[#09090b]"
                }`}
              >
                {/* Left Side: Name and Subtitle */}
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-8 gap-2 md:gap-24">
                  <span
                    className={`font-sans font-bold text-2xl sm:text-3xl tracking-tight transition-colors duration-500 ${
                      isHovered
                        ? "text-white"
                        : isDimmed
                          ? "text-zinc-400"
                          : "text-zinc-950"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span
                    className={`font-sans font-normal text-sm sm:text-base transition-colors duration-500 ${
                      isHovered
                        ? "text-zinc-400"
                        : isDimmed
                          ? "text-zinc-300"
                          : "text-zinc-500"
                    }`}
                  >
                    {item.subtitle}
                  </span>
                </div>

                {/* Right Side: Arrow Action Indicator */}
                <div
                  className={`shrink-0 flex items-center justify-center transition-all duration-500 ease-out ${
                    isHovered
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-4"
                  }`}
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
