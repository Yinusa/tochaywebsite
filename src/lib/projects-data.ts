export interface MediaItem {
  src: string;
  aspect: string; // Tailwinds aspect classes for PC grid proportional sizing (e.g. aspect-[16/10])
}

export interface MediaBlock {
  type: "single" | "double";
  images: MediaItem[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  image: string;
  program: string;
  industry: string;
  stage: string;
  about: string;
  media: MediaBlock[];
}

export const PROJECTS: Project[] = [
  {
    id: "1",
    slug: "bose-sound",
    title: "BOSE Sound",
    category: "BRAND DESIGN",
    tagline: "Acoustic engineering met by pure minimalist brand expression.",
    image: "/images/grit1.jpg",
    program: "Creative Direction, Design System",
    industry: "Consumer Tech, Acoustics",
    stage: "Established",
    about: "Founded to challenge how we perceive auditory clarity, BOSE represents a legacy of acoustic precision. This re-expression aligns their visual systems with the raw, structural purity of the sound waves they engineer.",
    media: [
      {
        type: "single",
        images: [{ src: "/images/grit1.jpg", aspect: "aspect-[16/10]" }],
      },
      {
        type: "double",
        images: [
          { src: "/images/grit2.jpeg", aspect: "aspect-square" },
          { src: "/images/grit3.jpg", aspect: "aspect-square" },
        ],
      },
      {
        type: "single",
        images: [{ src: "/images/grit4.png", aspect: "aspect-[4/3]" }],
      },
    ],
  },
  {
    id: "2",
    slug: "miller-lite",
    title: "Miller Lite",
    category: "PACKAGING",
    tagline: "Stripping back a classic american legacy to its typographic core.",
    image: "/images/grit2.jpeg",
    program: "Identity Rebrand, Packaging Systems",
    industry: "FMCG, Beverage",
    stage: "Global Scale-Up",
    about: "Launched in response to the growing desire for brand transparency, this package system strips away all commercial noise. The typography stands bold on pure aluminum canvas, highlighting the heritage brewing ingredients.",
    media: [
      {
        type: "single",
        images: [{ src: "/images/grit2.jpeg", aspect: "aspect-[4/3]" }],
      },
      {
        type: "double",
        images: [
          { src: "/images/grit4.png", aspect: "aspect-square" },
          { src: "/images/grit5.jpeg", aspect: "aspect-square" },
        ],
      },
      {
        type: "single",
        images: [{ src: "/images/grit6.png", aspect: "aspect-[16/10]" }],
      },
    ],
  },
  {
    id: "3",
    slug: "city-of-future",
    title: "City of Future",
    category: "MOTION",
    tagline: "Architectural layouts and dynamic grids mapping urban evolution.",
    image: "/images/grit3.jpg",
    program: "Motion System, Visual Guidelines",
    industry: "Real Estate, Urban Planning",
    stage: "Conceptual Phase",
    about: "City of Future maps architectural layouts to dynamic screens, projecting speculative cityscapes. The motion language translates geometric building shapes into kinetic typographic grids.",
    media: [
      {
        type: "single",
        images: [{ src: "/images/grit3.jpg", aspect: "aspect-[16/9]" }],
      },
      {
        type: "double",
        images: [
          { src: "/images/grit1.jpg", aspect: "aspect-square" },
          { src: "/images/grit2.jpeg", aspect: "aspect-square" },
        ],
      },
      {
        type: "single",
        images: [{ src: "/images/grit7.jpeg", aspect: "aspect-[4/3]" }],
      },
    ],
  },
  {
    id: "4",
    slug: "everyday-packages",
    title: "Everyday Packages",
    category: "IDENTITY",
    tagline: "Systematizing domestic shipping with clean utility design grids.",
    image: "/images/grit4.png",
    program: "Identity System, Utility Guidelines",
    industry: "Logistics, Supply Chain",
    stage: "National Rollout",
    about: "Everyday Packages introduced commission-free global domestic shipping in response to the ecommerce boom. This branding replaces industrial package labels with clean, typographic grids.",
    media: [
      {
        type: "single",
        images: [{ src: "/images/grit4.png", aspect: "aspect-[4/3]" }],
      },
      {
        type: "double",
        images: [
          { src: "/images/grit3.jpg", aspect: "aspect-square" },
          { src: "/images/grit6.png", aspect: "aspect-square" },
        ],
      },
      {
        type: "single",
        images: [{ src: "/images/grit8.jpeg", aspect: "aspect-[16/10]" }],
      },
    ],
  },
  {
    id: "5",
    slug: "arcane-universe",
    title: "Arcane Universe",
    category: "ART DIRECTION",
    tagline: "Fusing dark fantasy artwork with striking structural lettering.",
    image: "/images/grit5.jpeg",
    program: "Creative Direction, Lettering Art",
    industry: "Entertainment, Streaming",
    stage: "Active Campaign",
    about: "Commissioned for the global launch campaign of Arcane Season One. The design explores high contrast dark environments offset by hand-drawn typographic elements.",
    media: [
      {
        type: "single",
        images: [{ src: "/images/grit5.jpeg", aspect: "aspect-[16/10]" }],
      },
      {
        type: "double",
        images: [
          { src: "/images/grit7.jpeg", aspect: "aspect-square" },
          { src: "/images/grit8.jpeg", aspect: "aspect-square" },
        ],
      },
      {
        type: "single",
        images: [{ src: "/images/grit1.jpg", aspect: "aspect-[4/3]" }],
      },
    ],
  },
  {
    id: "6",
    slug: "digital-archetype",
    title: "Digital Archetype",
    category: "VISUAL SYSTEM",
    tagline: "Generative canvas design structures built on dynamic code systems.",
    image: "/images/grit6.png",
    program: "Generative Systems, Typography Design",
    industry: "Web3, Digital Art",
    stage: "Incubation",
    about: "A visual sandbox modeling canvas behaviors, Digital Archetype translates abstract mathematical logic into physical, high contrast layouts.",
    media: [
      {
        type: "single",
        images: [{ src: "/images/grit6.png", aspect: "aspect-[4/3]" }],
      },
      {
        type: "double",
        images: [
          { src: "/images/grit4.png", aspect: "aspect-square" },
          { src: "/images/grit1.jpg", aspect: "aspect-square" },
        ],
      },
      {
        type: "single",
        images: [{ src: "/images/grit2.jpeg", aspect: "aspect-[16/10]" }],
      },
    ],
  },
  {
    id: "7",
    slug: "logitech-identity",
    title: "Logitech Identity",
    category: "BRAND SYSTEM",
    tagline: "Engineering human peripheral design systems for tech workspaces.",
    image: "/images/grit7.jpeg",
    program: "Brand Guidelines, Spatial Identity",
    industry: "Technology, Peripherals",
    stage: "Global Release",
    about: "A dynamic and spatial brand structure built to unify Logitech's workspace division. Elements translate input gestures into digital color strokes.",
    media: [
      {
        type: "single",
        images: [{ src: "/images/grit7.jpeg", aspect: "aspect-[16/10]" }],
      },
      {
        type: "double",
        images: [
          { src: "/images/grit5.jpeg", aspect: "aspect-square" },
          { src: "/images/grit3.jpg", aspect: "aspect-square" },
        ],
      },
      {
        type: "single",
        images: [{ src: "/images/grit6.png", aspect: "aspect-[4/3]" }],
      },
    ],
  },
  {
    id: "8",
    slug: "hyperion-graphic",
    title: "Hyperion Graphic",
    category: "GRAPHIC DESIGN",
    tagline: "Bold brutalist graphic design canvas exploring physical scale.",
    image: "/images/grit8.jpeg",
    program: "Graphic System, Brutalist Print",
    industry: "Fashion, Publishing",
    stage: "Archived Series",
    about: "An editorial publishing print series focusing on absolute graphic scale. Bold, uppercase letterforms clash directly with monochrome layout crops.",
    media: [
      {
        type: "single",
        images: [{ src: "/images/grit8.jpeg", aspect: "aspect-[4/3]" }],
      },
      {
        type: "double",
        images: [
          { src: "/images/grit1.jpg", aspect: "aspect-square" },
          { src: "/images/grit7.jpeg", aspect: "aspect-square" },
        ],
      },
      {
        type: "single",
        images: [{ src: "/images/grit2.jpeg", aspect: "aspect-[16/10]" }],
      },
    ],
  },
];

// Subsets of projects grouped by capability
export const GRAPHIC_DESIGN_PROJECTS: Project[] = [
  PROJECTS[7], // Hyperion Graphic (GRAPHIC DESIGN)
  PROJECTS[1], // Miller Lite (PACKAGING)
  PROJECTS[4], // Arcane Universe (ART DIRECTION)
  PROJECTS[3], // Everyday Packages (IDENTITY)
];

export const PRODUCT_DESIGN_PROJECTS: Project[] = [
  PROJECTS[0], // BOSE Sound (BRAND DESIGN/TECH)
  PROJECTS[5], // Digital Archetype (VISUAL SYSTEM/WEB)
  PROJECTS[2], // City of Future (MOTION/ARCHITECTURE)
  PROJECTS[6], // Logitech Identity (BRAND SYSTEM/TECH)
];

export const BRANDING_DESIGN_PROJECTS: Project[] = [
  PROJECTS[0], // BOSE Sound
  PROJECTS[6], // Logitech Identity
  PROJECTS[3], // Everyday Packages
  PROJECTS[5], // Digital Archetype
];
