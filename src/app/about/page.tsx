"use client";

import React, { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { gsap } from "@/lib/gsap-config";
import Footer from "@/components/ui/Footer";

export default function AboutPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const title1Ref = useRef<HTMLSpanElement | null>(null);
  const title2Ref = useRef<HTMLDivElement | null>(null);
  const profileCardRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const signatureRef = useRef<HTMLSpanElement | null>(null);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    // Check if there is history to go back to, preserving scroll depth
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/#brand-intro");
    }
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial hidden state for reveal animations
      gsap.set([headerRef.current, title1Ref.current, title2Ref.current, profileCardRef.current, contentRef.current], {
        opacity: 0,
      });

      // Set initial state for signature clipPath mask with negative offsets to prevent clipping
      gsap.set(signatureRef.current, {
        clipPath: "inset(-50% 100% -50% -20%)",
      });

      // 2. Animate header row (fading from top)
      gsap.fromTo(
        headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      // 3. Animate the main "about" and "me." text sliding up
      gsap.fromTo(
        [title1Ref.current, title2Ref.current],
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power4.out", stagger: 0.15, delay: 0.2 }
      );

      // 4. Animate the rounded square profile image scaling in
      gsap.fromTo(
        profileCardRef.current,
        { scale: 0.75, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.4 }
      );

      // 5. Animate description text grid staggered reveal
      gsap.fromTo(
        contentRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.6 }
      );

      // 6. Scroll-triggered write-out swipe animation on the signature
      gsap.to(signatureRef.current, {
        clipPath: "inset(-50% -20% -50% -20%)",
        duration: 1.6,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: signatureRef.current,
          start: "top 85%",               // Starts when signature is visible in lower viewport
          toggleActions: "play none none none", // Plays once to completion and stops
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={containerRef}
      className="relative min-h-screen bg-[#f8f8f7] text-zinc-950 overflow-x-hidden flex flex-col pb-24"
    >
      {/* Custom Top Header Bar */}
      <div
        ref={headerRef}
        className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 py-8 flex items-center justify-between z-50 select-none"
      >
        <span className="font-sans font-medium text-xs sm:text-sm tracking-tight text-zinc-400">
          @tochay
        </span>
        <a
          href="/#brand-intro"
          onClick={handleClose}
          className="group flex items-center gap-2 font-sans font-semibold text-xs sm:text-sm text-zinc-950 hover:text-zinc-600 transition-colors duration-300"
        >
          <span>Close</span>
          <X className="w-4.5 h-4.5 text-zinc-500 group-hover:rotate-90 transition-transform duration-300" />
        </a>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex-grow flex flex-col justify-center py-12 md:py-16">
        
        {/* Giant Typographic Block - Lowercase and larger sizes */}
        <h1 className="flex flex-col text-[17vw] md:text-[11vw] font-sans font-semibold tracking-tighter leading-[0.82] text-zinc-950 select-none mt-4">
          <span ref={title1Ref} className="block origin-left">
            about
          </span>
          <div ref={title2Ref} className="flex items-center gap-4 sm:gap-6 md:gap-8">
            <span>me.</span>
            
            {/* Square profile card sitting inline next to the text */}
            <div
              ref={profileCardRef}
              className="relative w-[18vw] h-[18vw] max-w-[160px] max-h-[160px] min-w-[70px] min-h-[70px] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-200 shadow-sm border border-zinc-100"
            >
              <Image
                src="/images/tofimg.jpeg"
                alt="Tofunmi profile image"
                fill
                sizes="(max-w-768px) 18vw, 160px"
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </h1>

        {/* Content Body Grid */}
        <div ref={contentRef} className="mt-16 md:mt-24">
          {/* Lowercase heading */}
          <h2 className="font-sans font-semibold text-2xl sm:text-4xl text-zinc-900 leading-tight tracking-tight mb-8 select-none">
            nice to meet you!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
            {/* Story Description (Left Side) */}
            <div className="md:col-span-7">
              <p className="font-sans font-light text-zinc-500 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed tracking-tight">
                I’m a 25-year-old brand designer and logo architect with over 6 years of professional experience shaping visual identities for scale-ups. Outside design, I maintain a strong interest in technology and the arts—a combination that influences my clean, logical, yet highly expressive design systems.
              </p>
            </div>

            {/* Script Name Signature (Right Side) using Google Font Monsieur La Doulaise */}
            <div className="md:col-span-5 flex flex-col items-start md:items-end justify-center md:pt-0">
              <span
                ref={signatureRef}
                className="font-signature text-7xl sm:text-9xl md:text-[9.5rem] leading-none text-zinc-950 select-none rotate-[-6deg] transform origin-bottom-left md:origin-bottom-right md:translate-y-[-1.5rem]"
              >
                tochay
              </span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
