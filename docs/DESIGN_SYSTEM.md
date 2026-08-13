# Design System Specification
**Project**: Ultra-High-End Portfolio Web Application  
**Workspace**: `tochayportfolio`
**Default Canvas**: Clean Off-White (`#f8f8f7`)

---

## 1. Typographic Engine

We utilize a hybrid typography setup that prioritizes high-fidelity fallback font mappings. This guarantees the layout remains polished while custom assets are loading.

### 1.1 Custom Font Weights (Gilroy)
Gilroy is the signature font of the brand system, utilized for the main anchor texts, structural navigation, and subtext elements:
- **Gilroy ExtraBold** (Weight 800): Used for prominent headlines and structural page titles.
- **Gilroy Light** (Weight 300): Used for reading copy, subtexts, and explanatory layouts.

### 1.2 Multi-Style Typography Map
To create a premium editorial feel, we use 5 typographic styles configured through Tailwind classes:

| Class | Font Style / Variant | Target Aesthetic | Google Font Fallback |
| :--- | :--- | :--- | :--- |
| `font-sans` | Gilroy (Light / ExtraBold) | Modern geometric sans | Plus Jakarta Sans / Outfit |
| `font-editorial` | Ogg / Editorial Serif (Italic) | High-end luxury serif | Playfair Display / Newsreader |
| `font-script` | Signature script (Fluid) | Hand-crafted custom script | Caveat / Alex Brush |
| `font-heavy-serif` | Heavy Display Serif (Black) | Editorial uppercase serif | Syne / Bodoni Moda |
| `font-mono` | Space Mono (Medium) | Technical precision mono | Space Mono |

---

## 2. Color System
Our color system is highly restricted to emphasize content, typography, and motion details.

- **Canvas Background**: `#f8f8f7` (Soft, minimal editorial warm-white)
- **Primary Text**: `#09090b` (Deep rich carbon-black for readability)
- **Secondary Text / Muted**: `#71717a` (Medium gray for hierarchy)
- **Border / Outline Lines**: `#e4e4e7` (Light divider tint)
- **Aesthetic Highlight Color**: `#d97706` (Amber gold accents)

---

## 3. Responsive Typography & Layout Breakpoints

To ensure the portfolio looks stunning across devices, we use fluid typographic scaling:

### 3.1 Headline Typography Scale
- **Mobile** (`<640px`): `text-4xl` (36px / leading-[1.08])
- **Tablet** (`>=640px`): `text-6xl` (60px / leading-[1.04])
- **Medium Desktop** (`>=768px`): `text-7xl` (72px)
- **Large Desktop** (`>=1024px`): `text-8xl` (96px)

### 3.2 Spacing & Responsive Grid Layouts
- **Containers**: Max-width of `max-w-7xl` (1280px) centered.
- **Outer Paddings**:
  - Mobile: `px-6` (24px)
  - Tablet: `px-8` (32px)
  - Desktop: `px-12` (48px)
- **Vertical Spacers**:
  - Hero margins: `pt-32 pb-20` (128px / 80px)
  - Layout gaps: `gap-6` on mobile to `gap-12` on desktop structures.
- **Visual Stability**: The dynamic word element has a min-width declaration (`min-w-[220px]` on mobile, scaling up to `min-w-[450px]` on desktop) to prevent horizontal layout shift or shifting adjacent text during word swap cycles.

---

## 4. Mobile Responsiveness & Touch Accessibility Guidelines

To maintain visual excellence, fluid motion, and zero layout shift on mobile screens (viewports `< 768px`), follow these mobile-first guidelines:

### 4.1 Navigation Sidebar-to-Tab Refactoring
- **Layout Conversion**: Sidebars and main panel listings (such as the admin workspace panel) must adapt to the viewport:
  - **Desktop (`>=768px`)**: Stack vertically in left-aligned columns (`flex-col w-64`).
  - **Mobile (`<768px`)**: Refactor into horizontal scrolling layouts (`flex-row overflow-x-auto scrollbar-none pb-4`) to save vertical viewport space.
- **Visual Polish**: Always apply the `.scrollbar-none` utility class to hide desktop-style scrollbars on swipable touch rails while retaining native swipe gestures.

### 4.2 Spacing, Grids, and Inputs
- **Column Scaling**: Grids must utilize responsive breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) to prevent structural squash and text truncation on small screen ratios.
- **Touch Target Dimensions**: Interactive hit targets (buttons, input fields, checkboxes, and links) must maintain a minimum target height/width of `44px` (WCAG 2.1 touch accessibility requirements) to prevent neighboring clicks.
- **Padding Scalers**: Space paddings decrease on small viewports (e.g. `p-6` to `p-4`) to maximize visible copy area, while vertical spacers scale down (`py-20` on desktop down to `py-10` on mobile) for tighter visual grouping.

### 4.3 Image Responsiveness
- **Aspect Ratio Boxes**: Use standard container aspect ratios (`aspect-video`, `aspect-[16/10]`) with `object-cover` styling to crop and scale images nicely on variable widths.
- **Horizontal Leak Interceptors**: Avoid hardcoded widths (`w-[600px]`). Instead, use relative layout widths (`w-full`, `max-w-md`) and safe containers with `overflow-x-hidden` wrappers to eliminate horizontal page scrolling on mobile browsers.

