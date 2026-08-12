import Navbar from "@/components/ui/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import ExpandingImageBar from "@/components/hero/ExpandingImageBar";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#f8f8f7] text-zinc-950 flex flex-col">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Section containing dynamic word morph and scroll scrubbed typewriter */}
      <HeroSection />

      {/* Expanding scroll-scrubbed image bar slideshow */}
      <ExpandingImageBar />

      {/* Scrollable buffer section to demonstrate the typewriter scroll trigger */}
      <section className="relative min-h-screen bg-white text-zinc-950 flex items-center justify-center p-8 sm:p-12 border-t border-zinc-200 z-10">
        <div className="max-w-4xl text-center space-y-6">
          <div className="font-mono text-[10px] sm:text-xs text-amber-500 uppercase tracking-widest">
            AESTHETIC & STRATEGY
          </div>
          <h2 className="font-sans font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-tight text-zinc-900 leading-tight">
            Aligning product engineering with brand identity.
          </h2>
          <p className="font-sans font-light text-zinc-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Integrating advanced interactive design and robust database backends to clarify your positioning and convert users. High-fidelity motion ensures your identity is felt, not just seen.
          </p>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-zinc-950 text-white py-20 px-6 sm:px-8 md:px-12 border-t border-zinc-800 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="font-mono text-[10px] sm:text-xs text-amber-400 uppercase tracking-widest mb-2">
              INITIATE COLLABORATION
            </div>
            <h3 className="font-sans font-extrabold text-2xl sm:text-4xl text-white">
              Ready to elevate your digital brand?
            </h3>
          </div>

          <a
            href="mailto:hello@tystudio.design"
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-zinc-950 font-sans font-semibold text-sm hover:bg-amber-300 transition-all duration-300"
          >
            hello@tystudio.design
          </a>
        </div>
      </footer>
    </main>
  );
}
