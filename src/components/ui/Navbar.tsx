"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isDark, setIsDark] = useState(false);
  
  const [isOpen, setIsOpen] = useState(false);
  
  const lastScrollY = useRef(0);
  const scrollDeltaAccumulator = useRef(0);

  // Lock body scroll when overlay menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      // 1. Scrolled threshold for blur/padding transition
      setScrolled(currentScrollY > 40);

      // 2. Auto-hiding navbar scroll behavior (bypass if menu is open)
      if (isOpen) return;

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
        if (rect.top <= 80 && rect.bottom >= 0) {
          anyDark = true;
        }
      }

      const contactSection = document.getElementById("contact-section");
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        if (rect.top <= 80 && rect.bottom >= 0) {
          anyDark = true;
        }
      }

      const footer = document.getElementById("footer-section");
      if (footer) {
        const rect = footer.getBoundingClientRect();
        if (rect.top <= 80 && rect.bottom >= 0) {
          anyDark = true;
        }
      }

      const nextProject = document.getElementById("next-project-section");
      if (nextProject) {
        const rect = nextProject.getBoundingClientRect();
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
  }, [isOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out px-6 sm:px-8 md:px-12 ${
          visible ? "translate-y-0" : "-translate-y-full"
        } ${
          isDark || isOpen
            ? scrolled
              ? "bg-zinc-950/90 backdrop-blur-md py-4"
              : "bg-transparent py-8"
            : scrolled
              ? "bg-[#f8f8f7]/95 backdrop-blur-md py-4"
              : "bg-transparent py-8"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between relative z-50">
          {/* Brand Logo - left top */}
          <a href="#" className="flex items-center select-none" onClick={() => setIsOpen(false)}>
            <Image
              src={isDark || isOpen ? "/images/toflogowhite.png" : "/images/toflogoblack.png"}
              alt="TY Logo"
              width={38}
              height={38}
              className="w-auto h-8 sm:h-9 object-contain"
              priority
            />
          </a>

          {/* Hamburger Menu - right top */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="group flex flex-col justify-center items-end gap-1.5 w-8 h-8 focus:outline-hidden cursor-pointer relative z-50"
            aria-label="Toggle Menu"
          >
            {/* A clean double-bar hamburger (==) that transforms to X when open */}
            <span 
              className={`block h-[1.5px] transition-all duration-300 ${
                isOpen 
                  ? "w-6 rotate-45 translate-y-[4px] bg-white" 
                  : `w-6 ${isDark ? "bg-white" : "bg-zinc-950"} group-hover:w-5`
              }`} 
            />
            <span 
              className={`block h-[1.5px] transition-all duration-300 ${
                isOpen 
                  ? "w-6 -rotate-45 -translate-y-[4px] bg-white" 
                  : `w-4 ${isDark ? "bg-white" : "bg-zinc-950"} group-hover:w-6`
              }`} 
            />
          </button>
        </div>
      </header>

      {/* Sleek full-screen navigation overlay */}
      <div
        className={`fixed inset-0 bg-zinc-950/98 backdrop-blur-xl z-40 transition-all duration-500 ease-out flex flex-col justify-between pt-36 pb-12 px-6 sm:px-8 md:px-12 md:pt-44 overflow-y-auto ${
          isOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-6"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-12 gap-12 flex-grow justify-center">
          {/* Left Column: Capability Links (desktop: grid span 5) */}
          <div 
            className={`md:col-span-5 flex flex-col items-start gap-4 transition-all duration-500 delay-100 ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="font-sans font-bold text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest pl-0.5">
              Capabilities
            </span>
            <div className="flex flex-col gap-2.5">
              <a
                href="/explore/branding"
                onClick={() => setIsOpen(false)}
                className="font-sans font-semibold text-lg sm:text-xl text-zinc-400 hover:text-white transition-colors duration-300"
              >
                Branding
              </a>
              <a
                href="/explore/graphic-design"
                onClick={() => setIsOpen(false)}
                className="font-sans font-semibold text-lg sm:text-xl text-zinc-400 hover:text-white transition-colors duration-300"
              >
                Graphic Design
              </a>
              <a
                href="/explore/product-design"
                onClick={() => setIsOpen(false)}
                className="font-sans font-semibold text-lg sm:text-xl text-zinc-400 hover:text-white transition-colors duration-300"
              >
                Product Design
              </a>
            </div>
          </div>

          {/* Right Column: Main Navigation Links (desktop: grid span 7) */}
          <div className="md:col-span-7 flex flex-col items-start gap-6">
            <span 
              className={`font-sans font-bold text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest pl-0.5 transition-all duration-500 delay-200 ${
                isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Menu
            </span>
            <div className="flex flex-col gap-4 font-sans font-bold text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tighter leading-none select-none">
              <a
                href="/explore"
                onClick={() => setIsOpen(false)}
                className={`transition-all duration-500 delay-300 hover:text-[#ffd230] ${
                  isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                Explore
              </a>
              <a
                href="/about"
                onClick={() => setIsOpen(false)}
                className={`transition-all duration-500 delay-400 hover:text-[#ffd230] ${
                  isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                About
              </a>
              <a
                href="/#contact-section"
                onClick={() => setIsOpen(false)}
                className={`transition-all duration-500 delay-500 hover:text-[#ffd230] ${
                  isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Socials & Copyright */}
        <div 
          className={`w-full max-w-7xl mx-auto border-t border-zinc-900/60 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-500 delay-600 ${
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-6 sm:gap-8 select-none">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans font-bold text-xs text-zinc-400 hover:text-[#ffd230] transition-colors duration-300"
            >
              X (Twitter)
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans font-bold text-xs text-zinc-400 hover:text-[#ffd230] transition-colors duration-300"
            >
              LinkedIn
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans font-bold text-xs text-zinc-400 hover:text-[#ffd230] transition-colors duration-300"
            >
              Instagram
            </a>
          </div>
          <span className="font-sans text-[10px] text-zinc-600 select-none">
            © {new Date().getFullYear()} TY STUDIO.
          </span>
        </div>
      </div>
    </>
  );
}
