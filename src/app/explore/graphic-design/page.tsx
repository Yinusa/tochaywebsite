"use client";

import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { gsap } from "@/lib/gsap-config";
import { GRAPHIC_DESIGN_PROJECTS } from "@/lib/projects-data";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";

export default function GraphicDesignExplorePage() {
  const [projectList, setProjectList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            const filtered = data.filter(
              (p) =>
                p.category === "GRAPHIC DESIGN" ||
                p.category === "PACKAGING" ||
                p.category === "ART DIRECTION" ||
                p.category === "IDENTITY"
            );
            setProjectList(filtered);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Supabase fetch failed:", err);
      }
      // Fallback
      setProjectList(GRAPHIC_DESIGN_PROJECTS);
      setIsLoading(false);
    };
    fetchProjects();
  }, []);



  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);
  const pcScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!pcScrollContainerRef.current) return;
    setIsDragging(true);
    setHasScrolled(true);
    startX.current = e.pageX - pcScrollContainerRef.current.offsetLeft;
    scrollLeftVal.current = pcScrollContainerRef.current.scrollLeft;
  };
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !pcScrollContainerRef.current) return;
    e.preventDefault();
    setHasScrolled(true);
    const x = e.pageX - pcScrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    pcScrollContainerRef.current.scrollLeft = scrollLeftVal.current - walk;
  };

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const scrollDeltaAccumulator = useRef(0);

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
    router.push("/#capabilities-section");
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

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#09090b] text-white flex flex-col overflow-x-hidden pt-36">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col items-start gap-4 animate-pulse select-none">
          <div className="w-24 h-4 bg-zinc-900 rounded-md" />
          <div className="w-48 sm:w-64 h-12 sm:h-16 bg-zinc-900 rounded-md" />
        </div>
        
        <div className="w-full pt-16 pb-24 animate-pulse select-none">
          <div className="w-full md:flex hidden flex-row gap-6 py-6 pl-[max(48px,calc((100vw-1280px)/2+48px))] overflow-hidden">
            <div className="w-[400px] h-[420px] bg-zinc-900 rounded-3xl shrink-0" />
            <div className="w-[400px] h-[420px] bg-zinc-900 rounded-3xl shrink-0 opacity-60" />
            <div className="w-[400px] h-[420px] bg-zinc-900 rounded-3xl shrink-0 opacity-30" />
          </div>
          <div className="w-full md:hidden flex flex-col gap-8 px-6">
            <div className="w-full aspect-[4/3] bg-zinc-900 rounded-3xl" />
            <div className="w-full aspect-[4/3] bg-zinc-900 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

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
              href="/#capabilities-section"
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
          Graphic Design
        </span>
        <h1 className="font-sans font-semibold text-4xl sm:text-6xl md:text-7xl lg:text-[4.5rem] tracking-tight leading-[1.05] text-white">
          graphic design.
        </h1>
      </div>

      {!hasScrolled && projectList.length > 1 && (
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 md:flex justify-end select-none animate-pulse hidden mt-4">
          <span className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-widest">
            drag or scroll horizontally →
          </span>
        </div>
      )}

      {/* CASE STUDY CONTENTS (DOUBLY ADAPTIVE LAYOUT FLOW) */}
      <div
        ref={gridContainerRef}
        className="w-full pt-12 md:pt-16 pb-24 md:pb-36"
      >
        {/* Desktop horizontal track */}
        <div className="w-full md:block hidden overflow-hidden select-none">
          <div
            ref={pcScrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onScroll={() => setHasScrolled(true)}
            className={`w-full flex flex-row items-start gap-6 overflow-x-auto scrollbar-none py-6 pl-[max(48px,calc((100vw-1280px)/2+48px))] pr-[max(48px,calc((100vw-1280px)/2+48px))] ${
              isDragging ? "cursor-grabbing select-none" : "cursor-grab"
            }`}
          >
            {projectList.map((project, idx) => (
              <div key={`graphic-pc-${idx}`} className="flex flex-col gap-3 shrink-0">
                {project.has_details ? (
                  <Link
                    href={`/projects/${project.slug}`}
                    className="group relative h-[420px] w-auto rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 select-none isolate translate-z-0 cursor-pointer block"
                    style={{
                      transform: "translate3d(0, 0, 0)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-auto object-contain transition-transform duration-700 ease-out group-hover:scale-102"
                    />
                  </Link>
                ) : (
                  <div
                    className="relative h-[420px] w-auto rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 select-none isolate translate-z-0 block"
                    style={{
                      transform: "translate3d(0, 0, 0)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                )}

                {project.has_details && (
                  <Link
                    href={`/projects/${project.slug}`}
                    className="group flex flex-col gap-0.5 select-none pl-1 cursor-pointer"
                  >
                    <span className="font-sans font-bold text-white text-base tracking-tight leading-none group-hover:text-[#ffd230] transition-colors duration-300">
                      {project.title}
                    </span>
                    <span className="font-sans font-semibold text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors duration-300 flex items-center gap-1 mt-0.5">
                      <span>view all designs</span>
                      <span className="transform transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile stacked view (vertical, one by one, full width, auto height) */}
        <div className="w-full md:hidden flex flex-col gap-8 px-6">
          {projectList.map((project, idx) => (
            <div key={`graphic-mb-${idx}`} className="flex flex-col gap-3 w-full">
              {project.has_details ? (
                <Link
                  href={`/projects/${project.slug}`}
                  className="group relative w-full rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 isolate translate-z-0 block cursor-pointer"
                  style={{
                    transform: "translate3d(0, 0, 0)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-auto object-contain"
                  />
                </Link>
              ) : (
                <div 
                  className="relative w-full rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 isolate translate-z-0 block"
                  style={{
                    transform: "translate3d(0, 0, 0)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}

              {project.has_details && (
                <Link
                  href={`/projects/${project.slug}`}
                  className="group flex flex-col gap-0.5 select-none pl-1 cursor-pointer"
                >
                  <span className="font-sans font-bold text-white text-base tracking-tight leading-none group-hover:text-[#ffd230] transition-colors duration-300">
                    {project.title}
                  </span>
                  <span className="font-sans font-semibold text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors duration-300 flex items-center gap-1 mt-0.5">
                    <span>view all designs</span>
                    <span>↗</span>
                  </span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
