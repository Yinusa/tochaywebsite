"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);
  const rightColRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Fade and slide left details
      gsap.fromTo(
        leftColRef.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: leftColRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Fade and slide form
      gsap.fromTo(
        rightColRef.current,
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rightColRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // Try to save directly to Supabase if connected
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        const { error } = await supabase
          .from("contact_messages")
          .insert([{ name, email, message }]);

        if (error) throw error;
      } else {
        // Fallback simulation: Log to console in local development
        console.log("Supabase in placeholder mode. Simulating contact insert:", {
          name,
          email,
          message,
        });
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate lag
      }

      setStatus("success");
    } catch (err) {
      console.error("Failed to submit contact request:", err);
      setStatus("error");
    }
  };

  return (
    <section
      ref={containerRef}
      id="contact-section"
      data-theme="dark"
      className="relative w-full bg-zinc-950 text-white py-24 md:py-36 overflow-hidden z-30 flex flex-col justify-center border-t border-zinc-900"
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col md:flex-row items-start justify-between gap-16 md:gap-24">
        {/* Left Column: Visual copy & direct email */}
        <div ref={leftColRef} className="w-full md:w-5/12 flex flex-col items-start gap-4 select-none">
          <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest">
            Contact
          </span>
          <h3 className="font-sans font-bold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.05] max-w-md">
            Let's collaborate.
          </h3>
          <p className="font-sans font-normal text-zinc-400 text-sm sm:text-base leading-relaxed max-w-sm mb-6 mt-2">
            Got an idea, a project, or want to discuss a partnership? Fill out the form or write to us directly.
          </p>
          <a
            href="mailto:tofunmiyinusa01@gmail.com"
            className="group inline-flex items-center gap-2 font-sans font-bold text-lg sm:text-xl md:text-2xl text-white hover:text-[#ffd230] transition-colors duration-300"
          >
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 group-hover:text-[#ffd230] transition-colors duration-300" />
            <span>tofunmiyinusa01@gmail.com</span>
          </a>
        </div>

        {/* Right Column: Modern Transparent Form */}
        <div ref={rightColRef} className="w-full md:w-7/12">
          {status === "success" ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-3 max-w-xl">
              <span className="font-sans font-bold text-white text-xl tracking-tight">
                Message Sent Successfully
              </span>
              <p className="font-sans font-normal text-zinc-400 text-sm sm:text-base leading-relaxed">
                Thank you, <strong className="text-white font-medium">{name}</strong>. We have received your message and will reach out to you at <strong className="text-white font-medium">{email}</strong> shortly.
              </p>
              <button
                onClick={() => {
                  setName("");
                  setEmail("");
                  setMessage("");
                  setStatus("idle");
                }}
                className="font-sans font-semibold text-xs text-[#ffd230] hover:underline self-start mt-4"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col gap-8">
              {/* Name Field */}
              <div className="flex flex-col gap-2">
                <label className="font-sans font-medium text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider pl-0.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="bg-transparent border-b border-zinc-800 focus:border-white focus:outline-hidden py-3 text-white text-base transition-colors duration-300 w-full font-sans placeholder:text-zinc-800"
                />
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="font-sans font-medium text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider pl-0.5">
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="bg-transparent border-b border-zinc-800 focus:border-white focus:outline-hidden py-3 text-white text-base transition-colors duration-300 w-full font-sans placeholder:text-zinc-800"
                />
              </div>

              {/* Message Field */}
              <div className="flex flex-col gap-2">
                <label className="font-sans font-medium text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider pl-0.5">
                  Your Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your project or inquiry..."
                  className="bg-transparent border-b border-zinc-800 focus:border-white focus:outline-hidden py-3 text-white text-base transition-colors duration-300 w-full font-sans resize-none placeholder:text-zinc-800"
                />
              </div>

              {/* Error Warning block */}
              {status === "error" && (
                <span className="font-sans font-medium text-xs text-red-500 pl-0.5">
                  Something went wrong. Please write directly to tofunmiyinusa01@gmail.com.
                </span>
              )}

              {/* Submit trigger button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-zinc-950 font-sans font-semibold text-sm hover:bg-[#ffd230] transition-all duration-300 self-start cursor-pointer disabled:opacity-50"
              >
                <span>{status === "loading" ? "Sending..." : "Send Message"}</span>
                <ArrowRight className="w-4 h-4 text-zinc-950 group-hover:translate-x-0.5 transition-transform duration-300" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
