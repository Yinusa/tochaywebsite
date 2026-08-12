"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap-config";
import { supabase } from "@/lib/supabase";

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

  // 1. Fetch images from Supabase showcase if connected
  useEffect(() => {
    async function loadShowcaseImages() {
      try {
        // Only run fetch if we have valid environment keys (not placeholder)
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
        ) {
          const { data, error } = await supabase
            .from("showcase_images")
            .select("url_path")
            .order("position", { ascending: true });

          if (!error && data && data.length > 0) {
            setImages(data.map((item) => item.url_path));
          }
        }
      } catch (err) {
        console.error("Failed to load images from Supabase:", err);
      }
    }

    loadShowcaseImages();
  }, []);

  // 2. Looping slideshow cycle every 2.5 seconds (cycles even after scrolling stops)
  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [images.length]);

  // 3. GSAP scroll-driven expanding and parallax animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!containerRef.current) return;

      // Expand the container: width (90% -> 100%), height (200px -> 600px), border-radius (24px -> 0px)
      gsap.to(containerRef.current, {
        width: "100%",
        maxWidth: "100%",
        height: "600px",
        borderRadius: "0px",
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
    <div className="w-full bg-[#f8f8f7] pt-12 pb-24 overflow-hidden flex justify-center">
      {/* Expanding outer bar - starts as rounded centered block */}
      <div
        ref={containerRef}
        className="relative w-[90%] md:w-[85%] max-w-6xl h-[200px] sm:h-[260px] rounded-2xl overflow-hidden shadow-xs transition-shadow duration-300"
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
                  sizes="100vw"
                  className="object-cover object-center select-none"
                  priority={index === 0}
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
