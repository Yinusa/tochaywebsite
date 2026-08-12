# Technical & App Architecture
**Project**: Ultra-High-End Portfolio Web Application  
**Workspace**: `tochayportfolio`
**Design Style**: Clean, high-end editorial minimal design canvas

---

## 1. Executive Summary & Vision
This architecture guides the construction of an award-level creative technologist / agency portfolio web application. The visual system balances minimalist layouts (`#f8f8f7` canvas, high contrast typographic scaling) with complex motion effects orchestrated using GSAP and smooth scrolling using Lenis.

---

## 2. Technology Stack & Core Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | React Server Components (RSC), optimized layouts, rendering, and routing |
| **Language** | TypeScript (Strict) | Type safety, interface contracts, and components static typing |
| **Styling** | Tailwind CSS v4 | CSS-first configuration, theme extending, and custom properties mapping |
| **Motion Engine** | GSAP 3 (ScrollTrigger + TextPlugin) | Timeline transitions, scroll scrubbing, and responsive text typing |
| **Scroll Engine** | Lenis (`lenis`) | Kinetic smooth inertia scrolling synced directly with GSAP's rendering tick |
| **Icons** | Lucide React | Clean, scalable SVG icons |
| **Database** | Supabase (PostgreSQL) | Backend data model, projects tables, live analytics, and inquiries (Future integration) |

---

## 3. Directory Layout & Module Structure

```
tochayportfolio/
├── docs/                      # Architectural and design system specifications
│   ├── ARCHITECTURE.md
│   ├── DESIGN_SYSTEM.md
│   ├── COMPONENTS.md
│   └── BACKEND.md
├── public/                    # Static assets
│   ├── fonts/
│   │   └── gilroy/            # Gilroy typography (.woff2, .woff)
│   └── images/                # Brand logos & media assets
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css        # Tailwind directives, local font-face definitions, scroll resets
│   │   ├── layout.tsx         # Google Fonts variables, SEO metadata, SmoothScroll wrapper
│   │   └── page.tsx           # Assembled home page rendering Navbar & HeroSection
│   ├── components/
│   │   ├── hero/
│   │   │   ├── HeroSection.tsx       # Hero layouts, entrance animations
│   │   │   ├── DynamicWord.tsx       # GSAP looping word morph rotator (3s interval)
│   │   │   └── TypewriterSubtext.tsx  # ScrollTrigger-driven character scrub typewriter
│   │   └── ui/
│   │       ├── Navbar.tsx            # Global header (responsive links, UTC time, let's build CTA)
│   │       └── SmoothScroll.tsx      # Lenis setup with GSAP requestAnimationFrame ticker
│   └── lib/
│       └── gsap-config.ts            # Client-side GSAP SSR registration file
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 4. Key Motion Implementations

### 4.1 Smooth Scrolling (Lenis + GSAP Sync)
To avoid jitter and visual lagging when scrubbing animations on scroll:
- Lenis runs and listens to scroll events, communicating updates directly to GSAP's `ScrollTrigger.update`.
- We add Lenis's raf update loop directly into the GSAP ticker: `gsap.ticker.add((time) => lenis.raf(time * 1000))`.
- This ensures animations triggered by ScrollTrigger render on the exact same frame update cycle as the scroll movement.

### 4.2 Dynamic Word Swapping (3.0s Auto-rotation)
- Set up using a looping state index corresponding to 4 custom typographic configurations.
- A GSAP client timeline animates the outgoing word up, blurring and fading it out (`y: -28, opacity: 0, filter: blur(6px)`).
- On transition completion, state index increments, changing the rendered word and styling class.
- The new word is animated from the bottom up (`y: 28` to `0`, `opacity: 0 -> 1`, `filter: blur(0px)`).

### 4.3 Real-time Typewriter Scrubbing
- Target text spans are bound to GSAP `TextPlugin`.
- The animation is triggered by `ScrollTrigger` bound to the Hero section container.
- Scrubbing is set to `0.5` seconds. Downscroll increments the typing animation forward character-by-character; upscroll reverses the timeline, creating a backspace/deletion effect.
