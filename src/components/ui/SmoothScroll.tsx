"use client";

import React, { useEffect, useRef, useCallback } from "react";
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
  const isHashScrollingRef = useRef(false);

  // Initialize Lenis smooth scroll engine
  useEffect(() => {
    const isAdmin = pathname?.startsWith("/admin");

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });

    lenisRef.current = lenis;

    if (isAdmin) {
      lenis.stop();
    }

    // Connect Lenis scroll updates to GSAP ScrollTrigger and manage active hash removal
    lenis.on("scroll", () => {
      ScrollTrigger.update();

      // Only clean the hash if the user has manually scrolled AWAY from the target section
      // and we are NOT in the middle of an automated hash-scroll transition
      if (!isHashScrollingRef.current && typeof window !== "undefined" && window.location.hash) {
        try {
          const targetEl = document.querySelector(window.location.hash) as HTMLElement | null;
          if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            // Section has scrolled out of view
            const isOutOfView = rect.bottom < -50 || rect.top > window.innerHeight + 50;
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

  // Sync route changes to start/stop Lenis appropriately
  useEffect(() => {
    const isAdmin = pathname?.startsWith("/admin");
    if (lenisRef.current) {
      if (isAdmin) {
        lenisRef.current.stop();
      } else {
        lenisRef.current.start();
      }
    }
  }, [pathname]);

  // Robust element scroller with layout re-sync
  const scrollToHashTarget = useCallback((hash: string) => {
    if (!hash || typeof window === "undefined") return false;
    try {
      const targetEl = document.querySelector(hash) as HTMLElement | null;
      if (targetEl) {
        isHashScrollingRef.current = true;
        
        // 1. Immediately position DOM before frame render to eliminate visual flashes
        targetEl.scrollIntoView({ behavior: "instant" as ScrollBehavior });

        // 2. Synchronize Lenis smooth scroll engine
        if (lenisRef.current) {
          lenisRef.current.scrollTo(targetEl, {
            immediate: true,
            offset: 0,
          });
        }

        ScrollTrigger.refresh();

        // Release the hash-scrolling lock after layout settles
        setTimeout(() => {
          isHashScrollingRef.current = false;
        }, 800);

        return true;
      }
    } catch (err) {
      console.warn("Hash scroll target search failed:", err);
    }
    return false;
  }, []);

  // Track SPA history pathnames
  useEffect(() => {
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      sessionStorage.setItem("tochay_prev_pathname", prevPathnameRef.current);
    }
  }, [pathname]);

  // Handle route and hash navigation transitions synchronously before paint
  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

  useIsomorphicLayoutEffect(() => {
    const isRouteChange = prevPathnameRef.current !== null && prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;

    const hash = typeof window !== "undefined" ? window.location.hash : "";

    if (hash) {
      isHashScrollingRef.current = true;

      // 1. Immediate synchronous attempt before browser paint
      scrollToHashTarget(hash);

      // 2. Multi-stage follow-ups as dynamic layout & GSAP triggers hydrate
      const delays = [30, 80, 180, 350, 600];
      const timers = delays.map((delay) =>
        setTimeout(() => {
          scrollToHashTarget(hash);
        }, delay)
      );

      return () => {
        timers.forEach((t) => clearTimeout(t));
      };
    } else if (isRouteChange) {
      // Navigating to a clean new route without a hash -> scroll to top immediately
      window.scrollTo(0, 0);
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true });
      }
      ScrollTrigger.refresh();
    }
  }, [pathname, scrollToHashTarget]);

  return <div className="smooth-scroll-wrapper">{children}</div>;
}

