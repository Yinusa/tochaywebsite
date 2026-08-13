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

---

## 5. Design System Tokens & Layout Constants

### 5.1 Color Variables
- **Off-White Canvas (Home bg)**: `#f8f8f7`
- **Dark Charcoal Canvas (Case Studies bg / Footer bg)**: `#09090b`
- **Brand Accent Yellow (CTAs / Hover states)**: `#ffd230`

### 5.2 Typography System
- **Corporate Branding Text**: Gilroy (Custom local font in `public/fonts/`). Weights: Gilroy-Medium (static text), Gilroy-SemiBold (headlines), Gilroy-Bold.
- **Editorial Text**: Ogg (Editorial serif, italic styling).
- **Signature Font**: Monsieur La Doulaise (Google Font `font-signature` for lowercase signature accents).

### 5.3 Viewport Grid & Card Sizing
- **Grid Alignment**: Max-width of `1280px` (`max-w-7xl`). Left/right padding of `24px` (`px-6`) on mobile, `32px` (`px-8`) on tablet, and `48px` (`px-12`) on desktop.
- **Dynamic Grid Offset Calc**: Left paddings on edge-to-edge carousels are calculated dynamically in CSS: `pl-[max(48px,calc((100vw-1280px)/2+48px))]` to align starting elements with standard grid lines.
- **PC Card Sizes (Case Studies)**: Staggered height columns centered vertically or aligned to base line:
  - Tall: `h-[580px] w-[400px]`
  - Medium: `h-[490px] w-[400px]`
  - Short: `h-[400px] w-[400px]`
- **Mobile Card Sizes**: Uniform `h-[340px] w-[280px]` elements.

---

## 6. Scroll & Theme Navigation Dynamics

### 6.1 Auto-Hiding Navbar
- Navbar Visibility is computed by scrolling delta accumulations:
  - **Scroll Down (Swiping Up)**: Hides the navbar (`-translate-y-full`) once scroll down delta exceeds `150px` (approximately 3 swipes).
  - **Scroll Up (Swiping Down)**: Reveals the navbar (`translate-y-0`) once scroll up delta exceeds `30px` (approximately 1 scroll).

### 6.2 Navbar Theme Transitions
- Navbar observes sections with `data-theme="dark"`:
  - If the viewport top crosses into a dark section (e.g. Case Studies or Footer), Navbar:
    - Renders the white brand logo (`toflogowhite.png`).
    - Colorizes hamburger bars to white (`bg-white`).
    - Applies `bg-zinc-950/90 backdrop-blur-md border-zinc-900` styling when scrolled.
  - If the viewport crosses into light sections, Navbar:
    - Renders the black brand logo (`toflogoblack.png`).
    - Colorizes hamburger bars to dark (`bg-zinc-950`).
    - Applies `bg-[#f8f8f7]/95 backdrop-blur-md border-zinc-100` styling when scrolled.

