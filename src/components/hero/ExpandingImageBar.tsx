"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap-config";
import { supabase } from "@/lib/supabase";

const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UxZTFlNyIvPjwvc3ZnPg==";

const LOCAL_IMAGES = [
  "/images/portfolio-templates.png",
  "/images/portfolio-templates2.png",
  "/images/portfolio-templates3.png",
  "/images/portfolio-templates4.png",
  "/images/portfolio-templates5.png",
];

export default function ExpandingImageBar() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [images, setImages] = useState<string[]>(LOCAL_IMAGES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [intervalMs, setIntervalMs] = useState(2500);

  // 1. Fetch images and switch timing from Supabase if connected
  useEffect(() => {
    async function loadShowcaseData() {
      let loadedImages = false;

      try {
        const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
        if (!isPlaceholder) {
          const { data: imgData, error: imgError } = await supabase
            .from("hero_slideshow_images")
            .select("url_path")
            .order("position", { ascending: true });

          if (!imgError && imgData && imgData.length > 0) {
            setImages(imgData.map((item) => item.url_path));
            loadedImages = true;
          }

          const { data: settingsData } = await supabase
            .from("site_settings")
            .select("slideshow_interval")
            .limit(1)
            .maybeSingle();

          if (settingsData && settingsData.slideshow_interval) {
            setIntervalMs(Number(settingsData.slideshow_interval));
          }
        }
      } catch (err) {
        console.error("Failed to load showcase data from Supabase:", err);
      }

      // Local storage fallback for local testing & offline mode
      if (!loadedImages) {
        try {
          const localData = localStorage.getItem("tochay_offline_showcase_images");
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setImages(parsed.map((item: any) => item.url_path));
            }
          }
        } catch (localErr) {
          console.error("Failed to read showcase from local storage cache:", localErr);
        }
      }
    }

    loadShowcaseData();
  }, []);

  // 2. Looping slideshow cycle
  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [images.length, intervalMs]);

  // 3. GSAP scroll-driven expanding and parallax animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!containerRef.current) return;

      // Expand the container to align with header grid limits and keep a subtle rounded border
      gsap.to(containerRef.current, {
        width: "100%",
        maxWidth: "1280px",      // Caps expansion to max-w-7xl to match header grid limits
        height: "600px",
        borderRadius: "12px",     // Keeps a subtle rounded corner at final expansion
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",     // Starts expanding when the top of the bar enters viewport bottom
          end: "top 12%",          // Completes expansion when bar top is 12% from viewport top
          scrub: 0.5,              // Syncs progress with scroll scrub
        },
      });

      // Subtle vertical parallax movement + scaling on the images inside
      gsap.fromTo(
        ".parallax-img",
        { yPercent: -12, scale: 1.12 },
        {
          yPercent: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="w-full bg-[#f8f8f7] pt-12 pb-24 px-6 sm:px-8 md:px-12 overflow-hidden flex justify-center">
      {/* Expanding outer bar - starts as rounded centered block */}
      <div
        ref={containerRef}
        className="relative w-[90%] md:w-[80%] max-w-5xl h-[200px] sm:h-[260px] rounded-2xl overflow-hidden shadow-xs transition-shadow duration-300"
      >
        {images.map((src, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={src}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {/* Parallax Image element */}
              <div className="relative w-full h-[120%] -top-[10%] parallax-img">
                <Image
                  src={src}
                  alt={`Showcase item ${index + 1}`}
                  fill
                  unoptimized={true}
                  className="object-cover object-center select-none"
                  priority={index === 0}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            </div>
          );
        })}

        {/* Overlay overlay shadow for depth */}
        <div className="absolute inset-0 bg-black/5 z-20 pointer-events-none" />
      </div>
    </div>
  );
}
