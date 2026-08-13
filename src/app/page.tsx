import Navbar from "@/components/ui/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import ExpandingImageBar from "@/components/hero/ExpandingImageBar";
import BrandIntro from "@/components/showcase/BrandIntro";
import CaseStudies from "@/components/showcase/CaseStudies";
import Capabilities from "@/components/showcase/Capabilities";
import FaqSection from "@/components/showcase/FaqSection";
import ContactSection from "@/components/showcase/ContactSection";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#f8f8f7] text-zinc-950 flex flex-col">
      {/* Navigation Header */}
      <Navbar />

      {/* Hero Section containing word morph and scroll typewriter */}
      <HeroSection />

      {/* Expanding scroll-scrubbed image bar slideshow */}
      <ExpandingImageBar />

      {/* Brand Introduction Section (collins layout) */}
      <BrandIntro />

      {/* Case Studies horizontal scroll showcase */}
      <CaseStudies />

      {/* Capabilities selection menu (Brand, Graphic, Product Design) */}
      <Capabilities />

      {/* FAQ Accordion Section */}
      <FaqSection />

      {/* Contact Form Section */}
      <ContactSection />

      {/* Typographic Footer Section */}
      <Footer />
    </main>
  );
}
