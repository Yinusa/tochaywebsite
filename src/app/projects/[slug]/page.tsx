"use client";

import React, { use, useLayoutEffect, useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, Maximize2, Plus, Minus, RotateCw, Info, Calendar } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import ScrollCursorWrapper from "@/components/ui/ScrollCursorWrapper";
import { gsap } from "@/lib/gsap-config";
import { PROJECTS } from "@/lib/projects-data";
import { supabase } from "@/lib/supabase";

const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UxZTFlNyIvPjwvc3ZnPg==";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug || "";
  const router = useRouter();

  const [projectList, setProjectList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showcaseBlocks, setShowcaseBlocks] = useState<any[]>([]);

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
            setProjectList(data);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Supabase fetch failed:", err);
      }
      // Fallback
      setProjectList(PROJECTS);
      setIsLoading(false);
    };
    fetchProjects();
  }, []);



  // Find project matching the slug (stripping duplicate suffixes if routing from explore)
  const baseSlug = slug.replace(/-dup\d+$/, "");
  const project = projectList.find((p) => p.slug === baseSlug) || projectList[0] || PROJECTS[0];

  useEffect(() => {
    if (!project?.id) return;

    const fetchShowcaseBlocks = async () => {
      try {
        const { data, error } = await supabase
          .from("showcase_images")
          .select("*")
          .eq("project_id", project.id)
          .order("display_order", { ascending: true });
        if (!error && data) {
          setShowcaseBlocks(data);
        } else {
          setShowcaseBlocks([]);
        }
      } catch (err) {
        console.error("Failed to load project showcase blocks:", err);
        setShowcaseBlocks([]);
      }
    };

    fetchShowcaseBlocks();
  }, [project?.id]);

  const pcScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useRef<HTMLDivElement | null>(null);
  const moreDesignsRef = useRef<HTMLDivElement | null>(null);
  const nextProjectSectionRef = useRef<HTMLDivElement | null>(null);
  const nextScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [isHeaderDark, setIsHeaderDark] = useState(false);
  const lastScrollY = useRef(0);
  const scrollDeltaAccumulator = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);

  const [isDraggingNext, setIsDraggingNext] = useState(false);
  const startXNext = useRef(0);
  const scrollLeftValNext = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      setIsHeaderScrolled(currentScrollY > 40);

      // Hide or show close navbar based on accumulated scroll delta
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

      // Check if overlapping next project selector
      const nextProject = document.getElementById("next-project-section");
      if (nextProject) {
        const rect = nextProject.getBoundingClientRect();
        if (rect.top <= 80 && rect.bottom >= 0) {
          setIsHeaderDark(true);
        } else {
          setIsHeaderDark(false);
        }
      } else {
        setIsHeaderDark(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // PC drag scroll controls
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
    const x = e.pageX - pcScrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    pcScrollContainerRef.current.scrollLeft = scrollLeftVal.current - walk;
  };

  // Next Project Swiper drag controls
  const handleMouseDownNext = (e: React.MouseEvent) => {
    if (!nextScrollContainerRef.current) return;
    setIsDraggingNext(true);
    startXNext.current = e.pageX - nextScrollContainerRef.current.offsetLeft;
    scrollLeftValNext.current = nextScrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeaveNext = () => {
    setIsDraggingNext(false);
  };

  const handleMouseUpNext = () => {
    setIsDraggingNext(false);
  };

  const handleMouseMoveNext = (e: React.MouseEvent) => {
    if (!isDraggingNext || !nextScrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - nextScrollContainerRef.current.offsetLeft;
    const walk = (x - startXNext.current) * 1.5;
    nextScrollContainerRef.current.scrollLeft = scrollLeftValNext.current - walk;
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const prevPath = sessionStorage.getItem("tochay_prev_pathname");
      if (prevPath) {
        if (prevPath.startsWith("/explore/") || prevPath === "/") {
          router.push(prevPath === "/" ? "/#case-studies-section" : prevPath);
          return;
        }
      }
    }
    
    // Fallback using the project category
    const cat = project?.category?.toUpperCase() || "";
    if (cat === "BRAND DESIGN" || cat === "BRAND SYSTEM" || cat === "VISUAL SYSTEM") {
      router.push("/explore/branding");
    } else if (cat === "GRAPHIC DESIGN" || cat === "PACKAGING" || cat === "ART DIRECTION") {
      router.push("/explore/graphic-design");
    } else if (cat === "PRODUCT DESIGN" || cat === "UI/UX" || cat === "PRODUCT") {
      router.push("/explore/product-design");
    } else {
      router.push("/#case-studies-section");
    }
  };

  useLayoutEffect(() => {
    if (isLoading) return;

    const ctx = gsap.context(() => {
      // Set initial state
      gsap.set([headerRef.current, infoRef.current], { opacity: 0 });
      gsap.set(".pc-media-card, .mobile-media-card", { y: 30, opacity: 0 });

      // Animate top navigation bar
      gsap.fromTo(
        headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      // Animate dynamic text description
      gsap.fromTo(
        infoRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: "power4.out", delay: 0.15 }
      );

      // Stagger animate media cards entering
      gsap.fromTo(
        ".pc-media-card, .mobile-media-card",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.1,
          delay: 0.35,
        }
      );

      // ScrollTrigger reveal for bottom brand story details
      if (aboutRef.current) {
        gsap.fromTo(
          aboutRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: aboutRef.current,
              start: "top 88%",
            },
          }
        );
      }

      // ScrollTrigger reveal for More Designs row
      if (moreDesignsRef.current) {
        gsap.fromTo(
          moreDesignsRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: moreDesignsRef.current,
              start: "top 88%",
            },
          }
        );
      }

      // ScrollTrigger reveal for Next Project Section
      if (nextProjectSectionRef.current) {
        gsap.fromTo(
          nextProjectSectionRef.current,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: nextProjectSectionRef.current,
              start: "top 85%",
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading]);

  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#09090b] text-white flex flex-col overflow-x-hidden pt-40 pb-24 items-center animate-pulse select-none px-6">
        <div className="w-24 h-4 bg-zinc-900 rounded-md mb-4" />
        <div className="w-64 sm:w-96 h-12 sm:h-16 bg-zinc-900 rounded-md mb-8" />
        <div className="w-full max-w-5xl aspect-[16/10] bg-zinc-900 rounded-3xl mb-16" />
        <div className="w-full max-w-3xl flex flex-col gap-4 mt-8">
          <div className="w-full h-4 bg-zinc-900 rounded-md" />
          <div className="w-[90%] h-4 bg-zinc-900 rounded-md" />
          <div className="w-[85%] h-4 bg-zinc-900 rounded-md" />
        </div>
      </div>
    );
  }

  const beforeImages = showcaseBlocks.filter(
    (img) =>
      img.block_type === "before" ||
      !img.block_type ||
      img.block_type === "carousel" ||
      img.block_type === "grid_2col" ||
      img.block_type === "full_width"
  );
  const afterImages = showcaseBlocks.filter((img) => img.block_type === "after");

  const renderImageTrack = (images: any[], trackingId: string) => {
    if (images.length === 0) return null;
    return (
      <div className="w-full">
        {/* Desktop horizontal track */}
        <div className="w-full md:block hidden overflow-hidden">
          <ScrollCursorWrapper>
            <div
              ref={pcScrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onScroll={() => setHasScrolled(true)}
              className={`w-full flex flex-row items-center gap-4 md:gap-6 overflow-x-auto scrollbar-none py-6 pl-[max(48px,calc((100vw-1280px)/2+48px))] pr-[max(48px,calc((100vw-1280px)/2+48px))] ${
                isDragging ? "select-none" : ""
              }`}
            >
              {images.map((img: any, idx: number) => (
                <img
                  key={`${trackingId}-pc-${idx}`}
                  src={img.image_url}
                  alt="Showcase item"
                  className="pc-media-card shrink-0 h-[500px] w-auto object-contain rounded-2xl md:rounded-3xl border border-zinc-200/50 bg-zinc-100 select-none"
                />
              ))}
            </div>
          </ScrollCursorWrapper>
          {!hasScrolled && images.length > 1 && (
            <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex justify-end select-none animate-pulse">
              <span className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-widest mt-1">
                ← drag or scroll horizontally →
              </span>
            </div>
          )}
        </div>
        {/* Mobile stacked view */}
        <div className="w-full md:hidden flex flex-col gap-6 px-6">
          {images.map((img: any, idx: number) => (
            <img
              key={`${trackingId}-mb-${idx}`}
              src={img.image_url}
              alt="Showcase mobile item"
              className="w-full h-auto rounded-xl border border-zinc-200/50 bg-zinc-50 select-none"
            />
          ))}
        </div>
      </div>
    );
  };

  // Flatten media array to get all images for PC horizontal scroll
  const pcMediaItems = (project && Array.isArray(project.media)) 
    ? project.media.flatMap((block: any) => block.images || []) 
    : [];

  // Example designs for the bottom 2-column grid row
  const moreDesigns = ["/images/grit5.jpeg", "/images/grit6.png"];

  // Sort next project sequence starting from index after the current slug item
  const currentIdx = projectList.findIndex((p) => p.slug === baseSlug);
  const nextProjectsSequence = [
    ...projectList.slice(currentIdx + 1),
    ...projectList.slice(0, currentIdx + 1),
  ].filter((p) => p.slug !== baseSlug);

  return (
    <div
      ref={containerRef}
      id="project-detail-page"
      className="relative w-full min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col overflow-x-hidden"
    >
      {/* Sticky Custom Close Header Bar Wrapper */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out select-none ${
          isHeaderVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <header
          ref={headerRef}
          className={`w-full transition-all duration-500 ease-out px-6 sm:px-8 md:px-12 ${
            isHeaderDark
              ? isHeaderScrolled
                ? "bg-zinc-950/90 backdrop-blur-md py-4"
                : "bg-transparent py-8"
              : isHeaderScrolled
                ? "bg-[#f8f8f7]/95 backdrop-blur-md py-4"
                : "bg-transparent py-8"
          }`}
        >
          <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
            <div></div>
            <a
              href="/#case-studies-section"
              onClick={handleClose}
              className={`group flex items-center gap-2 font-sans font-semibold text-xs sm:text-sm transition-colors duration-300 cursor-pointer ${
                isHeaderDark ? "text-white hover:text-zinc-300" : "text-zinc-950 hover:text-zinc-600"
              }`}
            >
              <span>Close</span>
              <X className={`w-4.5 h-4.5 group-hover:rotate-90 transition-transform duration-300 ${
                isHeaderDark ? "text-zinc-400" : "text-zinc-500"
              }`} />
            </a>
          </div>
        </header>
      </div>

      {/* Main Info Block */}
      <div
        ref={infoRef}
        className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 pt-28 sm:pt-32 pb-10 flex flex-col md:flex-row items-start justify-between gap-6 md:gap-12 select-none"
      >
        {/* Left tagline column */}
        <div className="w-full md:w-1/4">
          <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
            Case Study
          </span>
        </div>

        {/* Right title & tagline column */}
        <div className="w-full md:w-3/4 flex flex-col gap-3">
          <h1 className="font-sans font-bold text-4xl sm:text-6xl md:text-7xl lg:text-[4.5rem] tracking-tight leading-[1.05] text-zinc-950">
            {project.title}
          </h1>
          <p className="font-sans font-normal text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl">
            {project.subtitle || project.tagline}
          </p>
        </div>
      </div>

      {/* CASE STUDY CONTENTS (BEFORE STORY GALLERY TRACK) */}
      {showcaseBlocks.length > 0 ? (
        renderImageTrack(beforeImages, "before")
      ) : (
        /* OLD SYSTEM FALLBACK FOR SEEDED AND STATIC DATA */
        renderImageTrack(
          pcMediaItems.map((media: any) => ({ image_url: media.src })),
          "legacy"
        )
      )}

      {/* Brand Story & Details Section */}
      <div
        ref={aboutRef}
        className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 py-16 md:py-24 border-t border-zinc-200/50 flex flex-col md:flex-row items-start justify-between gap-12 md:gap-20 mt-6 md:mt-12"
      >
        {/* Left Column: Metadata list in Gilroy */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 select-none">
          <div className="flex flex-col gap-1.5">
            <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
              Program
            </span>
            <span className="font-sans font-medium text-sm sm:text-base text-zinc-800 leading-tight">
              {project.program}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
              Industry
            </span>
            <span className="font-sans font-medium text-sm sm:text-base text-zinc-700 leading-tight">
              {project.industry}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
              Stage
            </span>
            <span className="font-sans font-medium text-sm sm:text-base text-zinc-700 leading-tight">
              {project.stage}
            </span>
          </div>
        </div>

        {/* Right Column: Gilroy About description and button */}
        <div className="w-full md:w-2/3 flex flex-col items-start gap-6">
          <p className="font-sans text-2xl sm:text-3xl md:text-[2.25rem] text-zinc-900 leading-relaxed font-normal">
            {project.summary_text || project.about}
          </p>

          {project.full_text && (
            <div 
              className={`transition-all duration-700 ease-in-out overflow-hidden w-full ${
                isExpanded ? "max-h-[1500px] opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}
            >
              <p className="font-sans text-base sm:text-lg text-zinc-500 leading-relaxed whitespace-pre-line">
                {project.full_text}
              </p>
            </div>
          )}

          {project.full_text && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="group inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-zinc-900 text-zinc-950 font-sans font-semibold text-xs hover:bg-zinc-900 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <span>{isExpanded ? "Hide full story" : "Read the full story"}</span>
              <span className={`inline-block transform transition-transform duration-300 ${
                isExpanded ? "-rotate-90" : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              }`}>
                {isExpanded ? "↑" : "↗"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* CASE STUDY CONTENTS (AFTER STORY GALLERY TRACK) */}
      {showcaseBlocks.length > 0 && (
        <div className="w-full pb-16 md:pb-24 select-none">
          {renderImageTrack(afterImages, "after")}
        </div>
      )}



      {/* Next Project Deck Selector Section */}
      <section
        ref={nextProjectSectionRef}
        id="next-project-section"
        className="w-full bg-[#09090b] text-white pt-24 pb-28 flex flex-col justify-center overflow-hidden border-t border-zinc-900"
      >
        {/* Section Header Row */}
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col md:flex-row items-start justify-between gap-6 md:gap-12 select-none mb-12 md:mb-16">
          <div className="w-full md:w-1/2">
            <h2 className="font-sans font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05]">
              Next Project.
            </h2>
          </div>
          <div className="w-full md:w-1/2 md:max-w-md pt-2 md:pt-4">
            <p className="font-sans font-normal text-sm sm:text-base text-zinc-400 leading-relaxed">
              Explore the next case study.
            </p>
          </div>
        </div>

        {/* Overlapping Staggered Card Swiper */}
        <div className="w-full overflow-hidden">
          <ScrollCursorWrapper>
            <div
              ref={nextScrollContainerRef}
              onMouseDown={handleMouseDownNext}
              onMouseLeave={handleMouseLeaveNext}
              onMouseUp={handleMouseUpNext}
              onMouseMove={handleMouseMoveNext}
              className={`w-full flex flex-row items-end gap-0 overflow-x-auto scrollbar-none py-12 pl-[max(48px,calc((100vw-1280px)/2+48px))] pr-[max(48px,calc((100vw-1280px)/2+48px))] ${
                isDraggingNext ? "select-none" : ""
              }`}
            >
              {nextProjectsSequence.map((proj, idx) => (
              <Link
                key={proj.slug}
                href={`/projects/${proj.slug}`}
                className="group shrink-0 flex flex-col gap-4 w-[220px] sm:w-[260px] md:w-[300px] cursor-pointer transition-all duration-500 ease-out hover:-translate-y-6 hover:z-20 hover:scale-[1.03] ml-[-50px] sm:ml-[-70px] md:ml-[-100px] first:ml-0"
              >
                {/* Card Graphic Container */}
                <div className="relative w-full aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950 shadow-2xl select-none isolate translate-z-0">
                  <Image
                    src={proj.image}
                    alt={proj.title}
                    fill
                    unoptimized={true}
                    className="object-cover object-center select-none transition-transform duration-700 ease-out group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>

                {/* Card Text Below Graphic */}
                <div className="flex flex-col gap-0.5 select-none pl-1">
                  <span className="font-sans font-medium text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest">
                    {proj.category}
                  </span>
                  <span className="font-sans font-bold text-sm sm:text-base text-white">
                    {proj.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          </ScrollCursorWrapper>
        </div>
      </section>
      <Footer />
    </div>
  );
}
