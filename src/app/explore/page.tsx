"use client";

import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { gsap } from "@/lib/gsap-config";
import { PROJECTS } from "@/lib/projects-data";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";

const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UxZTFlNyIvPjwvc3ZnPg==";

// 11 portfolio elements recycling the 8 database items
const EXPLORE_PROJECTS = [
  ...PROJECTS,
  { ...PROJECTS[0], slug: `${PROJECTS[0].slug}-dup1` },
  { ...PROJECTS[1], slug: `${PROJECTS[1].slug}-dup2` },
  { ...PROJECTS[2], slug: `${PROJECTS[2].slug}-dup3` },
];

export default function ExplorePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const scrollDeltaAccumulator = useRef(0);

  const [projectList, setProjectList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      setIsHeaderScrolled(currentScrollY > 40);

      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
        scrollDeltaAccumulator.current = 0;
      } else {
        if (delta > 0) {
          if (scrollDeltaAccumulator.current < 0) {
            scrollDeltaAccumulator.current = 0;
          }
          scrollDeltaAccumulator.current += delta;
          if (scrollDeltaAccumulator.current > 150) {
            setIsHeaderVisible(false);
          }
        } else if (delta < 0) {
          if (scrollDeltaAccumulator.current > 0) {
            scrollDeltaAccumulator.current = 0;
          }
          scrollDeltaAccumulator.current += delta;
          if (scrollDeltaAccumulator.current < -30) {
            setIsHeaderVisible(true);
          }
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    const mountTimer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(mountTimer);
    };
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/#case-studies-section");
    }
  };

  useLayoutEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set(headerRef.current, { opacity: 0 });
      gsap.set([titleRef.current, gridContainerRef.current], { y: 30, opacity: 0 });

      // Animate Close sticky header in
      gsap.fromTo(
        headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      // Animate title block
      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: "power4.out", delay: 0.15 }
      );

      // Animate grid images
      gsap.fromTo(
        gridContainerRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.35 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading]);



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
            .order("position", { ascending: true })
            .order("created_at", { ascending: false });

          if (!error && data && data.length > 0) {
            const recycled = [
              ...data,
              { ...data[0], slug: `${data[0].slug}-dup1` },
              { ...data[1 % data.length], slug: `${data[1 % data.length].slug}-dup2` },
              { ...data[2 % data.length], slug: `${data[2 % data.length].slug}-dup3` },
            ];
            setProjectList(recycled);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to static projects dataset:", err);
      }
      // Fallback
      setProjectList(EXPLORE_PROJECTS);
      setIsLoading(false);
    };
    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#09090b] text-white flex flex-col overflow-x-hidden pt-36 pb-24">
        {/* Title Header Skeleton */}
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col items-start gap-4 animate-pulse select-none">
          <div className="w-24 h-4 bg-zinc-900 rounded-md" />
          <div className="w-48 sm:w-64 h-12 sm:h-16 bg-zinc-900 rounded-md" />
        </div>
        
        {/* Staggered Rows Grid Skeleton */}
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 pt-16 flex flex-col gap-6 md:gap-8 animate-pulse select-none">
          {/* Row 1: 4 cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex flex-col gap-3 w-full">
                <div className="w-full aspect-[3/4] bg-zinc-900 rounded-xl" />
                <div className="w-24 h-4 bg-zinc-900 rounded-md mt-1" />
                <div className="w-16 h-3 bg-zinc-900 rounded-md" />
              </div>
            ))}
          </div>
          {/* Row 2: 3 cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 md:max-w-[884px] mx-auto w-full">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-3 w-full">
                <div className="w-full aspect-[3/4] bg-zinc-900 rounded-xl" />
                <div className="w-24 h-4 bg-zinc-900 rounded-md mt-1" />
                <div className="w-16 h-3 bg-zinc-900 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const row1 = projectList.slice(0, 4);  // 4 items
  const row2 = projectList.slice(4, 7);  // 3 items
  const row3 = projectList.slice(7, 11); // 4 items

  return (
    <div
      ref={containerRef}
      id="explore-page"
      data-theme="dark"
      className="relative w-full min-h-screen bg-[#09090b] text-white flex flex-col overflow-x-hidden"
    >
      {/* Sticky Custom Top Header Bar Wrapper */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out select-none ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <header
          ref={headerRef}
          className={`w-full transition-all duration-500 ease-out px-6 sm:px-8 md:px-12 ${
            isHeaderScrolled
              ? "bg-zinc-950/90 backdrop-blur-md py-4"
              : "bg-transparent py-8"
          }`}
        >
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
            <div></div>
            <a
              href="/#case-studies-section"
              onClick={handleClose}
              className="group flex items-center gap-2 font-sans font-semibold text-xs sm:text-sm text-white hover:text-zinc-300 transition-colors duration-300 cursor-pointer"
            >
              <span>Close</span>
              <X className="w-4.5 h-4.5 text-zinc-400 group-hover:rotate-90 transition-transform duration-300" />
            </a>
          </div>
        </header>
      </div>

      {/* Main Title Header */}
      <div
        ref={titleRef}
        className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 pt-28 md:pt-36 flex flex-col items-start gap-4 select-none"
      >
        <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
          Case Studies
        </span>
        <h1 className="font-sans font-semibold text-4xl sm:text-6xl md:text-7xl lg:text-[4.5rem] tracking-tight leading-[1.05] text-white">
          explore work.
        </h1>
      </div>

      {/* Vertical Staggered Rows Container */}
      <div
        ref={gridContainerRef}
        className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 py-16 md:py-24 flex flex-col gap-6 md:gap-8"
      >
        {/* Row 1: 4 columns on PC, 2 on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {row1.map((project, idx) => (
            <Link
              key={`row1-${idx}`}
              href={`/projects/${project.slug}`}
              className="grid-card group flex flex-col gap-3 w-full cursor-pointer"
            >
              <div
                className="relative w-full aspect-[3/4] rounded-lg md:rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 isolate translate-z-0 transition-transform duration-500 ease-out hover:scale-[1.02] shadow-md hover:shadow-xl hover:shadow-black/60"
                style={{
                  transform: "translate3d(0, 0, 0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  unoptimized={true}
                  className="object-cover object-center select-none transition-transform duration-700 ease-out group-hover:scale-105"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
              <div className="flex flex-col gap-1 select-none pl-1">
                <span className="font-sans font-bold text-white text-base sm:text-lg tracking-tight leading-none group-hover:text-zinc-300 transition-colors duration-300">
                  {project.title}
                </span>
                <span className="font-sans font-normal text-zinc-400 text-xs sm:text-sm tracking-tight leading-tight">
                  {project.program}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Row 2: 3 columns on PC (symmetrically sized with Row 1), 2 on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 md:max-w-[884px] mx-auto w-full">
          {row2.map((project, idx) => (
            <Link
              key={`row2-${idx}`}
              href={`/projects/${project.slug}`}
              className="grid-card group flex flex-col gap-3 w-full cursor-pointer"
            >
              <div
                className="relative w-full aspect-[3/4] rounded-lg md:rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 isolate translate-z-0 transition-transform duration-500 ease-out hover:scale-[1.02] shadow-md hover:shadow-xl hover:shadow-black/60"
                style={{
                  transform: "translate3d(0, 0, 0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  unoptimized={true}
                  className="object-cover object-center select-none transition-transform duration-700 ease-out group-hover:scale-105"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
              <div className="flex flex-col gap-1 select-none pl-1">
                <span className="font-sans font-bold text-white text-base sm:text-lg tracking-tight leading-none group-hover:text-zinc-300 transition-colors duration-300">
                  {project.title}
                </span>
                <span className="font-sans font-normal text-zinc-400 text-xs sm:text-sm tracking-tight leading-tight">
                  {project.program}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Row 3: 4 columns on PC, 2 on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {row3.map((project, idx) => (
            <Link
              key={`row3-${idx}`}
              href={`/projects/${project.slug}`}
              className="grid-card group flex flex-col gap-3 w-full cursor-pointer"
            >
              <div
                className="relative w-full aspect-[3/4] rounded-lg md:rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 isolate translate-z-0 transition-transform duration-500 ease-out hover:scale-[1.02] shadow-md hover:shadow-xl hover:shadow-black/60"
                style={{
                  transform: "translate3d(0, 0, 0)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  unoptimized={true}
                  className="object-cover object-center select-none transition-transform duration-700 ease-out group-hover:scale-105"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
              <div className="flex flex-col gap-1 select-none pl-1">
                <span className="font-sans font-bold text-white text-base sm:text-lg tracking-tight leading-none group-hover:text-zinc-300 transition-colors duration-300">
                  {project.title}
                </span>
                <span className="font-sans font-normal text-zinc-400 text-xs sm:text-sm tracking-tight leading-tight">
                  {project.program}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
