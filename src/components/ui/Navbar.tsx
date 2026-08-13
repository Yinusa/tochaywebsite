"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isDark, setIsDark] = useState(false);
  
  const lastScrollY = useRef(0);
  const scrollDeltaAccumulator = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      // 1. Scrolled threshold for blur/padding transition
      setScrolled(currentScrollY > 40);

      // 2. Auto-hiding navbar scroll behavior
      if (currentScrollY < 10) {
        setVisible(true);
        scrollDeltaAccumulator.current = 0;
      } else {
        if (delta > 0) {
          // Scrolling down (swiping up) - accumulate delta
          if (scrollDeltaAccumulator.current < 0) {
            scrollDeltaAccumulator.current = 0;
          }
          scrollDeltaAccumulator.current += delta;
          // Hide when scrolling down significantly (e.g. 150px = approx 3 scrolls)
          if (scrollDeltaAccumulator.current > 150) {
            setVisible(false);
          }
        } else if (delta < 0) {
          // Scrolling up (swiping down) - accumulate negative delta
          if (scrollDeltaAccumulator.current > 0) {
            scrollDeltaAccumulator.current = 0;
          }
          scrollDeltaAccumulator.current += delta;
          // Reveal when scrolling up slightly (e.g. 30px = 1 scroll)
          if (scrollDeltaAccumulator.current < -30) {
            setVisible(true);
          }
        }
      }

      // 3. Detect if currently intersecting dark sections using unique DOM IDs
      let anyDark = false;

      const caseStudies = document.getElementById("case-studies-section");
      if (caseStudies) {
        const rect = caseStudies.getBoundingClientRect();
        // If the top of the Case Studies section has crossed the 80px header threshold
        if (rect.top <= 80 && rect.bottom >= 0) {
          anyDark = true;
        }
      }

      const contactSection = document.getElementById("contact-section");
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        // If the top of the contact section has crossed the 80px header threshold
        if (rect.top <= 80 && rect.bottom >= 0) {
          anyDark = true;
        }
      }

      const footer = document.getElementById("footer-section");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        // If the top of the footer has crossed the 80px header threshold
        if (rect.top <= 80 && rect.bottom >= 0) {
          anyDark = true;
        }
      }

      const nextProject = document.getElementById("next-project-section");
      if (nextProject) {
        const rect = nextProject.getBoundingClientRect();
        // If the top of the Next Project section has crossed the 80px header threshold
        if (rect.top <= 80 && rect.bottom >= 0) {
          anyDark = true;
        }
      }

      setIsDark(anyDark);

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Execute a slight delayed check after mounting to ensure body elements hydrate
    const mountTimer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(mountTimer);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out px-6 sm:px-8 md:px-12 ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${
        isDark
          ? scrolled
            ? "bg-zinc-950/90 backdrop-blur-md py-4"
            : "bg-transparent py-8"
          : scrolled
            ? "bg-[#f8f8f7]/95 backdrop-blur-md py-4"
            : "bg-transparent py-8"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo - left top */}
        <a href="#" className="flex items-center select-none">
          <Image
            src={isDark ? "/images/toflogowhite.png" : "/images/toflogoblack.png"}
            alt="TY Logo"
            width={38}
            height={38}
            className="w-auto h-8 sm:h-9 object-contain"
            priority
          />
        </a>

        {/* Hamburger Menu - right top */}
        <button
          className="group flex flex-col justify-center items-end gap-1.5 w-8 h-8 focus:outline-hidden cursor-pointer"
          aria-label="Toggle Menu"
        >
          {/* A clean double-bar hamburger (==) matching Collins */}
          <span className={`block w-6 h-[1.5px] transition-all duration-300 group-hover:w-5 ${isDark ? "bg-white" : "bg-zinc-950"}`} />
          <span className={`block w-4 h-[1.5px] transition-all duration-300 group-hover:w-6 ${isDark ? "bg-white" : "bg-zinc-950"}`} />
        </button>
      </div>
    </header>
  );
}
