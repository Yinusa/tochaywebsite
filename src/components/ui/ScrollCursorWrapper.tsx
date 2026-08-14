"use client";

import React, { useState, useRef } from "react";

interface ScrollCursorWrapperProps {
  children: React.ReactNode;
}

export default function ScrollCursorWrapper({ children }: ScrollCursorWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [showCursor, setShowCursor] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cursorRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cursorRef.current.style.setProperty("--x", `${x}px`);
      cursorRef.current.style.setProperty("--y", `${y}px`);
    }
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      setShowCursor(true);
    }
  };

  const handleMouseLeave = () => {
    setShowCursor(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full overflow-hidden ${showCursor ? "lg:[&_*]:cursor-none" : ""}`}
    >
      <div>
        {children}
      </div>

      {/* Custom Mouse Follower Cursor pill: [ < Scroll > ] */}
      <div
        ref={cursorRef}
        className={`hidden lg:flex pointer-events-none absolute z-50 bg-white text-zinc-950 px-3 py-1 rounded-full items-center gap-1 shadow-2xl border border-zinc-200/50 font-sans font-semibold text-[11px] select-none transition-opacity duration-300 ease-out ${
          showCursor ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{
          left: 0,
          top: 0,
          transform: "translate3d(var(--x, -100px), var(--y, -100px), 0) translate(-50%, -50%)"
        }}
      >
        {/* Left Arrow */}
        <svg 
          className="w-2.5 h-2.5 text-zinc-950 shrink-0" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>

        <span>Scroll</span>

        {/* Right Arrow */}
        <svg 
          className="w-2.5 h-2.5 text-zinc-950 shrink-0" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}
