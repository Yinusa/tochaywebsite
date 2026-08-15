"use client";

import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap } from "@/lib/gsap-config";
import { supabase } from "@/lib/supabase";

import { PROJECTS } from "@/lib/projects-data";

import ScrollCursorWrapper from "@/components/ui/ScrollCursorWrapper";

const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UxZTFlNycvPjwvc3ZnPg==";

export default function CaseStudies() {
  const [projectList, setProjectList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
        ) {
          const { data, error } = await supabase
            .from("portfolio_projects")
            .select("*")
            .eq("is_case_study", true)
            .order("position", { ascending: true })
            .order("created_at", { ascending: false });

          if (!error && data && data.length > 0) {
            setProjectList(data as any);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to static projects dataset:", err);
      }
      setProjectList(PROJECTS);
      setIsLoading(false);
    };
    fetchProjects();
  }, []);
  
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);

  // 1. PC Click and Drag swiping logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    // Track initial drag coordinate and current scroll position
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftVal.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Drag navigation
    if (isDragging && scrollContainerRef.current) {
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX.current) * 1.5; // Drag speed multiplier
      scrollContainerRef.current.scrollLeft = scrollLeftVal.current - walk;
    }
  };

  // 2. Mobile touch swipe focused card index tracker
  const handleScroll = () => {
    if (!scrollContainerRef.current || window.innerWidth >= 768) return;

    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll(".case-card-wrapper");
    const viewportCenter = window.innerWidth / 2;

    let minDistance = Infinity;
    let activeIdx = 0;

    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - viewportCenter);

      if (distance < minDistance) {
        minDistance = distance;
        activeIdx = idx;
      }
    });

    setFocusedIndex(activeIdx);
  };

  return (
    <section
      id="case-studies-section"
      data-theme="dark"
      className="relative w-full bg-[#09090b] text-white pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden z-30 flex flex-col justify-center"
    >
      {/* Top Header Row (Aligned with standard container padding) */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col items-start gap-4 select-none mb-10 md:mb-14">
        <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
          Case Studies
        </span>
        <h3 className="font-sans font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-white tracking-tight leading-[1.1] max-w-2xl">
          Design a future so irresistible, it becomes inevitable.
        </h3>
        <div className="mt-2">
          <Link
            href="/explore"
            className="group relative inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white text-zinc-950 font-sans font-semibold text-xs sm:text-sm hover:bg-[#ffd230] transition-colors duration-300 shadow-md active:scale-98"
          >
            <span>Explore</span>
            <ArrowRight className="w-4 h-4 text-zinc-900 group-hover:translate-x-0.5 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* Bottom Slider Track (Spans edge-to-edge) */}
      <ScrollCursorWrapper>
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`w-full flex flex-row items-end gap-4 md:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory md:snap-none pt-8 pb-12 px-6 sm:px-8 md:pl-[max(48px,calc((100vw-1280px)/2+48px))] md:pr-[max(48px,calc((100vw-1280px)/2+48px))] ${
            isDragging ? "select-none" : ""
          }`}
        >
          {/* Dynamic Project Cards / Skeleton Loader */}
          {isLoading ? (
            [0, 1, 2].map((idx) => {
              const heightClasses = [
                "md:h-[580px]", // Tall
                "md:h-[490px]", // Medium
                "md:h-[400px]", // Short
              ];
              const heightClass = heightClasses[idx % 3];

              return (
                <div
                  key={`cs-skeleton-${idx}`}
                  className={`shrink-0 w-[280px] sm:w-[320px] md:w-[400px] h-[340px] ${heightClass} rounded-2xl md:rounded-3xl bg-zinc-900/40 border border-zinc-900/50 animate-pulse`}
                />
              );
            })
          ) : (
            projectList.map((project, index) => {
              // PC Staggered Heights: Tall -> Medium -> Short
              const heightClasses = [
                "md:h-[580px]", // Tall
                "md:h-[490px]", // Medium
                "md:h-[400px]", // Short
              ];
              const heightClass = heightClasses[index % 3];

              // Mobile focus logic check
              const isFocusedMobile = index === focusedIndex;

              return (
                <Link
                  key={project.title}
                  href={`/projects/${project.slug}`}
                  className={`case-card-wrapper shrink-0 snap-center w-[280px] sm:w-[320px] md:w-[400px] flex flex-col transition-all duration-500 ease-out ${
                    // Mobile active zoom/hover focus effect
                    isFocusedMobile
                      ? "scale-[1.03] -translate-y-2"
                      : "md:scale-100 md:translate-y-0"
                  } md:hover:-translate-y-4 md:hover:scale-[1.02] cursor-pointer`}
                >
                  {/* Image Card Container (Uniform PC Heights) */}
                  <div
                    className={`relative w-full h-[340px] ${heightClass} rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-zinc-900 group isolate translate-z-0`}
                    style={{
                      transform: "translate3d(0, 0, 0)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    {/* Cover Project Image */}
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      unoptimized={true}
                      className="object-cover object-center select-none transition-transform duration-700 ease-out group-hover:scale-105"
                      priority={index < 2}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />

                    {/* Gradient Overlay removed for bright, undimmed card look */}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </ScrollCursorWrapper>
    </section>
  );
}
