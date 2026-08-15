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
  const prevPathnameRef = useRef<string | null>(null);

  // Track SPA history pathnames
  useEffect(() => {
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      sessionStorage.setItem("tochay_prev_pathname", prevPathnameRef.current);
    }
    prevPathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // Initialize Lenis smooth scroll engine
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.8,
    });

    lenisRef.current = lenis;

    // Connect Lenis scroll updates to GSAP ScrollTrigger and manage active hash removal
    lenis.on("scroll", () => {
      ScrollTrigger.update();

      // Clear URL hash if the user scrolls away from the target section
      if (typeof window !== "undefined" && window.location.hash) {
        try {
          const targetEl = document.querySelector(window.location.hash) as HTMLElement | null;
          if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            const margin = 100;
            const isOutOfView = rect.bottom < -margin || rect.top > window.innerHeight + margin;
            if (isOutOfView) {
              window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
              );
            }
          }
        } catch (e) {
          // Prevent selector parse errors
        }
      }
    });

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

    // Run with a double-pass timeout to compensate for React layout hydration and height shifts
    const t1 = setTimeout(handleScrollReset, 50);
    const t2 = setTimeout(handleScrollReset, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  return <div className="smooth-scroll-wrapper">{children}</div>;
}
