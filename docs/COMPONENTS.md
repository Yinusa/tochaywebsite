# Component Catalog & Reusable Guidelines
**Project**: Ultra-High-End Portfolio Web Application  
**Workspace**: `tochayportfolio`

---

## 1. Reusable Component Catalog

### 1.1 SmoothScroll Wrapper (`SmoothScroll.tsx`)
- **Location**: `src/components/ui/SmoothScroll.tsx`
- **Purpose**: Initializes Lenis smooth scrolling engine and integrates requestAnimationFrame ticks with the GSAP main render loop.
- **Usage**:
  ```tsx
  import SmoothScroll from "@/components/ui/SmoothScroll";
  
  export default function RootLayout({ children }) {
    return (
      <html lang="en">
        <body>
          <SmoothScroll>{children}</SmoothScroll>
        </body>
      </html>
    );
  }
  ```

### 1.2 Interactive Navbar (`Navbar.tsx`)
- **Location**: `src/components/ui/Navbar.tsx`
- **Purpose**: Brand header with dynamic active UTC clock, status indicators, and contact CTA button.
- **Interactions**:
  - Sticky transparency fade-in and shadow adjustment on scroll (`window.scrollY > 40`).
  - Active UTC clock ticks every second.
  - Hover states on links trigger bottom line animations.

### 1.3 Hero Section Layout (`HeroSection.tsx`)
- **Location**: `src/components/hero/HeroSection.tsx`
- **Purpose**: Coordinates dynamic typography items, typewriter overlays, and structural statistics grids.
- **Interactions**:
  - Entrance timeline fade-up animations on load (`badge` -> `headline` -> `metrics`).

### 1.4 Dynamic Typographic Rotator (`DynamicWord.tsx`)
- **Location**: `src/components/hero/DynamicWord.tsx`
- **Purpose**: Rotates between 4 different words and typographic styles every 3 seconds.
- **Aesthetic classes applied**:
  - *intention.*: `font-editorial italic`
  - *creativity.*: `font-script text-amber-800 scale-[1.22]`
  - *conviction.*: `font-heavy-serif uppercase text-[0.9em]`
  - *clarity.*: `font-mono text-emerald-950`

### 1.5 Scroll-scrubbed Typewriter (`TypewriterSubtext.tsx`)
- **Location**: `src/components/hero/TypewriterSubtext.tsx`
- **Purpose**: Types characters on scroll down, backspaces characters on scroll up.
- **Props**:
  - `sentence`: custom typewriter text (defaults to the core brand tagline).
  - `triggerRef`: HTML reference element used to track scroll height triggers.

---

## 2. Coding Principles & Guidelines

1. **Hydration Warning Safety**:
   - For client-only components that render server-incompatible properties (like the local clock time), initialize state inside a `useEffect` hook to prevent server-client HTML mismatch errors.
2. **GSAP Cleanups**:
   - Always run GSAP context cleanup functions on component unmount:
     ```typescript
     useLayoutEffect(() => {
       const ctx = gsap.context(() => { /* anims */ }, containerRef);
       return () => ctx.revert();
     }, []);
     ```
3. **No Layout Shifting**:
   - Always declare responsive base heights (`min-h-[]`) or base widths (`min-w-[]`) for dynamically loaded text blocks so the surrounding DOM layout does not jitter when text morphs or loads.

---

## 3. Custom Forms Module Components

### 3.1 Custom Form Builder Component (`FormBuilderTab.tsx`)
- **Location**: `src/components/admin/FormBuilderTab.tsx`
- **Purpose**: Admin-side workspace form builder interface.
- **Interactions**:
  - Full-width drag-and-drop handles for layout reordering using native HTML5 drag APIs.
  - Interactive setting controls for allowed types, size limits, and required flags.
  - Real-time link generator with clipboard integration.

### 3.2 Dynamic Form Intake Portal (`page.tsx`)
- **Location**: `src/app/form/[id]/page.tsx`
- **Purpose**: High-end public client submission portal matching the studio's off-white canvas layout.
- **Interactions**:
  - Drag-and-drop files drop-zone with size & type validation (treating `.jpg` and `.jpeg` interchangeably).
  - Multi-file progressive loader state indicators.
  - Secure integration with the `showcase` storage bucket under the `form-uploads/` directory.

### 3.3 Submissions Responses Inspector (`page.tsx`)
- **Location**: `src/app/admin/forms/[id]/responses/page.tsx`
- **Purpose**: Dashboard responses list and details sliding drawer.
- **Interactions**:
  - Display answers grouped directly under their corresponding question.
  - Client-side folder zipping engine (`JSZip`) for zipping and downloading all assets in batch.
  - Direct local same-origin browser downloading fallback handlers.
  - Storage deletion cleanup triggers upon submission deletion.

