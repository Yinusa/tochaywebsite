"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { Plus, Minus, Trash2, Tag, FileText, Check, ArrowRight, X, Search, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// 1. Static fallback datasets for robust offline/dev builds
const STATIC_SERVICES = [
  { id: "s-logo", name: "Logo Design", description: "3 Initial Concepts, 2 Revision Rounds, Final Files (AI, EPS, PNG, JPG)", price: 35000 },
  { id: "s-pack", name: "Packaging Design", description: "Product packaging mockup and print-ready files", price: 25000 },
  { id: "s-social", name: "Social Media Designs", description: "3 editable Canva/PSD template designs for platforms of choice (IG, WhatsApp, LinkedIn, etc.)", price: 24000 },
  { id: "s-guide", name: "Brand Guidelines", description: "5–8 Page Guide (Logo Usage, Colors, Typography Overview)", price: 20000 },
  { id: "s-flyer", name: "Flyer Design", description: "PNG, JPG, Print-Ready PDF", price: 20000 },
  { id: "s-signage", name: "Signage Design", description: "Indoor/Outdoor signage layout with dimensions", price: 15000 },
  { id: "s-card", name: "Business Card Design", description: "1 Concept Design (Front & Back), Print-Ready PDF + Source File", price: 10000 },
  { id: "s-letterhead", name: "Letterhead Design", description: "Professional letterhead layout, Print-Ready", price: 8000 },
  { id: "s-typo", name: "Typography Selection", description: "Font Pairing (Headings & Body)", price: 5000 },
  { id: "s-color", name: "Brand Color Palette Selection", description: "Primary & Secondary Colors (HEX, RGB, CMYK Codes)", price: 5000 },
  { id: "s-mockup", name: "Mockups", description: "3 – 5 Mockups (Merch)", price: 5000 },
  { id: "s-signature", name: "Email Signature", description: "HTML email signature with branding", price: 3000 },
  { id: "s-deck", name: "Decks", description: "Slide Presentation featuring custom data visualization and branded layouts. Delivered as an editable Canva/Powerpoint file and High-resolution PDF. 1 slide per unit price", price: 1500 }
];

const STATIC_CARDS = [
  { 
    id: "c-basic", 
    name: "Basic Identity Suite", 
    category: "identity", 
    tier: "basic", 
    price: 40000, 
    description: "Logo Design, Typography Selection, Brand Color Palette Selection",
    inclusions: [
      { name: "Logo Design", price: 35000 },
      { name: "Typography Selection", price: 5000 },
      { name: "Brand Color Palette Selection", price: 5000 }
    ]
  },
  { 
    id: "c-standard", 
    name: "Standard Identity Suite", 
    category: "identity", 
    tier: "standard", 
    price: 50000, 
    description: "Logo Design, Business Card Design, Typography Selection, Brand Color Palette Selection, Mockups",
    inclusions: [
      { name: "Logo Design", price: 35000 },
      { name: "Business Card Design", price: 10000 },
      { name: "Typography Selection", price: 5000 },
      { name: "Brand Color Palette Selection", price: 5000 },
      { name: "Mockups", price: 5000 }
    ]
  },
  { 
    id: "c-premium", 
    name: "Premium Identity Suite", 
    category: "identity", 
    tier: "premium", 
    price: 87000, 
    description: "Logo Design, Social Media Designs, Brand Guidelines, Business Card Design, Typography Selection, Brand Color Palette Selection, Mockups",
    inclusions: [
      { name: "Logo Design", price: 35000 },
      { name: "Social Media Designs", price: 24000 },
      { name: "Brand Guidelines", price: 20000 },
      { name: "Business Card Design", price: 10000 },
      { name: "Typography Selection", price: 5000 },
      { name: "Brand Color Palette Selection", price: 5000 },
      { name: "Mockups", price: 5000 }
    ]
  },
  { 
    id: "c-starter", 
    name: "Starter Asset Pack", 
    category: "asset", 
    tier: "starter", 
    price: 48000, 
    description: "Flyer Design (1x flyer a week)",
    inclusions: [
      { name: "Flyer Design (1x/week)", price: 20000 }
    ]
  },
  { 
    id: "c-pro", 
    name: "Pro Asset Pack", 
    category: "asset", 
    tier: "pro", 
    price: 88000, 
    description: "Flyer Design (2x flyer a week)",
    inclusions: [
      { name: "Flyer Design (2x/week)", price: 40000 }
    ]
  },
  { 
    id: "c-elite", 
    name: "Elite Asset Pack", 
    category: "asset", 
    tier: "elite", 
    price: 120000, 
    description: "Flyer Design (3x flyer a week)",
    inclusions: [
      { name: "Flyer Design (3x/week)", price: 60000 }
    ]
  }
];

const STATIC_SETTINGS = {
  bank_name: "Zenith Bank",
  account_number: "1012345678",
  account_name: "Tofunmi Yinusa Design",
  contact_email: "tofunmiyinusa01@gmail.com",
  contact_phone: "+234 812 345 6789",
  legal_footer: "All services require 50% upfront payment. Final source deliverables are released only upon full settlement of the remaining balance."
};

const STATIC_DISCOUNTS = [
  { code: "TOCHAY10", type: "percentage", value: 10 },
  { code: "FLAT5K", type: "flat", value: 5000 }
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "service" | "card";
  description?: string;
  inclusions?: { name: string; price: number }[];
  has_addons?: boolean;
  addon_price?: number;
  additional_units?: number;
}

export default function PricingPage() {
  const [masterServices, setMasterServices] = useState(STATIC_SERVICES);
  const [serviceCards, setServiceCards] = useState(STATIC_CARDS);
  const [siteSettings, setSiteSettings] = useState(STATIC_SETTINGS);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [discountCode, setDiscountCode] = useState<{ code: string; type: string; value: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [clientName, setClientName] = useState("");

  // A. Load catalog datasets from Supabase (with static fallback)
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
        ) {
          const { data: dbServices, error: sErr } = await supabase
            .from("master_services")
            .select("*")
            .order("price", { ascending: false });

          const { data: dbCards, error: cErr } = await supabase
            .from("service_cards")
            .select("*")
            .order("price", { ascending: true });

          const { data: dbSettings } = await supabase
            .from("site_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (!sErr && dbServices && dbServices.length > 0) {
            setMasterServices(dbServices as any);
          }
          if (!cErr && dbCards && dbCards.length > 0) {
            const { data: dbItems } = await supabase
              .from("card_service_items")
              .select("card_id, custom_name, price_override, master_services(name, price)");

            const mappedCards = dbCards.map((card) => {
              const inclusionsList = dbItems
                ? dbItems
                    .filter((item) => item.card_id === card.id)
                    .map((item) => {
                      const baseService = item.master_services as any;
                      return {
                        name: item.custom_name || baseService?.name || "Service Item",
                        price: item.price_override !== null && item.price_override !== undefined
                          ? Number(item.price_override)
                          : Number(baseService?.price || 0)
                      };
                    })
                : [];

              const itemsDesc = inclusionsList.map((item) => item.name).join(", ");
              return {
                ...card,
                description: itemsDesc || "Custom curated service bundle.",
                inclusions: inclusionsList
              };
            });
            setServiceCards(mappedCards as any);
          }
          if (dbSettings) {
            setSiteSettings(dbSettings as any);
          }
        }
      } catch (err) {
        console.warn("Supabase fetch unavailable, using static fallback assets:", err);
      }
    };

    fetchCatalog();
  }, []);

  // B. Load cart state from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("ty_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse local storage cart:", e);
      }
    }
  }, []);

  // C. Save cart state to LocalStorage
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("ty_cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("ty_cart");
    }
  }, [cart]);

  // D. Cart Stepper Managers
  const addToCart = (item: any, type: "service" | "card") => {
    setCart((prev) => {
      const exists = prev.find((x) => x.id === item.id);
      if (exists) {
        if (type === "card") return prev;
        return prev.map((x) =>
          x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: Number(item.price), 
        quantity: 1, 
        type, 
        description: item.description,
        inclusions: item.inclusions || [],
        has_addons: !!item.has_addons,
        addon_price: Number(item.addon_price || 0),
        additional_units: 0
      }];
    });
  };

  const decrementCart = (id: string) => {
    setCart((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, quantity: x.quantity - 1 } : x))
        .filter((x) => x.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
  };

  // E. Pricing Math computes
  const subtotal = cart.reduce((acc, x) => {
    const itemBasePrice = Number(x.price);
    const itemAddonsPrice = (x.additional_units || 0) * (x.addon_price || 0);
    return acc + (itemBasePrice + itemAddonsPrice) * x.quantity;
  }, 0);

  const discountAmount = (() => {
    if (!discountCode) return 0;
    if (discountCode.type === "percentage") {
      return subtotal * (discountCode.value / 100);
    }
    return discountCode.value;
  })();

  const grandTotal = Math.max(0, subtotal - discountAmount);

  // F. Promo code validation
  const applyPromo = async () => {
    setDiscountError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        const { data, error } = await supabase
          .from("discount_codes")
          .select("*")
          .eq("code", code)
          .maybeSingle();

        if (error || !data) {
          setDiscountError("Invalid promo code");
          setDiscountCode(null);
          return;
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setDiscountError("Promo code has expired");
          setDiscountCode(null);
          return;
        }

        setDiscountCode({ code: data.code, type: data.type, value: Number(data.value) });
      } else {
        const matched = STATIC_DISCOUNTS.find((x) => x.code === code);
        if (matched) {
          setDiscountCode(matched);
        } else {
          setDiscountError("Invalid promo code");
          setDiscountCode(null);
        }
      }
    } catch (e) {
      setDiscountError("Failed to apply promo code");
    }
  };

  // G. Dynamic PDF Invoice Compilation
  const generateInvoice = () => {
    if (!clientName.trim()) return;

    const buildPdf = (logoImg?: HTMLImageElement) => {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const invNumber = `INV-${Date.now().toString().slice(-6)}`;

      // Invoice Brand Header
      let textStartX = 20;
      if (logoImg) {
        doc.addImage(logoImg, "PNG", 20, 15, 12, 12);
        textStartX = 36;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text("Brand Systems & High-Fidelity Products", textStartX, 17);
      doc.text(`Email: ${siteSettings.contact_email}`, textStartX, 22);
      doc.text(`Tel: ${siteSettings.contact_phone}`, textStartX, 27);

      // Invoice Metadata Block
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(9, 9, 11);
      doc.text("INVOICE TO:", 140, 20);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(63, 63, 70);
      doc.text(clientName, 140, 26);
      doc.text(`Invoice No: ${invNumber}`, 140, 31);
      doc.text(`Date: ${dateStr}`, 140, 36);

      // Line Divider
      doc.setDrawColor(228, 228, 231);
      doc.line(20, 45, 190, 45);

      // Build Table Body Rows with Suite Inclusions Breakdowns
      const tableBody: string[][] = [];
      cart.forEach((item) => {
        const rate = item.price + (item.additional_units || 0) * (item.addon_price || 0);
        const total = rate * item.quantity;
        
        let displayName = item.name;
        if (item.has_addons && (item.additional_units || 0) > 0) {
          displayName += ` (+${item.additional_units} Add-on${item.additional_units !== 1 ? 's' : ''})`;
        }

        // Main item row
        tableBody.push([
          displayName,
          item.description || "",
          item.quantity.toString(),
          `N${rate.toLocaleString()}`,
          `N${total.toLocaleString()}`
        ]);

        // Add sub-rows for card inclusions
        if (item.type === "card" && Array.isArray(item.inclusions) && item.inclusions.length > 0) {
          item.inclusions.forEach((inc) => {
            tableBody.push([
              `  - ${inc.name}`,
              `Inclusion (Valued at N${Number(inc.price).toLocaleString()})`,
              "-",
              "-",
              "Included"
            ]);
          });
        }
      });

      // Render AutoTable Grid
      autoTable(doc, {
        startY: 52,
        head: [["Service", "Details & Inclusions", "Qty", "Rate (NGN)", "Total (NGN)"]],
        body: tableBody,
        theme: "striped",
        headStyles: { fillColor: [9, 9, 11], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { textColor: [63, 63, 70] },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 70 },
          2: { cellWidth: 15, halign: "center" },
          3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 25, halign: "right" }
        },
        margin: { left: 20, right: 20 }
      });

      // Totals calculations (Right alignment shifted to X=190 to avoid overlap/jumble)
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(63, 63, 70);
      doc.text(`Subtotal:`, 130, finalY);
      doc.text(`N${subtotal.toLocaleString()}`, 190, finalY, { align: "right" });

      if (discountAmount > 0) {
        doc.text(`Discount (${discountCode?.code}):`, 130, finalY + 6);
        doc.text(`-N${discountAmount.toLocaleString()}`, 190, finalY + 6, { align: "right" });
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(9, 9, 11);
      doc.text(`Grand Total (NGN):`, 130, finalY + 14);
      doc.text(`N${grandTotal.toLocaleString()}`, 190, finalY + 14, { align: "right" });

      // Bank account transfer box
      const boxY = finalY + 28;
      doc.setFillColor(248, 248, 247);
      doc.rect(20, boxY, 170, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(9, 9, 11);
      doc.text("BANK TRANSFER PAYMENT DETAILS", 24, boxY + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(63, 63, 70);
      doc.text(`Bank: ${siteSettings.bank_name}  |  Acc Number: ${siteSettings.account_number}  |  Name: ${siteSettings.account_name}`, 24, boxY + 12);
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text("Please email the payment receipt screenshot directly to begin onboarding deliverables.", 24, boxY + 18);

      // Disclaimer footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(161, 161, 170);
      const splitDisclaimer = doc.splitTextToSize(siteSettings.legal_footer, 170);
      doc.text(splitDisclaimer, 20, boxY + 38);

      // Trigger local download
      doc.save(`invoice-${clientName.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString().slice(-4)}.pdf`);
      setShowInvoiceModal(false);
    };

    const logoImg = new Image();
    logoImg.src = "/images/toflogoblack.png";
    logoImg.onload = () => {
      buildPdf(logoImg);
    };
    logoImg.onerror = () => {
      buildPdf(undefined);
    };
  };

  const identitySuites = serviceCards.filter((x) => x.category === "identity");
  const assetSuites = serviceCards.filter((x) => x.category === "asset");

  // H. Search filtering logic for autocomplete dropdown
  const query = searchQuery.trim().toLowerCase();
  
  const dropdownItems = query
    ? [
        ...masterServices
          .filter(
            (x) =>
              x.name.toLowerCase().includes(query) ||
              (x.description && x.description.toLowerCase().includes(query))
          )
          .map((x) => ({ ...x, type: "service" as const })),
        ...serviceCards
          .filter(
            (x) =>
              x.name.toLowerCase().includes(query) ||
              (x.description && x.description.toLowerCase().includes(query))
          )
          .map((x) => ({ ...x, type: "card" as const }))
      ]
    : [];

  const totalCartCount = cart.reduce((acc, x) => acc + x.quantity, 0);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <main className="relative min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans">
      <Navbar />

      {/* Main Title Header */}
      <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 md:px-12 pt-28 md:pt-36 flex flex-col items-start gap-3 select-none">
        <span className="font-sans font-medium text-[10px] sm:text-xs text-zinc-400 uppercase tracking-widest">
          Rate Card & Suites
        </span>
        <h1 className="font-sans font-bold text-4xl sm:text-6xl md:text-7xl lg:text-[4.5rem] tracking-tight leading-[1.05] text-[#09090b]">
          pricing & packages.
        </h1>
        <p className="font-sans font-normal text-zinc-500 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed mt-2">
          Select individual rate cards, monthly assets retainers, or complete brand systems. Compile custom scopes and download your invoice directly.
        </p>
      </div>

      {/* Sleek Search bar with floating autocomplete dropdown */}
      <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 md:px-12 mt-10 relative" ref={searchContainerRef}>
        <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-full px-5 py-3.5 focus-within:border-zinc-500 transition-all duration-300 flex items-center gap-3 shadow-xs">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search services, suites, templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-hidden text-[#09090b] placeholder:text-zinc-300 text-sm font-sans w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-zinc-400 hover:text-zinc-700 focus:outline-hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown List */}
        {searchQuery && (
          <div className="absolute top-full left-6 sm:left-8 md:left-12 z-30 mt-2 w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden max-h-[350px] overflow-y-auto flex flex-col divide-y divide-zinc-100">
            {dropdownItems.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs font-sans">
                No matching services or packages found.
              </div>
            ) : (
              dropdownItems.map((item) => {
                const inCart = cart.some((x) => x.id === item.id);
                const qty = cart.find((x) => x.id === item.id)?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-semibold text-sm text-zinc-950">
                        {item.name}
                      </span>
                      <span className="font-sans font-normal text-zinc-400 text-[10px] max-w-[240px] line-clamp-1 leading-normal">
                        {item.description || "Curated package suite deliverables."}
                      </span>
                      <span className="font-sans font-bold text-xs text-zinc-950 mt-1 block">
                        ₦{Number(item.price).toLocaleString()}
                        {item.type === "card" && item.category === "asset" && <span className="font-normal text-zinc-400 text-[9px] lowercase"> /mo</span>}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center justify-center">
                      {item.type === "service" && qty > 0 ? (
                        <div className="flex items-center bg-zinc-100 rounded-lg px-2 py-0.5 gap-2 border border-zinc-200 select-none">
                          <button
                            onClick={() => decrementCart(item.id)}
                            className="text-zinc-500 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-xs text-zinc-950 min-w-[8px] text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() => addToCart(item, "service")}
                            className="text-zinc-500 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item, item.type)}
                          disabled={inCart && item.type === "card"}
                          className={`px-3 py-1.5 rounded-lg border font-sans font-semibold text-[10px] tracking-tight transition-all cursor-pointer ${
                            inCart && item.type === "card"
                              ? "bg-zinc-100 text-zinc-400 border-transparent"
                              : "bg-zinc-950 text-white hover:bg-[#ffd230] hover:text-zinc-950 border-transparent shadow-xs"
                          }`}
                        >
                          {inCart && item.type === "card" ? "Added" : "Add"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Main Single Column Catalog Container (Always displays all items) */}
      <div className="w-full max-w-5xl mx-auto px-6 sm:px-8 md:px-12 py-16 md:py-24 flex flex-col gap-16">
        
        {/* Section 1: Brand Identity Suites */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 select-none">
            <span className="font-sans font-semibold text-xs text-zinc-400 uppercase tracking-wider">01 / SYSTEMS</span>
            <h3 className="font-sans font-bold text-2xl sm:text-3xl text-zinc-950">Brand Identity Suites</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {identitySuites.map((card, idx) => {
              const inCart = cart.some((x) => x.id === card.id);
              const inclusions = card.description ? card.description.split(", ") : [];
              const isFeatured = idx === 1;

              return (
                <div
                  key={card.id}
                  className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 h-[485px] md:h-[515px] justify-between ${
                    isFeatured
                      ? "bg-zinc-950 border-zinc-900 shadow-xl hover:shadow-black/20"
                      : "bg-white border-zinc-200/80 shadow-xs hover:shadow-lg"
                  }`}
                >
                  {/* Top Header Block */}
                  <div
                    className={`p-6 flex flex-col gap-2 relative ${
                      isFeatured ? "bg-zinc-900/60" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                        {card.tier} suite
                      </span>
                      {isFeatured && (
                        <span className="font-sans font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ffd230] text-zinc-950 select-none">
                          Popular
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-1 mt-2">
                      <span
                        className={`font-sans font-bold text-4xl sm:text-[2.6rem] tracking-tight leading-none ${
                          isFeatured ? "text-white" : "text-zinc-950"
                        }`}
                      >
                        ₦{Number(card.price).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="font-sans font-normal text-zinc-500 text-xs mt-1 leading-normal select-none">
                      Complete identity systems package.
                    </p>
                  </div>

                  {/* Bottom Inclusions & CTA Block */}
                  <div
                    className={`p-6 border-t flex flex-col gap-4 flex-grow justify-between ${
                      isFeatured
                        ? "bg-[#09090b] border-zinc-900/60"
                        : "bg-zinc-50/50 border-zinc-100"
                    }`}
                  >
                    <div className="flex flex-col gap-3 pt-2">
                      {inclusions.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Check className="w-3.5 h-3.5 text-[#ffd230] shrink-0 mt-0.5" />
                          <span
                            className={`font-sans font-normal text-xs leading-normal ${
                              isFeatured ? "text-zinc-400" : "text-zinc-600"
                            }`}
                          >
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addToCart(card, "card")}
                      disabled={inCart}
                      className={`w-full py-1.5 pl-5 pr-1.5 rounded-full flex items-center justify-between text-xs font-sans font-semibold tracking-tight transition-all duration-300 border border-transparent cursor-pointer ${
                        inCart
                          ? isFeatured
                            ? "bg-zinc-900 text-zinc-600"
                            : "bg-zinc-100 text-zinc-400"
                          : isFeatured
                            ? "bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm"
                            : "bg-zinc-950 text-white hover:bg-zinc-900 shadow-sm"
                      }`}
                    >
                      <span>{inCart ? "Added to Scope" : "Select Suite"}</span>
                      <div className="w-7 h-7 rounded-full bg-[#ffd230] flex items-center justify-center shrink-0">
                        {inCart ? (
                          <Check className="w-3.5 h-3.5 text-zinc-950" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Asset Tiers Retainers */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 select-none">
            <span className="font-sans font-semibold text-xs text-zinc-400 uppercase tracking-wider">02 / RETAINERS</span>
            <h3 className="font-sans font-bold text-2xl sm:text-3xl text-zinc-950">Asset Suites (Monthly)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assetSuites.map((card, idx) => {
              const inCart = cart.some((x) => x.id === card.id);
              const inclusions = card.description ? card.description.split(", ") : [];
              const isFeatured = idx === 1;

              return (
                <div
                  key={card.id}
                  className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 h-[485px] md:h-[515px] justify-between ${
                    isFeatured
                      ? "bg-zinc-950 border-zinc-900 shadow-xl hover:shadow-black/20"
                      : "bg-white border-zinc-200/80 shadow-xs hover:shadow-lg"
                  }`}
                >
                  {/* Top Header Block */}
                  <div
                    className={`p-6 flex flex-col gap-2 relative ${
                      isFeatured ? "bg-zinc-900/60" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                        {card.tier} plan
                      </span>
                      {isFeatured && (
                        <span className="font-sans font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ffd230] text-zinc-950 select-none">
                          Popular
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-1 mt-2">
                      <span
                        className={`font-sans font-bold text-4xl sm:text-[2.6rem] tracking-tight leading-none ${
                          isFeatured ? "text-white" : "text-zinc-950"
                        }`}
                      >
                        ₦{Number(card.price).toLocaleString()}
                      </span>
                      <span className="font-sans font-normal text-zinc-400 text-xs">/month</span>
                    </div>
                    
                    <p className="font-sans font-normal text-zinc-500 text-xs mt-1 leading-normal select-none">
                      Flexible monthly assets retainer.
                    </p>
                  </div>

                  {/* Bottom Inclusions & CTA Block */}
                  <div
                    className={`p-6 border-t flex flex-col gap-4 flex-grow justify-between ${
                      isFeatured
                        ? "bg-[#09090b] border-zinc-900/60"
                        : "bg-zinc-50/50 border-zinc-100"
                    }`}
                  >
                    <div className="flex flex-col gap-3 pt-2">
                      {inclusions.map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Check className="w-3.5 h-3.5 text-[#ffd230] shrink-0 mt-0.5" />
                          <span
                            className={`font-sans font-normal text-xs leading-normal ${
                              isFeatured ? "text-zinc-400" : "text-zinc-600"
                            }`}
                          >
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addToCart(card, "card")}
                      disabled={inCart}
                      className={`w-full py-1.5 pl-5 pr-1.5 rounded-full flex items-center justify-between text-xs font-sans font-semibold tracking-tight transition-all duration-300 border border-transparent cursor-pointer ${
                        inCart
                          ? isFeatured
                            ? "bg-zinc-900 text-zinc-600"
                            : "bg-zinc-100 text-zinc-400"
                          : isFeatured
                            ? "bg-white text-zinc-950 hover:bg-zinc-100 shadow-sm"
                            : "bg-zinc-950 text-white hover:bg-zinc-900 shadow-sm"
                      }`}
                    >
                      <span>{inCart ? "Added to Scope" : "Select Suite"}</span>
                      <div className="w-7 h-7 rounded-full bg-[#ffd230] flex items-center justify-center shrink-0">
                        {inCart ? (
                          <Check className="w-3.5 h-3.5 text-zinc-950" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: One-Off Services */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 select-none">
            <span className="font-sans font-semibold text-xs text-zinc-400 uppercase tracking-wider">03 / DELIVERABLES</span>
            <h3 className="font-sans font-bold text-2xl sm:text-3xl text-zinc-950">One-Off Services</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {masterServices.map((service) => {
              const cartQty = cart.find((x) => x.id === service.id)?.quantity || 0;
              return (
                <div
                  key={service.id}
                  className="flex items-start justify-between gap-4 p-5 rounded-xl border border-zinc-200 bg-white hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex flex-col gap-1.5">
                    <h4 className="font-sans font-bold text-base text-zinc-950 tracking-tight leading-snug">
                      {service.name}
                    </h4>
                    <p className="font-sans font-normal text-zinc-400 text-xs leading-relaxed max-w-xs">
                      {service.description}
                    </p>
                    <span className="font-sans font-extrabold text-sm text-zinc-950 mt-1 block">
                      ₦{Number(service.price).toLocaleString()}
                      {service.name === "Decks" && <span className="font-normal text-zinc-400 text-[10px] lowercase"> / slide</span>}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center justify-center">
                    {cartQty > 0 ? (
                      <div className="flex items-center bg-zinc-100 rounded-lg px-2 py-1 gap-2.5 border border-zinc-200">
                        <button
                          onClick={() => decrementCart(service.id)}
                          className="text-zinc-500 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-xs text-zinc-950 select-none min-w-[8px] text-center">
                          {cartQty}
                        </span>
                        <button
                          onClick={() => addToCart(service, "service")}
                          className="text-zinc-500 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(service, "service")}
                        className="px-3.5 py-1.5 rounded-lg border border-zinc-900 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white text-xs font-sans font-semibold transition-all duration-300 cursor-pointer shadow-xs active:scale-97"
                      >
                        Add to Scope
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Sticky Cart Trigger Button (Always visible) */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-8 right-8 z-40 bg-zinc-950 text-white rounded-full p-4.5 hover:bg-[#ffd230] hover:text-zinc-950 transition-all duration-300 shadow-xl cursor-pointer flex items-center justify-center border border-zinc-800"
        aria-label="View Scope"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalCartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#ffd230] text-zinc-950 font-mono font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white select-none animate-scale-in">
            {totalCartCount}
          </span>
        )}
      </button>

      {/* Cart Drawer Overlay Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-500 ease-in-out ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Slide-in Checkout Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl transition-transform duration-500 ease-in-out transform flex flex-col justify-between ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between select-none">
          <h3 className="font-sans font-bold text-lg sm:text-xl text-zinc-950 flex items-center gap-3">
            <span>Your Custom Scope</span>
            <span className="font-mono text-xs font-semibold text-zinc-400 bg-zinc-50 px-2.5 py-0.5 rounded-full">
              {totalCartCount} Items
            </span>
          </h3>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-zinc-400 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Items Body */}
        <div className="flex-grow overflow-y-auto p-6 sm:p-8 scrollbar-none flex flex-col gap-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center select-none flex-grow">
              <FileText className="w-12 h-12 text-zinc-200 mb-3" />
              <span className="font-sans font-bold text-zinc-400 text-sm">Scope is Empty</span>
              <p className="font-sans font-normal text-zinc-400 text-xs max-w-xs mt-1 leading-normal">
                Add deliverables or packages from the directory to compile your custom estimate.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 w-full">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col gap-2.5 border-b border-zinc-100 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-semibold text-sm text-zinc-950 tracking-tight leading-tight">
                        {item.name}
                      </span>
                      <span className="font-sans font-normal text-zinc-400 text-xs block mt-0.5">
                        N{item.price.toLocaleString()}
                        {item.name === "Decks" && <span className="font-normal text-zinc-400 text-[10px] lowercase"> / slide</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.type === "service" ? (
                        <div className="flex items-center bg-zinc-100 rounded-lg px-2 py-0.5 gap-2 border border-zinc-200 select-none">
                          <button
                            onClick={() => decrementCart(item.id)}
                            className="text-zinc-500 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-xs text-zinc-950 min-w-[8px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addToCart(item, "service")}
                            className="text-zinc-500 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-sans font-medium text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 select-none">
                          Package
                        </span>
                      )}

                      <span className="font-sans font-bold text-sm text-zinc-950 min-w-[70px] text-right">
                        N{((item.price + (item.additional_units || 0) * (item.addon_price || 0)) * item.quantity).toLocaleString()}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors duration-300 focus:outline-hidden cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Addon Inclusions multiplier selector */}
                  {item.has_addons && (
                    <div className="flex items-center gap-2.5 mt-1 select-none bg-zinc-50 border border-zinc-150 rounded-lg p-2 max-w-[280px] self-start">
                      <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">
                        Add-ons:
                      </span>
                      <div className="flex items-center bg-white rounded-md px-1.5 py-0.5 gap-2 border border-zinc-200">
                        <button
                          onClick={() => {
                            const nextUnits = Math.max(0, (item.additional_units || 0) - 1);
                            setCart(prev => prev.map(x => x.id === item.id ? { ...x, additional_units: nextUnits } : x));
                          }}
                          className="text-zinc-500 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-xs text-zinc-950 min-w-[12px] text-center">
                          +{item.additional_units || 0}
                        </span>
                        <button
                          onClick={() => {
                            const nextUnits = (item.additional_units || 0) + 1;
                            setCart(prev => prev.map(x => x.id === item.id ? { ...x, additional_units: nextUnits } : x));
                          }}
                          className="text-zinc-500 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-sans text-[10px] font-bold text-zinc-500">
                        (+N{((item.additional_units || 0) * (item.addon_price || 0)).toLocaleString()})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Calculations (Only if cart has items) */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex flex-col gap-5">
            
            {/* Promo input code */}
            <div className="flex flex-col gap-2 select-none">
              <span className="font-sans font-semibold text-[10px] uppercase tracking-wider text-zinc-400 pl-0.5">
                Apply Promo Code
              </span>
              <div className="flex gap-2">
                <div className="relative w-full">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="e.g. TOCHAY10"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-sans focus:border-zinc-500 focus:outline-hidden placeholder:text-zinc-300 uppercase font-medium"
                  />
                </div>
                <button
                  onClick={applyPromo}
                  className="px-4 py-2.5 rounded-lg bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white text-xs font-sans font-semibold transition-all duration-300 shrink-0 cursor-pointer shadow-xs active:scale-97"
                >
                  Apply
                </button>
              </div>
              {discountError && (
                <span className="text-red-500 font-sans text-xs pl-0.5">{discountError}</span>
              )}
              {discountCode && (
                <div className="flex items-center justify-between bg-white border border-zinc-200 px-3.5 py-2 rounded-lg mt-1">
                  <span className="font-sans font-semibold text-xs text-zinc-950 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Code {discountCode.code} Applied</span>
                  </span>
                  <button
                    onClick={() => {
                      setDiscountCode(null);
                      setPromoInput("");
                    }}
                    className="text-zinc-400 hover:text-zinc-700 focus:outline-hidden cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Calculations layout */}
            <div className="flex flex-col gap-3 select-none border-b border-zinc-200/60 pb-5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm text-zinc-400">Subtotal</span>
                <span className="font-sans font-bold text-sm text-zinc-950">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-sans text-sm text-zinc-400">Discount ({discountCode?.code})</span>
                  <span className="font-sans font-bold text-sm text-red-500">
                    -₦{discountAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="font-sans font-bold text-base text-zinc-950">Total Amount</span>
                <span className="font-sans font-extrabold text-lg sm:text-xl text-[#09090b]">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action CTAs */}
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-zinc-950 text-white font-sans font-semibold text-sm hover:bg-[#ffd230] hover:text-zinc-950 transition-all duration-300 cursor-pointer shadow-md shadow-zinc-950/20 active:scale-98"
            >
              <span>Generate Invoice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Invoice Modal Overlay Popup */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[60] p-6">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 flex flex-col relative animate-fade-in">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-950 transition-colors duration-300 focus:outline-hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-sans font-bold text-xl text-[#09090b] mb-2 select-none">
              Client Details
            </h3>
            <p className="font-sans font-normal text-zinc-400 text-xs leading-normal mb-6 select-none">
              Input the Client or Organization name. This metadata will compile directly into the PDF invoice brand header.
            </p>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-sans font-medium text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider">
                  Client / Organization Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bose Corporation"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm font-sans focus:border-zinc-500 focus:outline-hidden"
                />
              </div>

              <button
                onClick={generateInvoice}
                disabled={!clientName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-zinc-950 text-white font-sans font-semibold text-sm hover:bg-[#ffd230] hover:text-zinc-950 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-xs active:scale-98"
              >
                <span>Download PDF Invoice</span>
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
