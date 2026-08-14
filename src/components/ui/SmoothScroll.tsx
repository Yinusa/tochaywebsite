"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { usePathname } from "next/navigation";

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Lenis smooth scroll engine
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.8,
    });

    lenisRef.current = lenis;

    // Connect Lenis scroll updates to GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Use GSAP's requestAnimationFrame ticker to drive Lenis updates
    const updateGsapTicker = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateGsapTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateGsapTicker);
      lenis.destroy();
    };
  }, []);

  // Reset scroll to top on route change (or jump to hash if present)
  useEffect(() => {
    const handleScrollReset = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetEl = document.querySelector(hash) as HTMLElement | null;
        if (targetEl) {
          if (lenisRef.current) {
            lenisRef.current.scrollTo(targetEl, { immediate: true });
          } else {
            targetEl.scrollIntoView();
          }
          ScrollTrigger.refresh();
          return;
        }
      }

      // Default fallback: Reset to top
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      }
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    };

    // Run with a tiny timeout to ensure DOM hydration has completed
    const t = setTimeout(handleScrollReset, 50);
    return () => clearTimeout(t);
  }, [pathname]);

  return <div className="smooth-scroll-wrapper">{children}</div>;
}
