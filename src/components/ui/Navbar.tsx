"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#f8f8f7]/90 backdrop-blur-xs py-4" : "bg-transparent py-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex items-center justify-between">
        {/* Brand Logo - left top */}
        <a href="#" className="flex items-center select-none">
          <Image
            src="/images/toflogoblack.png"
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
          <span className="block w-6 h-[1.5px] bg-zinc-950 transition-all duration-300 group-hover:w-5" />
          <span className="block w-4 h-[1.5px] bg-zinc-950 transition-all duration-300 group-hover:w-6" />
        </button>
      </div>
    </header>
  );
}
