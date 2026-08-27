"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Minus,
  Trash2, 
  Edit, 
  Save, 
  Check, 
  AlertCircle, 
  X, 
  Eye, 
  Upload, 
  Loader2, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft,
  Share2, 
  Clock, 
  FileText,
  Search,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  FolderOpen,
  DollarSign,
  Copy,
  Lock,
  Bell,
  Send,
  Mail,
  CheckCircle2,
  GripVertical
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface PhasePresentationItem {
  id?: string;
  phase_id?: string;
  presentation_id: string;
  version_label: string;
  is_current_version: boolean;
  deck_title?: string;
  client_name?: string;
  token?: string;
}

export interface PortalPhaseItem {
  id?: string;
  portal_id?: string;
  title: string;
  description: string;
  status: "active" | "completed" | "inactive";
  sort_order: number;
  completed_at?: string | null;
  presentations?: PhasePresentationItem[];
}

export interface PortalFileItem {
  id?: string;
  portal_id?: string;
  filename: string;
  file_url: string;
  category: string;
  file_size?: string;
  created_at?: string;
}

export interface PortalInvoiceItem {
  id: string;
  name: string;
  description?: string;
  unit_price: number;
  quantity: number;
  has_addons?: boolean;
  addon_price?: number;
  additional_units?: number;
  type?: "service" | "card" | "custom";
}

export const PRICING_CATALOG = [
  // A la carte Services
  { id: "s-logo", name: "Logo Design", category: "Service Rate", description: "3 Initial Concepts, 2 Revision Rounds, Final Master Vectors (AI, EPS, PNG, JPG)", price: 35000, has_addons: true, addon_price: 10000, type: "service" as const },
  { id: "s-pack", name: "Packaging Design", category: "Service Rate", description: "Product packaging mockup and print-ready production files", price: 25000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-social", name: "Social Media Designs", category: "Service Rate", description: "3 editable Canva/PSD template designs for platforms of choice", price: 24000, has_addons: true, addon_price: 8000, type: "service" as const },
  { id: "s-guide", name: "Brand Guidelines", category: "Service Rate", description: "5–8 Page Guide (Logo Usage, Colors, Typography Overview)", price: 20000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-flyer", name: "Flyer Design", category: "Service Rate", description: "PNG, JPG, Print-Ready High-Res PDF", price: 20000, has_addons: true, addon_price: 15000, type: "service" as const },
  { id: "s-signage", name: "Signage Design", category: "Service Rate", description: "Indoor/Outdoor signage layout with production dimensions", price: 15000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-card", name: "Business Card Design", category: "Service Rate", description: "1 Concept Design (Front & Back), Print-Ready PDF + Source File", price: 10000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-idcard", name: "ID Card Design", category: "Service Rate", description: "Corporate ID card layout (Front & Back) with employee placeholder styling, Print-Ready", price: 10000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-letterhead", name: "Letterhead Design", category: "Service Rate", description: "Professional corporate letterhead layout, Print-Ready", price: 8000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-typo", name: "Typography Selection", category: "Service Rate", description: "Curated Font Pairing System (Headings & Body)", price: 5000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-color", name: "Brand Color Palette Selection", category: "Service Rate", description: "Primary & Secondary Colors (HEX, RGB, CMYK Codes)", price: 5000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-mockup", name: "Mockups", category: "Service Rate", description: "3 – 5 High-Resolution Merch & Application Mockups", price: 5000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-signature", name: "Email Signature", category: "Service Rate", description: "HTML email signature with verified branding", price: 3000, has_addons: false, addon_price: 0, type: "service" as const },
  { id: "s-deck", name: "Slide Decks / Presentation", category: "Service Rate", description: "Slide Presentation featuring custom data visualization and branded layouts", price: 1500, has_addons: true, addon_price: 1500, type: "service" as const },

  // Identity Suites & Retainer Packs
  { id: "c-basic", name: "Basic Identity Suite", category: "Identity Suite", description: "Logo Design, Typography Selection, Brand Color Palette Selection", price: 40000, has_addons: false, addon_price: 0, type: "card" as const },
  { id: "c-standard", name: "Standard Identity Suite", category: "Identity Suite", description: "Logo Design, Business Card Design, Typography Selection, Brand Color Palette Selection, Mockups", price: 50000, has_addons: false, addon_price: 0, type: "card" as const },
  { id: "c-premium", name: "Premium Identity Suite", category: "Identity Suite", description: "Logo Design, Social Media Designs, Brand Guidelines, Business Card Design, Typography Selection, Brand Color Palette Selection, Mockups", price: 87000, has_addons: false, addon_price: 0, type: "card" as const },
  { id: "c-starter", name: "Starter Asset Pack", category: "Monthly Retainer", description: "Flyer Design (1x flyer a week)", price: 48000, has_addons: false, addon_price: 0, type: "card" as const },
  { id: "c-pro", name: "Pro Asset Pack", category: "Monthly Retainer", description: "Flyer Design (2x flyer a week)", price: 88000, has_addons: false, addon_price: 0, type: "card" as const },
  { id: "c-elite", name: "Elite Asset Pack", category: "Monthly Retainer", description: "Flyer Design (3x flyer a week + 1 Motion design per month)", price: 150000, has_addons: false, addon_price: 0, type: "card" as const }
];

export interface ClientPortalItem {
  id: string;
  client_name: string;
  project_title: string;
  token: string;
  client_logo_url?: string | null;
  client_email?: string | null;
  notification_preferences?: any;
  status: "Onboarding" | "In Progress" | "In Review" | "Completed" | "On Hold";
  start_date?: string | null;
  target_delivery_date?: string | null;
  budget_total?: number;
  deposit_paid?: number;
  invoice_status?: "Deposit Paid" | "Awaiting Balance" | "Paid in Full";
  created_at: string;
  phases?: PortalPhaseItem[];
  files?: PortalFileItem[];
  invoice_items?: PortalInvoiceItem[];
}

export default function ClientPortalsTab() {
  const [portals, setPortals] = useState<ClientPortalItem[]>([]);
  const [presentationsList, setPresentationsList] = useState<{ id: string; title: string; client_name: string; token: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Pricing Catalog State
  const [catalogItems, setCatalogItems] = useState(PRICING_CATALOG);
  const [pricingSearch, setPricingSearch] = useState("");
  const [showPricingDropdown, setShowPricingDropdown] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPortal, setEditingPortal] = useState<Partial<ClientPortalItem> | null>(null);
  const [portalPhases, setPortalPhases] = useState<PortalPhaseItem[]>([]);
  const [portalFiles, setPortalFiles] = useState<PortalFileItem[]>([]);
  const [portalInvoiceItems, setPortalInvoiceItems] = useState<PortalInvoiceItem[]>([]);
  const [activeModalTab, setActiveModalTab] = useState<"details" | "roadmap" | "files" | "financials">("details");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [portalUploadProgress, setPortalUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [draggedPhaseIdx, setDraggedPhaseIdx] = useState<number | null>(null);
  const [dragOverPhaseIdx, setDragOverPhaseIdx] = useState<number | null>(null);

  // Quick Client Notify Modal State
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<{
    portal: ClientPortalItem | Partial<ClientPortalItem>;
    phase?: PortalPhaseItem;
    presentation?: any;
    type: "presentation_ready" | "milestone_update" | "files_released" | "custom_message";
    headline: string;
    presentationToken?: string;
  } | null>(null);
  const [notifyCustomMessage, setNotifyCustomMessage] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);

  // New file form state
  const [newFileCategory, setNewFileCategory] = useState("Logo Files");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const pricingSearchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (pricingSearchContainerRef.current && !pricingSearchContainerRef.current.contains(e.target as Node)) {
        setShowPricingDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Presentations for dropdown mapping
      // 1. Fetch Presentations List for Dropdowns
      try {
        const { data: presData } = await supabase
          .from("presentations")
          .select("id, title, client_name, token")
          .order("created_at", { ascending: false });
        if (presData && presData.length > 0) {
          setPresentationsList(presData);
        } else {
          const cached = localStorage.getItem("tochay_offline_presentations");
          if (cached) setPresentationsList(JSON.parse(cached));
        }
      } catch (err) {
        const cached = localStorage.getItem("tochay_offline_presentations");
        if (cached) setPresentationsList(JSON.parse(cached));
      }

      // 2. Fetch Client Portals
      let dbPortals: ClientPortalItem[] = [];
      const cached = localStorage.getItem("tochay_offline_client_portals");
      let localPortalsMap: { [id: string]: ClientPortalItem } = {};
      if (cached) {
        try {
          const parsed: ClientPortalItem[] = JSON.parse(cached);
          parsed.forEach(p => {
            if (p.id) localPortalsMap[p.id] = p;
            if (p.token) localPortalsMap[p.token] = p;
          });
        } catch (e) {
          console.error("Failed to parse cached portals:", e);
        }
      }

      try {
        const { data, error } = await supabase
          .from("client_portals")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          dbPortals = data;
        } else if (cached) {
          dbPortals = JSON.parse(cached);
        }
      } catch (err) {
        console.warn("Supabase fetch failed, attempting local fallback cache.");
        if (cached) {
          try {
            dbPortals = JSON.parse(cached);
          } catch (e) {
            console.error("Failed to parse cached portals:", e);
          }
        }
      }

      // 3. For each portal, load its phases, presentations, and files
      const enrichedPortals = await Promise.all(
        dbPortals.map(async (portal) => {
          let phases: PortalPhaseItem[] = [];
          let files: PortalFileItem[] = [];

          try {
            const { data: phasesData } = await supabase
              .from("portal_phases")
              .select("*")
              .eq("portal_id", portal.id)
              .order("sort_order", { ascending: true });

            if (phasesData && phasesData.length > 0) {
              phases = await Promise.all(
                phasesData.map(async (phase) => {
                  const { data: presLinks } = await supabase
                    .from("phase_presentations")
                    .select("*")
                    .eq("phase_id", phase.id)
                    .order("sort_order", { ascending: true });

                  return {
                    ...phase,
                    presentations: presLinks || []
                  };
                })
              );
            }

            const { data: filesData } = await supabase
              .from("portal_files")
              .select("*")
              .eq("portal_id", portal.id)
              .order("created_at", { ascending: false });

            if (filesData && filesData.length > 0) files = filesData;
          } catch (err) {
            console.warn(`Could not load child relations for portal ${portal.id}`);
          }

          // Fallback from local storage if Supabase child tables are empty or failed
          const localMatch = localPortalsMap[portal.id] || localPortalsMap[portal.token] || portal;
          if (phases.length === 0 && localMatch?.phases && localMatch.phases.length > 0) {
            phases = localMatch.phases;
          }
          if (files.length === 0 && localMatch?.files && localMatch.files.length > 0) {
            files = localMatch.files;
          }

          let invoiceItems: PortalInvoiceItem[] = portal.invoice_items || [];
          if (!invoiceItems || invoiceItems.length === 0) {
            const cachedItems = localStorage.getItem(`tochay_offline_invoice_items_${portal.id}`);
            if (cachedItems) {
              try { invoiceItems = JSON.parse(cachedItems); } catch(e){}
            }
          }
          if ((!invoiceItems || invoiceItems.length === 0) && localMatch?.invoice_items) {
            invoiceItems = localMatch.invoice_items;
          }

          return {
            ...portal,
            phases,
            files,
            invoice_items: invoiceItems
          };
        })
      );

      setPortals(enrichedPortals);

      // Load pricing catalog items dynamically from master_services, cards, and offline cache
      try {
        const { data: dbMasterServices } = await supabase.from("master_services").select("*");
        const { data: dbCards } = await supabase.from("cards").select("*");
        const { data: dbCardItems } = await supabase
          .from("card_service_items")
          .select("card_id, custom_name, price_override, master_services(name, price)");

        let loadedServices = dbMasterServices;
        let loadedCards = dbCards;

        if (!loadedServices || loadedServices.length === 0) {
          const cached = localStorage.getItem("tochay_offline_services");
          if (cached) {
            try { loadedServices = JSON.parse(cached); } catch(e){}
          }
        }
        if (!loadedCards || loadedCards.length === 0) {
          const cached = localStorage.getItem("tochay_offline_cards");
          if (cached) {
            try { loadedCards = JSON.parse(cached); } catch(e){}
          }
        }

        const dynamicCatalog: any[] = [];

        // 1. Master Services
        if (loadedServices && loadedServices.length > 0) {
          loadedServices.forEach((s: any) => {
            dynamicCatalog.push({
              id: s.id,
              name: s.name,
              category: "Service Rate",
              description: s.description || "",
              price: Number(s.price || 0),
              has_addons: !!s.has_addons,
              addon_price: Number(s.addon_price || 0),
              type: "service"
            });
          });
        }

        // 2. Cards / Packages
        if (loadedCards && loadedCards.length > 0) {
          loadedCards.forEach((c: any) => {
            const cardInclusions = dbCardItems
              ? dbCardItems
                  .filter((item: any) => item.card_id === c.id)
                  .map((item: any) => item.custom_name || item.master_services?.name || "Service Item")
                  .join(", ")
              : "";

            dynamicCatalog.push({
              id: c.id,
              name: c.name,
              category: c.category === "identity" ? "Identity Suite" : c.category === "asset" ? "Monthly Retainer" : "Package",
              description: cardInclusions || c.description || "",
              price: Number(c.price || 0),
              has_addons: !!c.has_addons,
              addon_price: Number(c.addon_price || 0),
              type: "card"
            });
          });
        }

        // 3. Fallback to PRICING_CATALOG for any items not in dynamic
        PRICING_CATALOG.forEach(staticItem => {
          if (!dynamicCatalog.some(d => d.name.toLowerCase() === staticItem.name.toLowerCase())) {
            dynamicCatalog.push(staticItem);
          }
        });

        setCatalogItems(dynamicCatalog);
      } catch (e) {
        console.warn("Pricing catalog dynamic fetch notice:", e);
        setCatalogItems(PRICING_CATALOG);
      }
    } catch (err: any) {
      console.error("Failed to load client portals:", err);
      setAlert({ type: "error", message: "Failed to load client portals." });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    const defaultPhases: PortalPhaseItem[] = [
      {
        id: crypto.randomUUID(),
        title: "Discovery & Strategy",
        description: "Initial intake, brand questionnaire, and strategic positioning.",
        status: "completed",
        sort_order: 0,
        completed_at: new Date().toISOString(),
        presentations: []
      },
      {
        id: crypto.randomUUID(),
        title: "Concept Design",
        description: "Core logo marks, visual identity directions, and concept exploration.",
        status: "active",
        sort_order: 1,
        presentations: []
      },
      {
        id: crypto.randomUUID(),
        title: "Client Selection & Revisions",
        description: "Reviewing selected route, fine-tuning typography, colors, and iconography.",
        status: "inactive",
        sort_order: 2,
        presentations: []
      },
      {
        id: crypto.randomUUID(),
        title: "Brand System & Collateral",
        description: "Developing brand guidelines, stationary, social templates, and packaging.",
        status: "inactive",
        sort_order: 3,
        presentations: []
      },
      {
        id: crypto.randomUUID(),
        title: "Final Handover & Assets",
        description: "Master vector exports, guidelines PDF, fonts, and production deliverables.",
        status: "inactive",
        sort_order: 4,
        presentations: []
      }
    ];

    setEditingPortal({
      client_name: "",
      project_title: "",
      token: "portal-" + Math.random().toString(36).substring(2, 9),
      status: "In Progress",
      start_date: new Date().toISOString().split("T")[0],
      target_delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      budget_total: 0,
      deposit_paid: 0,
      invoice_status: "Deposit Paid"
    });
    setPortalPhases(defaultPhases);
    setPortalFiles([]);
    setPortalInvoiceItems([]);
    setActiveModalTab("details");
    setShowModal(true);
  };

  const handleOpenEditModal = (portal: ClientPortalItem) => {
    setEditingPortal({ ...portal });
    setPortalPhases(
      (portal.phases || []).map((p, idx) => ({
        ...p,
        id: p.id || crypto.randomUUID(),
        presentations: (p.presentations || []).map(pr => ({ ...pr }))
      }))
    );
    setPortalFiles(portal.files ? [...portal.files] : []);
    setPortalInvoiceItems(portal.invoice_items ? [...portal.invoice_items.map(i => ({ ...i }))] : []);
    setActiveModalTab("details");
    setShowModal(true);
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setAlert({ type: "success", message: "Client Portal link copied to clipboard!" });
    setTimeout(() => setCopiedToken(null), 3000);
  };

  // Phase Manipulation Handlers
  const handleAddPhase = () => {
    const newPhase: PortalPhaseItem = {
      id: crypto.randomUUID(),
      title: "New Phase",
      description: "",
      status: "inactive",
      sort_order: portalPhases.length,
      presentations: []
    };
    setPortalPhases([...portalPhases, newPhase]);
  };

  const handleRemovePhase = (index: number) => {
    const updated = portalPhases.filter((_, idx) => idx !== index).map((p, idx) => ({ ...p, sort_order: idx }));
    setPortalPhases(updated);
  };

  const handleMovePhase = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= portalPhases.length) return;

    const list = [...portalPhases];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reindexed = list.map((p, idx) => ({ ...p, sort_order: idx }));
    setPortalPhases(reindexed);
  };

  const handleDragDropPhase = (targetIdx: number) => {
    if (draggedPhaseIdx === null || draggedPhaseIdx === targetIdx) {
      setDraggedPhaseIdx(null);
      setDragOverPhaseIdx(null);
      return;
    }
    setPortalPhases(prev => {
      const copy = [...prev];
      const item = copy.splice(draggedPhaseIdx, 1)[0];
      copy.splice(targetIdx, 0, item);
      return copy.map((p, idx) => ({ ...p, sort_order: idx }));
    });
    setDraggedPhaseIdx(null);
    setDragOverPhaseIdx(null);
  };

  const handleUpdatePhase = (index: number, field: keyof PortalPhaseItem, value: any) => {
    const updated = [...portalPhases];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    if (field === "status" && value === "completed" && !updated[index].completed_at) {
      updated[index].completed_at = new Date().toISOString();
    }
    setPortalPhases(updated);
  };

  // Presentation Linking Handlers
  const handleAddPresentationToPhase = (phaseIndex: number) => {
    if (presentationsList.length === 0) {
      setAlert({ type: "error", message: "No presentation decks found. Create one in the Presentations tab first." });
      return;
    }

    const defaultPres = presentationsList[0];
    const currentLinks = portalPhases[phaseIndex].presentations || [];
    const versionNumber = currentLinks.length + 1;

    const newLink: PhasePresentationItem = {
      presentation_id: defaultPres.id,
      version_label: `v${versionNumber} - Presentation`,
      is_current_version: currentLinks.length === 0,
      deck_title: defaultPres.title,
      client_name: defaultPres.client_name,
      token: defaultPres.token
    };

    const updated = [...portalPhases];
    updated[phaseIndex].presentations = [...currentLinks, newLink];
    setPortalPhases(updated);
  };

  const handleRemovePresentationFromPhase = (phaseIndex: number, presIndex: number) => {
    const updated = [...portalPhases];
    const currentLinks = updated[phaseIndex].presentations || [];
    updated[phaseIndex].presentations = currentLinks.filter((_, idx) => idx !== presIndex);
    setPortalPhases(updated);
  };

  const handleUpdatePhasePresentation = (
    phaseIndex: number, 
    presIndex: number, 
    field: keyof PhasePresentationItem, 
    value: any
  ) => {
    const updated = [...portalPhases];
    const currentLinks = [...(updated[phaseIndex].presentations || [])];
    
    if (field === "presentation_id") {
      const selected = presentationsList.find(p => p.id === value);
      currentLinks[presIndex] = {
        ...currentLinks[presIndex],
        presentation_id: value,
        deck_title: selected?.title,
        client_name: selected?.client_name,
        token: selected?.token
      };
    } else if (field === "is_current_version" && value === true) {
      // Set all others in this phase to false
      currentLinks.forEach((item, idx) => {
        item.is_current_version = idx === presIndex;
      });
    } else {
      currentLinks[presIndex] = {
        ...currentLinks[presIndex],
        [field]: value
      };
    }

    updated[phaseIndex].presentations = currentLinks;
    setPortalPhases(updated);
  };

  // Invoice Items Handlers (Connected to Pricing)
  const handleAddInvoiceItemFromPricing = (catalogItem: any) => {
    const newItem: PortalInvoiceItem = {
      id: crypto.randomUUID(),
      name: catalogItem.name,
      description: catalogItem.description || "",
      unit_price: Number(catalogItem.price) || 0,
      quantity: 1,
      has_addons: !!catalogItem.has_addons,
      addon_price: Number(catalogItem.addon_price || 0),
      additional_units: 0,
      type: catalogItem.type || "service"
    };
    const updated = [...portalInvoiceItems, newItem];
    setPortalInvoiceItems(updated);
    setPricingSearch("");
    setShowPricingDropdown(false);
    setAlert({ type: "success", message: `Added "${catalogItem.name}" to scope breakdown!` });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAddCustomInvoiceItem = () => {
    const newItem: PortalInvoiceItem = {
      id: crypto.randomUUID(),
      name: "Custom Deliverable",
      description: "Scope and deliverable specifications.",
      unit_price: 0,
      quantity: 1,
      has_addons: false,
      addon_price: 0,
      additional_units: 0,
      type: "custom"
    };
    setPortalInvoiceItems([...portalInvoiceItems, newItem]);
  };

  const handleUpdateInvoiceItem = (index: number, field: keyof PortalInvoiceItem, value: any) => {
    const updated = [...portalInvoiceItems];
    updated[index] = {
      ...updated[index],
      [field]: field === "unit_price" || field === "quantity" || field === "addon_price" || field === "additional_units"
        ? (value === "" ? 0 : Number(value)) 
        : value
    };
    setPortalInvoiceItems(updated);
  };

  const handleStepQuantity = (index: number, delta: number) => {
    const updated = [...portalInvoiceItems];
    const current = updated[index].quantity || 1;
    const nextVal = Math.max(1, current + delta);
    updated[index] = { ...updated[index], quantity: nextVal };
    setPortalInvoiceItems(updated);
  };

  const handleStepAddons = (index: number, delta: number) => {
    const updated = [...portalInvoiceItems];
    const current = updated[index].additional_units || 0;
    const nextVal = Math.max(0, current + delta);
    updated[index] = { ...updated[index], additional_units: nextVal };
    setPortalInvoiceItems(updated);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setPortalInvoiceItems(portalInvoiceItems.filter((_, idx) => idx !== index));
  };

  const calculateLineItemTotal = (item: PortalInvoiceItem) => {
    const base = Number(item.unit_price || 0);
    const addons = (Number(item.additional_units || 0)) * (Number(item.addon_price || 0));
    return (base + addons) * (Number(item.quantity || 1));
  };

  const handleAutoCalculateBudget = () => {
    const total = portalInvoiceItems.reduce((acc, item) => acc + calculateLineItemTotal(item), 0);
    setEditingPortal(prev => prev ? ({
      ...prev,
      budget_total: total,
      deposit_paid: prev.invoice_status === "Paid in Full" ? total : prev.invoice_status === "Deposit Paid" ? Math.round(total / 2) : prev.deposit_paid
    }) : null);
    setAlert({ type: "success", message: `Contract budget updated to ₦${total.toLocaleString()} from scope items!` });
    setTimeout(() => setAlert(null), 3000);
  };

  // Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const filename = `client-logo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = `portals/${filename}`;

      const { data, error } = await supabase.storage
        .from("showcase")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("showcase")
        .getPublicUrl(filePath);

      setEditingPortal(prev => ({
        ...prev,
        client_logo_url: publicUrlData.publicUrl
      }));
      setAlert({ type: "success", message: "Client logo uploaded successfully!" });
    } catch (err: any) {
      console.warn("Direct upload error, compressing locally:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditingPortal(prev => ({
          ...prev,
          client_logo_url: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Deliverable File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFile(true);
      setPortalUploadProgress({ current: 0, total: files.length });
      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = `portal-deliverables/${filename}`;

        let fileUrl = "";
        try {
          const { data, error } = await supabase.storage
            .from("showcase")
            .upload(filePath, file, { cacheControl: "3600", upsert: true });

          if (error) throw error;
          const { data: urlData } = supabase.storage.from("showcase").getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
        } catch (storageErr) {
          // Local data-uri fallback
          fileUrl = await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = (ev) => resolve(ev.target?.result as string);
            r.readAsDataURL(file);
          });
        }

        const sizeKb = (file.size / 1024).toFixed(0);
        const formattedSize = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${sizeKb} KB`;

        const newItem: PortalFileItem = {
          filename: file.name,
          file_url: fileUrl,
          category: newFileCategory,
          file_size: formattedSize,
          created_at: new Date().toISOString()
        };

        // Real-time render: Immediately append as each file finishes!
        setPortalFiles(prev => [...prev, newItem]);
        successCount++;
        setPortalUploadProgress({ current: i + 1, total: files.length });
      }

      setAlert({ type: "success", message: `Added ${successCount} deliverable file(s).` });
    } catch (err: any) {
      console.error("File upload error:", err);
      setAlert({ type: "error", message: "Failed to upload file(s)." });
    } finally {
      setUploadingFile(false);
      setPortalUploadProgress(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setPortalFiles(portalFiles.filter((_, idx) => idx !== index));
  };

  // Client Notification Handlers
  const handleOpenNotifyModal = (
    portal: ClientPortalItem | Partial<ClientPortalItem>,
    type: "presentation_ready" | "milestone_update" | "files_released" | "custom_message",
    phase?: PortalPhaseItem,
    presentation?: any
  ) => {
    let headline = "Project Update Available";
    let presentationToken: string | undefined = undefined;

    if (type === "presentation_ready") {
      const selectedPres = presentation?.presentation_id 
        ? presentationsList.find(p => p.id === presentation.presentation_id) 
        : null;
      headline = presentation?.version_label 
        ? `New Concepts Ready: ${presentation.version_label}`
        : "New Design Presentation Ready for Review";
      presentationToken = selectedPres?.token;
    } else if (type === "milestone_update") {
      headline = phase?.title 
        ? `Milestone Update: ${phase.title}`
        : "Project Milestone Advanced";
    } else if (type === "files_released") {
      headline = "Final Deliverable Asset Package Released";
    }

    setNotifyTarget({
      portal,
      phase,
      presentation,
      type,
      headline,
      presentationToken
    });
    setNotifyCustomMessage("");
    setNotifyModalOpen(true);
  };

  const handleSendNotification = async () => {
    if (!notifyTarget || !notifyTarget.portal.client_email) {
      setAlert({ type: "error", message: "Client email is required to send notifications." });
      return;
    }

    try {
      setSendingNotification(true);
      const res = await fetch("/api/portal-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: notifyTarget.portal.client_email,
          clientName: notifyTarget.portal.client_name,
          projectTitle: notifyTarget.portal.project_title,
          token: notifyTarget.portal.token,
          type: notifyTarget.type,
          headline: notifyTarget.headline,
          message: notifyCustomMessage,
          presentationToken: notifyTarget.presentationToken
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send email");
      }

      setAlert({ type: "success", message: `Notification email sent to ${notifyTarget.portal.client_email}!` });
      setNotifyModalOpen(false);
      setTimeout(() => setAlert(null), 4000);
    } catch (err: any) {
      console.error("Notify error:", err);
      setAlert({ type: "error", message: err.message || "Failed to send notification email." });
    } finally {
      setSendingNotification(false);
    }
  };

  // Save Portal & Relations to Database
  const handleSavePortal = async () => {
    if (!editingPortal?.client_name?.trim() || !editingPortal?.project_title?.trim()) {
      setAlert({ type: "error", message: "Client Name and Project Title are required." });
      return;
    }

    try {
      setSaving(true);
      const isNew = !editingPortal.id;
      const portalId = editingPortal.id || crypto.randomUUID();

      const portalPayload = {
        id: portalId,
        client_name: editingPortal.client_name.trim(),
        project_title: editingPortal.project_title.trim(),
        token: editingPortal.token?.trim() || "portal-" + Math.random().toString(36).substring(2, 9),
        client_logo_url: editingPortal.client_logo_url || null,
        client_email: editingPortal.client_email?.trim() || null,
        status: editingPortal.status || "In Progress",
        start_date: editingPortal.start_date || null,
        target_delivery_date: editingPortal.target_delivery_date || null,
        budget_total: Number(editingPortal.budget_total) || 0,
        deposit_paid: Number(editingPortal.deposit_paid) || 0,
        invoice_status: editingPortal.invoice_status || "Deposit Paid",
        invoice_items: portalInvoiceItems || [],
        created_at: editingPortal.created_at || new Date().toISOString()
      };

      // 1. Upsert Client Portal Row
      let dbSuccess = false;
      try {
        const { error: portalError } = await supabase
          .from("client_portals")
          .upsert([portalPayload]);

        if (portalError) throw portalError;
        dbSuccess = true;
      } catch (err) {
        console.warn("Direct client_portals upsert notice (fallback cached):", err);
      }

      // 2. Sync Phases and Linked Presentations
      if (dbSuccess) {
        try {
          // Delete existing child phases to cleanly replace
          await supabase.from("portal_phases").delete().eq("portal_id", portalId);

          for (let i = 0; i < portalPhases.length; i++) {
            const phase = portalPhases[i];
            const phaseId = phase.id || crypto.randomUUID();

            const { error: phaseErr } = await supabase
              .from("portal_phases")
              .insert([{
                id: phaseId,
                portal_id: portalId,
                title: phase.title,
                description: phase.description,
                status: phase.status,
                sort_order: i,
                completed_at: phase.status === "completed" ? (phase.completed_at || new Date().toISOString()) : null
              }]);

            if (phaseErr) throw phaseErr;

            // Insert linked presentations
            if (phase.presentations && phase.presentations.length > 0) {
              const presPayload = phase.presentations.map((p, pIdx) => ({
                phase_id: phaseId,
                presentation_id: p.presentation_id,
                version_label: p.version_label || `v${pIdx + 1}`,
                is_current_version: !!p.is_current_version,
                sort_order: pIdx
              }));

              await supabase.from("phase_presentations").insert(presPayload);
            }
          }

          // Sync Files
          await supabase.from("portal_files").delete().eq("portal_id", portalId);
          if (portalFiles.length > 0) {
            const filesPayload = portalFiles.map(f => ({
              portal_id: portalId,
              filename: f.filename,
              file_url: f.file_url,
              category: f.category || "Deliverables",
              file_size: f.file_size || null
            }));
            await supabase.from("portal_files").insert(filesPayload);
          }
        } catch (childErr) {
          console.warn("Child relation sync error:", childErr);
        }
      }

      // 3. Local Cache Update
      const fullPortalObj: ClientPortalItem = {
        ...portalPayload,
        phases: portalPhases,
        files: portalFiles,
        invoice_items: portalInvoiceItems
      };

      const updatedPortals = isNew
        ? [fullPortalObj, ...portals]
        : portals.map(p => p.id === portalId ? fullPortalObj : p);

      setPortals(updatedPortals);
      localStorage.setItem("tochay_offline_client_portals", JSON.stringify(updatedPortals));
      localStorage.setItem(`tochay_offline_invoice_items_${portalId}`, JSON.stringify(portalInvoiceItems));

      setAlert({
        type: "success",
        message: isNew ? "Client Portal created successfully!" : "Client Portal updated successfully!"
      });
      setShowModal(false);
    } catch (err: any) {
      console.error("Save portal error:", err);
      setAlert({ type: "error", message: "Failed to save client portal." });
    } finally {
      setSaving(false);
    }
  };

  // Delete Portal
  const handleDeletePortal = async (id: string, clientName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete the portal for "${clientName}"?`)) {
      return;
    }

    try {
      const updated = portals.filter(p => p.id !== id);
      setPortals(updated);
      localStorage.setItem("tochay_offline_client_portals", JSON.stringify(updated));

      try {
        await supabase.from("client_portals").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete failed, local state updated.");
      }

      setAlert({ type: "success", message: `Portal for "${clientName}" deleted.` });
    } catch (err) {
      setAlert({ type: "error", message: "Failed to delete portal." });
    }
  };

  // Filtered list
  const filteredPortals = portals.filter(portal => {
    const matchesSearch = 
      portal.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.token.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || portal.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Alert */}
      {alert && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-sans font-medium transition-all shadow-sm ${
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-zinc-400 hover:text-zinc-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 select-none">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-sans font-bold text-xl text-zinc-950">Client Project Portals</h2>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {portals.length} Active
            </span>
          </div>
          <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">
            Manage client project trackers, dynamic versioned roadmaps, and embedded presentation decks
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-sans font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Client Portal</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, project, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {["all", "In Progress", "In Review", "Completed", "Onboarding"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl font-sans font-semibold text-[11px] whitespace-nowrap transition-all cursor-pointer border ${
                statusFilter === status
                  ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                  : "bg-zinc-50 text-zinc-500 hover:text-zinc-950 border-zinc-200"
              }`}
            >
              {status === "all" ? "All Portals" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Portals Grid */}
      {loading ? (
        <div className="w-full py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
          <span className="font-sans font-medium text-xs text-zinc-400">Loading client portals...</span>
        </div>
      ) : filteredPortals.length === 0 ? (
        <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center select-none bg-zinc-50/50">
          <Layers className="w-10 h-10 text-zinc-300 mb-3" />
          <span className="font-sans font-bold text-zinc-600 text-sm">No Client Portals Found</span>
          <p className="font-sans font-normal text-zinc-400 text-xs max-w-sm mt-1 leading-normal">
            Create a private project portal to provide your client with live roadmap tracking, embedded presentations, and deliverable downloads.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 text-white font-sans font-bold text-xs hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Portal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredPortals.map((portal) => {
            const completedPhases = (portal.phases || []).filter(p => p.status === "completed").length;
            const totalPhases = (portal.phases || []).length;
            const progressPercent = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
            const activePhase = (portal.phases || []).find(p => p.status === "active");

            return (
              <div
                key={portal.id}
                className="bg-white border border-zinc-200/90 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4 group relative"
              >
                {/* Card Header: Client Info & Status */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                        <img
                          src="/images/toflogoblack.png"
                          alt="TY Studio"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-sm text-zinc-950 leading-tight">
                          {portal.client_name}
                        </h3>
                        <p className="font-sans font-medium text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                          {portal.project_title}
                        </p>
                      </div>
                    </div>

                    <span className={`font-sans font-bold text-[10px] px-2.5 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                      portal.status === "Completed"
                        ? "bg-emerald-100 text-emerald-900"
                        : portal.status === "In Review"
                        ? "bg-amber-100 text-amber-900"
                        : portal.status === "On Hold"
                        ? "bg-zinc-100 text-zinc-600"
                        : "bg-blue-100 text-blue-900"
                    }`}>
                      {portal.status}
                    </span>
                  </div>

                  {/* Active Phase Badge */}
                  <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100 flex items-center justify-between gap-2">
                    <span className="font-sans font-semibold text-[11px] text-zinc-500">Current Phase:</span>
                    <span className="font-sans font-bold text-[11px] text-zinc-950 truncate max-w-[160px]">
                      {activePhase ? activePhase.title : "None Active"}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-sans">
                      <span className="font-medium text-zinc-400">Roadmap Progress</span>
                      <span className="font-bold text-zinc-900">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-950 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Dates & Deliverables Info */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[10px] font-mono text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>Due: {portal.target_delivery_date ? new Date(portal.target_delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-zinc-400" />
                      <span>{portal.files?.length || 0} Assets</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => handleCopyLink(portal.token)}
                    title="Copy Shareable Client Link"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-sans font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    {copiedToken === portal.token ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={`/portal/${portal.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Preview Client Portal"
                      className="p-2 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleOpenNotifyModal(portal, "custom_message")}
                      title={portal.client_email ? `Notify Client (${portal.client_email})` : "Send Client Notification"}
                      className="p-2 rounded-lg text-zinc-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(portal)}
                      title="Edit Portal & Roadmap"
                      className="p-2 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeletePortal(portal.id, portal.client_name)}
                      title="Delete Portal"
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-PAGE CLIENT PORTAL EDITOR */}
      {showModal && editingPortal && (
        <div data-lenis-prevent className="fixed inset-0 z-[70] bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans overflow-y-auto animate-fade-in select-none">
          
          {/* Top Sticky Header & Navigation Tabs Bar */}
          <header className="w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md select-none sticky top-0 z-50 shadow-2xs">
            <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-sans font-bold text-xs text-zinc-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Portals</span>
                </button>

                <div className="flex flex-col">
                  <h2 className="font-sans font-bold text-sm sm:text-base text-zinc-950">
                    {editingPortal.id ? `Edit Portal: ${editingPortal.client_name}` : "Create Client Project Portal"}
                  </h2>
                  <span className="hidden sm:inline font-sans text-[11px] text-zinc-400">
                    Configure project milestones, versioned presentations, and downloadable deliverable assets
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-sans font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePortal}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-sans font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Client Portal</span>
                </button>
              </div>
            </div>

            {/* Sub-Header Tabs */}
            <div className="flex items-center gap-2 px-4 sm:px-8 border-t border-zinc-100 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveModalTab("details")}
                className={`py-2.5 px-3 font-sans font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  activeModalTab === "details"
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                1. Project Details
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab("roadmap")}
                className={`py-2.5 px-3 font-sans font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === "roadmap"
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <span>2. Roadmap & Presentations</span>
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-600">
                  {portalPhases.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab("files")}
                className={`py-2.5 px-3 font-sans font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === "files"
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <span>3. Final Deliverables</span>
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-600">
                  {portalFiles.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab("financials")}
                className={`py-2.5 px-3 font-sans font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  activeModalTab === "financials"
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                4. Financials & Invoice
              </button>
            </div>
          </header>

          {/* Full Page Body */}
          <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-6">
              
              {/* TAB 1: PROJECT DETAILS */}
              {activeModalTab === "details" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-bold text-xs text-zinc-700">Client / Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Labs"
                      value={editingPortal.client_name || ""}
                      onChange={(e) => setEditingPortal({ ...editingPortal, client_name: e.target.value })}
                      className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-bold text-xs text-zinc-700">Project Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Full Brand Identity & Design System"
                      value={editingPortal.project_title || ""}
                      onChange={(e) => setEditingPortal({ ...editingPortal, project_title: e.target.value })}
                      className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-bold text-xs text-zinc-700">Custom Secret Token URL</label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-zinc-400">/portal/</span>
                      <input
                        type="text"
                        placeholder="unique-secret-token"
                        value={editingPortal.token || ""}
                        onChange={(e) => setEditingPortal({ ...editingPortal, token: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                        className="flex-grow px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-bold text-xs text-zinc-700">Project Overall Status</label>
                    <select
                      value={editingPortal.status || "In Progress"}
                      onChange={(e) => setEditingPortal({ ...editingPortal, status: e.target.value as any })}
                      className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                    >
                      <option value="Onboarding">Onboarding</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-bold text-xs text-zinc-700">Start Date</label>
                    <input
                      type="date"
                      value={editingPortal.start_date || ""}
                      onChange={(e) => setEditingPortal({ ...editingPortal, start_date: e.target.value })}
                      className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-bold text-xs text-zinc-700">Target Delivery Date (Countdown Target)</label>
                    <input
                      type="date"
                      value={editingPortal.target_delivery_date || ""}
                      onChange={(e) => setEditingPortal({ ...editingPortal, target_delivery_date: e.target.value })}
                      className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="font-sans font-bold text-xs text-zinc-700">Client Notification Email</label>
                      {editingPortal.client_email && (
                        <button
                          type="button"
                          onClick={() => handleOpenNotifyModal(editingPortal, "custom_message")}
                          className="text-[11px] font-sans font-bold text-zinc-900 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Send className="w-3 h-3 text-zinc-600" />
                          <span>Send Test / Update Notification</span>
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="e.g. client@company.com"
                        value={editingPortal.client_email || ""}
                        onChange={(e) => setEditingPortal({ ...editingPortal, client_email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                    <span className="font-sans text-[10px] text-zinc-400">
                      When set, you can 1-click notify the client whenever new milestones or design presentations are ready.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: ROADMAP PHASES & VERSIONED PRESENTATIONS */}
              {activeModalTab === "roadmap" && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-zinc-950">Dynamic Roadmap Phases</h4>
                      <p className="font-sans text-zinc-400 text-xs">
                        Configure project phases, mark active/completed status, and attach presentation versions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPhase}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 text-white font-sans font-bold text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Phase</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {portalPhases.map((phase, idx) => {
                      const isActive = phase.status === "active";
                      const isCompleted = phase.status === "completed";
                      const isInactive = phase.status === "inactive";

                      return (
                        <div
                          key={phase.id || idx}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", `${idx}`);
                            setDraggedPhaseIdx(idx);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverPhaseIdx(idx);
                          }}
                          onDragLeave={() => {
                            if (dragOverPhaseIdx === idx) setDragOverPhaseIdx(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDragDropPhase(idx);
                          }}
                          onDragEnd={() => {
                            setDraggedPhaseIdx(null);
                            setDragOverPhaseIdx(null);
                          }}
                          className={`border rounded-2xl p-4.5 transition-all flex flex-col gap-3.5 select-none ${
                            draggedPhaseIdx === idx
                              ? "opacity-40 border-dashed border-zinc-400 bg-zinc-50 scale-98"
                              : dragOverPhaseIdx === idx
                              ? "border-zinc-950 bg-zinc-100 shadow-sm scale-101"
                              : isActive
                              ? "border-zinc-950 bg-zinc-50/50 shadow-xs"
                              : isCompleted
                              ? "border-emerald-200 bg-emerald-50/20"
                              : "border-zinc-200 bg-white opacity-85 hover:opacity-100"
                          }`}
                        >
                          {/* Phase Header: Title, Order & Status Selector */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
                            <div className="flex items-center gap-2 flex-grow">
                              {/* Drag Grip */}
                              <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-700 shrink-0 p-0.5" title="Drag to reorder">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 shrink-0">
                                Phase {idx + 1}
                              </span>

                              <input
                                type="text"
                                value={phase.title}
                                onChange={(e) => handleUpdatePhase(idx, "title", e.target.value)}
                                placeholder="Phase Title (e.g. Concept Design)"
                                className="font-sans font-bold text-sm text-zinc-950 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-zinc-950 focus:outline-none px-1 py-0.5 flex-grow"
                              />
                            </div>

                            {/* Status Selector Pills */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePhase(idx, "status", "active")}
                                  className={`px-2.5 py-1 rounded-md font-sans font-bold text-[10px] transition-all cursor-pointer ${
                                    isActive
                                      ? "bg-zinc-950 text-white shadow-xs"
                                      : "text-zinc-500 hover:text-zinc-900"
                                  }`}
                                >
                                  Active (Vibrant)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePhase(idx, "status", "completed")}
                                  className={`px-2.5 py-1 rounded-md font-sans font-bold text-[10px] transition-all cursor-pointer ${
                                    isCompleted
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-zinc-500 hover:text-zinc-900"
                                  }`}
                                >
                                  Completed
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePhase(idx, "status", "inactive")}
                                  className={`px-2.5 py-1 rounded-md font-sans font-bold text-[10px] transition-all cursor-pointer ${
                                    isInactive
                                      ? "bg-zinc-400 text-white shadow-xs"
                                      : "text-zinc-500 hover:text-zinc-900"
                                  }`}
                                >
                                  Inactive (Faint)
                                </button>
                              </div>

                              {/* Notify Client, Move & Delete */}
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenNotifyModal(editingPortal || {}, "milestone_update", phase)}
                                  className="px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 font-sans font-bold text-[10px] transition-colors cursor-pointer inline-flex items-center gap-1"
                                  title="Notify Client of Milestone Status"
                                >
                                  <Bell className="w-3 h-3 text-zinc-500" />
                                  <span className="hidden xs:inline">Notify</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMovePhase(idx, "up")}
                                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === portalPhases.length - 1}
                                  onClick={() => handleMovePhase(idx, "down")}
                                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhase(idx)}
                                  className="p-1 rounded-md text-zinc-400 hover:text-red-600 cursor-pointer ml-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Phase Description */}
                          <input
                            type="text"
                            value={phase.description || ""}
                            onChange={(e) => handleUpdatePhase(idx, "description", e.target.value)}
                            placeholder="Brief milestone summary for the client..."
                            className="font-sans text-xs text-zinc-600 bg-white border border-zinc-200 rounded-xl px-3.5 py-2 focus:outline-none focus:border-zinc-950"
                          />

                          {/* Linked Presentations & Versions Sub-Section */}
                          <div className="bg-white rounded-xl p-3 border border-zinc-200/80 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-sans font-bold text-[11px] text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3 h-3 text-zinc-400" />
                                <span>Attached Presentation Decks / Versions</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAddPresentationToPhase(idx)}
                                className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-zinc-900 hover:text-amber-700 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Attach Presentation</span>
                              </button>
                            </div>

                            {(!phase.presentations || phase.presentations.length === 0) ? (
                              <p className="font-sans text-[11px] text-zinc-400 italic">
                                No presentation decks attached to this phase yet.
                              </p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {phase.presentations.map((pres, presIdx) => (
                                  <div
                                    key={presIdx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs"
                                  >
                                    <div className="flex flex-wrap items-center gap-2 flex-grow">
                                      {/* Version Label */}
                                      <input
                                        type="text"
                                        value={pres.version_label}
                                        onChange={(e) => handleUpdatePhasePresentation(idx, presIdx, "version_label", e.target.value)}
                                        placeholder="e.g. v1 Initial Concepts"
                                        className="font-sans font-semibold text-[11px] text-zinc-900 bg-white border border-zinc-200 rounded-md px-2 py-1 w-36 focus:outline-none focus:border-zinc-950"
                                      />

                                      {/* Deck Selector */}
                                      <select
                                        value={pres.presentation_id}
                                        onChange={(e) => handleUpdatePhasePresentation(idx, presIdx, "presentation_id", e.target.value)}
                                        className="font-sans text-[11px] text-zinc-900 bg-white border border-zinc-200 rounded-md px-2 py-1 focus:outline-none focus:border-zinc-950 flex-grow"
                                      >
                                        {presentationsList.map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.title} ({p.client_name})
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {/* Set as Active Review Version */}
                                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                        <input
                                          type="radio"
                                          name={`active_version_${idx}`}
                                          checked={!!pres.is_current_version}
                                          onChange={() => handleUpdatePhasePresentation(idx, presIdx, "is_current_version", true)}
                                          className="accent-zinc-950"
                                        />
                                        <span className="font-sans text-[10px] font-bold text-zinc-600">Active Review</span>
                                      </label>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenNotifyModal(editingPortal || {}, "presentation_ready", phase, pres)}
                                        className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 font-sans font-bold text-[10px] transition-colors cursor-pointer inline-flex items-center gap-1"
                                        title="Notify Client: Concepts Ready for Review"
                                      >
                                        <Send className="w-2.5 h-2.5 text-amber-700" />
                                        <span>Notify Client</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleRemovePresentationFromPhase(idx, presIdx)}
                                        className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: FINAL DELIVERABLES & FILES */}
              {activeModalTab === "files" && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-zinc-950">Final Deliverables & Downloads Hub</h4>
                      <p className="font-sans text-zinc-400 text-xs">
                        Upload final asset packages (SVG, PNG, PDF guidelines, font packages) available for client download.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={newFileCategory}
                        onChange={(e) => setNewFileCategory(e.target.value)}
                        className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none"
                      >
                        <option value="Logo Files">Logo Files</option>
                        <option value="Brand Guidelines">Brand Guidelines</option>
                        <option value="Typography & Fonts">Typography & Fonts</option>
                        <option value="Social & Collateral">Social & Collateral</option>
                        <option value="Production Packages">Production Packages</option>
                      </select>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 text-white font-sans font-bold text-xs hover:bg-zinc-800 transition-colors cursor-pointer">
                        {uploadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>Upload Files</span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {portalFiles.length === 0 ? (
                    <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center select-none bg-zinc-50/50">
                      <FolderOpen className="w-8 h-8 text-zinc-300 mb-2" />
                      <span className="font-sans font-semibold text-zinc-600 text-xs">No Deliverables Attached</span>
                      <p className="font-sans text-zinc-400 text-[11px] mt-0.5">
                        Uploaded assets will appear organized in the client portal's downloads library.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {portalFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div className="overflow-hidden">
                              <p className="font-sans font-bold text-zinc-900 truncate">{file.filename}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-sans text-[10px] text-zinc-500 font-medium px-1.5 py-0.2 rounded bg-zinc-200/80">
                                  {file.category}
                                </span>
                                {file.file_size && (
                                  <span className="font-mono text-[10px] text-zinc-400">{file.file_size}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FINANCIALS & INVOICE */}
              {activeModalTab === "financials" && (
                <div className="flex flex-col gap-6">
                  {/* Summary Metric Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans font-bold text-xs text-zinc-700">Contract Total Budget (₦)</label>
                      <input
                        type="number"
                        placeholder="e.g. 500000"
                        value={editingPortal.budget_total || ""}
                        onChange={(e) => setEditingPortal({ ...editingPortal, budget_total: Number(e.target.value) })}
                        className="px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans font-bold text-xs text-zinc-700">Deposit Amount Paid (₦)</label>
                      <input
                        type="number"
                        placeholder="e.g. 250000"
                        value={editingPortal.deposit_paid || ""}
                        onChange={(e) => setEditingPortal({ ...editingPortal, deposit_paid: Number(e.target.value) })}
                        className="px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans font-bold text-xs text-zinc-700">Payment Status</label>
                      <select
                        value={editingPortal.invoice_status || "Deposit Paid"}
                        onChange={(e) => {
                          const newStatus = e.target.value as any;
                          const autoDeposit = newStatus === "Paid in Full" 
                            ? (editingPortal.budget_total || 0) 
                            : newStatus === "Deposit Paid"
                            ? Math.round((editingPortal.budget_total || 0) / 2)
                            : editingPortal.deposit_paid;
                          setEditingPortal({ 
                            ...editingPortal, 
                            invoice_status: newStatus,
                            deposit_paid: autoDeposit
                          });
                        }}
                        className="px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 font-bold"
                      >
                        <option value="Deposit Paid">Deposit Paid (50%)</option>
                        <option value="Awaiting Balance">Awaiting Final Balance</option>
                        <option value="Paid in Full">Paid in Full (100% Settled)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-between p-3 rounded-xl bg-white border border-zinc-200/80 text-xs font-sans">
                      <span className="font-medium text-zinc-400 text-[11px]">Remaining Balance:</span>
                      <span className={`font-extrabold text-lg ${editingPortal.invoice_status === "Paid in Full" ? "text-emerald-700" : "text-zinc-950"}`}>
                        ₦{(editingPortal.invoice_status === "Paid in Full" ? 0 : Math.max(0, (editingPortal.budget_total || 0) - (editingPortal.deposit_paid || 0))).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* ITEMISED SCOPE & DELIVERABLES CONNECTED TO PRICING */}
                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
                      <div>
                        <h4 className="font-sans font-bold text-sm text-zinc-950 flex items-center gap-2">
                          <span>Itemized Deliverables & Scope</span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                            {portalInvoiceItems.length} Items
                          </span>
                        </h4>
                        <p className="font-sans text-xs text-zinc-400 mt-0.5">
                          Connected directly to your pricing catalog. Clients see this exact scope on their portal invoice.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {portalInvoiceItems.length > 0 && (
                          <button
                            type="button"
                            onClick={handleAutoCalculateBudget}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-sans font-bold text-xs transition-colors cursor-pointer"
                            title="Sum all line items into Contract Total"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Auto-Calculate Total (₦{portalInvoiceItems.reduce((acc, i) => acc + calculateLineItemTotal(i), 0).toLocaleString()})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleAddCustomInvoiceItem}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-sans font-bold text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Custom Item</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Pricing Search Combobox */}
                    <div className="relative" ref={pricingSearchContainerRef}>
                      <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 focus-within:border-zinc-950 focus-within:bg-white rounded-2xl px-4 py-3 transition-all shadow-xs">
                        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search & select from pricing catalog (e.g. Logo Design, ID Card, Social Media, Guidelines...)..."
                          value={pricingSearch}
                          onChange={(e) => {
                            setPricingSearch(e.target.value);
                            setShowPricingDropdown(true);
                          }}
                          onFocus={() => setShowPricingDropdown(true)}
                          className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs font-sans text-zinc-900 placeholder:text-zinc-400 p-0 shadow-none ring-0"
                        />
                        {pricingSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setPricingSearch("");
                              setShowPricingDropdown(false);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Results - Pure Solid White, High Z-Index 50 */}
                      {showPricingDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-zinc-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2 flex flex-col gap-1 ring-1 ring-black/5">
                          {catalogItems
                            .filter(item => 
                              !pricingSearch || 
                              item.name.toLowerCase().includes(pricingSearch.toLowerCase()) || 
                              (item.description && item.description.toLowerCase().includes(pricingSearch.toLowerCase())) ||
                              (item.category && item.category.toLowerCase().includes(pricingSearch.toLowerCase()))
                            )
                            .slice(0, 12)
                            .map((catItem) => (
                              <div
                                key={catItem.id}
                                onClick={() => handleAddInvoiceItemFromPricing(catItem)}
                                className="p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/80 flex items-center justify-between gap-3 cursor-pointer transition-all group bg-white"
                              >
                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <span className="font-sans font-bold text-xs text-zinc-950 group-hover:text-black">
                                      {catItem.name}
                                    </span>
                                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                                      {catItem.category}
                                    </span>
                                    {catItem.has_addons && (
                                      <span className="font-mono text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                                        +Add-ons
                                      </span>
                                    )}
                                  </div>
                                  {catItem.description && (
                                    <span className="font-sans text-[11px] text-zinc-400 truncate block">
                                      {catItem.description}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-sans font-bold text-xs text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">
                                    ₦{Number(catItem.price).toLocaleString()}
                                  </span>
                                  <span className="p-1 rounded-lg bg-zinc-950 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </div>
                            ))}

                          {catalogItems.filter(item => !pricingSearch || item.name.toLowerCase().includes(pricingSearch.toLowerCase())).length === 0 && (
                            <div className="p-4 text-center text-xs text-zinc-400 font-sans">
                              No matching services found in catalog. Use "+ Custom Item" above.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Line Items List */}
                    {portalInvoiceItems.length === 0 ? (
                      <div className="border border-dashed border-zinc-200 rounded-2xl py-8 flex flex-col items-center justify-center text-center p-6 bg-zinc-50/50">
                        <FileText className="w-7 h-7 text-zinc-300 mb-2" />
                        <span className="font-sans font-bold text-zinc-600 text-xs">No Deliverables in Scope Yet</span>
                        <p className="font-sans text-[11px] text-zinc-400 mt-0.5 max-w-sm">
                          Use the search bar above to search and select packages or services directly from your pricing rate card.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {portalInvoiceItems.map((item, idx) => {
                          const lineTotal = calculateLineItemTotal(item);
                          return (
                            <div
                              key={item.id || idx}
                              className="p-4 rounded-2xl border border-zinc-200/90 bg-white shadow-2xs hover:border-zinc-300 transition-all flex flex-col gap-3"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                {/* Deliverable Title & Description (Clean seamless inputs without box outlines) */}
                                <div className="flex-grow flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold text-zinc-400 select-none">
                                      #{idx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) => handleUpdateInvoiceItem(idx, "name", e.target.value)}
                                      placeholder="Service / Deliverable Title"
                                      className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-zinc-950 font-sans font-bold text-xs p-0 placeholder:text-zinc-400"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={item.description || ""}
                                    onChange={(e) => handleUpdateInvoiceItem(idx, "description", e.target.value)}
                                    placeholder="Deliverable specifications / inclusions notes..."
                                    className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-zinc-500 font-sans text-[11px] p-0 placeholder:text-zinc-400 pl-4"
                                  />
                                </div>

                                {/* Controls: Qty Stepper, Rate, Total, Trash */}
                                <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                                  {/* Qty Stepper with Plus / Minus */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-sans text-[11px] text-zinc-400 font-medium select-none">Qty:</span>
                                    <div className="flex items-center bg-zinc-100/80 rounded-xl px-1.5 py-1 gap-2 border border-zinc-200/60">
                                      <button
                                        type="button"
                                        onClick={() => handleStepQuantity(idx, -1)}
                                        className="w-5 h-5 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="font-mono font-bold text-xs text-zinc-950 min-w-[14px] text-center select-none">
                                        {item.quantity || 1}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleStepQuantity(idx, 1)}
                                        className="w-5 h-5 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-white transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Unit Rate */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-sans text-[11px] text-zinc-400 font-medium select-none">Rate:</span>
                                    <div className="flex items-center bg-zinc-100/80 rounded-xl px-2.5 py-1 gap-1 border border-zinc-200/60">
                                      <span className="font-sans text-xs text-zinc-400 font-medium select-none">₦</span>
                                      <input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={(e) => handleUpdateInvoiceItem(idx, "unit_price", e.target.value)}
                                        className="w-20 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 font-mono text-xs text-zinc-900 font-bold text-right p-0"
                                      />
                                    </div>
                                  </div>

                                  {/* Line Total */}
                                  <div className="w-24 text-right">
                                    <span className="font-sans font-extrabold text-xs text-zinc-950 block">
                                      ₦{lineTotal.toLocaleString()}
                                    </span>
                                  </div>

                                  {/* Remove Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInvoiceItem(idx)}
                                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                    title="Remove Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Addon Inclusions multiplier selector (if item has_addons) */}
                              {item.has_addons && (
                                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-zinc-100 text-xs font-sans">
                                  <span className="font-sans font-bold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                                    Add-ons (+₦{(item.addon_price || 0).toLocaleString()}/unit):
                                  </span>
                                  <div className="flex items-center bg-zinc-50 rounded-lg px-1.5 py-0.5 gap-2 border border-zinc-200">
                                    <button
                                      type="button"
                                      onClick={() => handleStepAddons(idx, -1)}
                                      className="text-zinc-500 hover:text-zinc-950 focus:outline-none cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-mono font-bold text-xs text-zinc-950 min-w-[14px] text-center select-none">
                                      +{item.additional_units || 0}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleStepAddons(idx, 1)}
                                      className="text-zinc-500 hover:text-zinc-950 focus:outline-none cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {(item.additional_units || 0) > 0 && (
                                    <span className="font-mono font-bold text-[11px] text-emerald-700">
                                      (+₦{((item.additional_units || 0) * (item.addon_price || 0)).toLocaleString()})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="p-6 mt-6 border-t border-zinc-100 flex items-center justify-end gap-3 select-none">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-sans font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePortal}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-sans font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Client Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CLIENT NOTIFY MODAL */}
      {notifyModalOpen && notifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-zinc-200 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Top Bar */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-sm text-zinc-950">
                    Send Client Email Notification
                  </h3>
                  <p className="font-sans text-[11px] text-zinc-400">
                    {notifyTarget.portal.client_name} &bull; {notifyTarget.portal.project_title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setNotifyModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {/* Recipient Email Info */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-zinc-700">Recipient Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={notifyTarget.portal.client_email || ""}
                    onChange={(e) => {
                      const newEmail = e.target.value;
                      setNotifyTarget(prev => prev ? ({
                        ...prev,
                        portal: { ...prev.portal, client_email: newEmail }
                      }) : null);
                      if (editingPortal) {
                        setEditingPortal(prev => prev ? ({ ...prev, client_email: newEmail }) : null);
                      }
                    }}
                    placeholder="e.g. client@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />
                </div>
                {!notifyTarget.portal.client_email && (
                  <span className="font-sans text-[11px] text-amber-700 font-semibold">
                    ⚠️ Please enter an email address for the client before sending.
                  </span>
                )}
              </div>

              {/* Notification Type Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-zinc-700">Notification Category</label>
                <select
                  value={notifyTarget.type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    let headline = "Project Update Available";
                    if (newType === "presentation_ready") headline = "New Design Presentation Ready for Review";
                    else if (newType === "milestone_update") headline = "Milestone Roadmap Progress Update";
                    else if (newType === "files_released") headline = "Final Deliverable Asset Package Released";
                    setNotifyTarget(prev => prev ? ({ ...prev, type: newType, headline }) : null);
                  }}
                  className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                >
                  <option value="presentation_ready">Design Concepts / Presentation Ready for Review</option>
                  <option value="milestone_update">Milestone Roadmap Progress Update</option>
                  <option value="files_released">Final Deliverable Asset Package Released</option>
                  <option value="custom_message">Custom Studio Update</option>
                </select>
              </div>

              {/* Headline / Subject Preview */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-zinc-700">Email Headline / Subject</label>
                <input
                  type="text"
                  value={notifyTarget.headline}
                  onChange={(e) => setNotifyTarget(prev => prev ? ({ ...prev, headline: e.target.value }) : null)}
                  className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 font-semibold"
                />
              </div>

              {/* Optional Personal Note */}
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-zinc-700">
                  Personal Message from TY Studio <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notifyCustomMessage}
                  onChange={(e) => setNotifyCustomMessage(e.target.value)}
                  placeholder="e.g. Please take a look at the attached v1 concepts and share your feedback on typography & color palettes..."
                  className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setNotifyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-zinc-500 hover:text-zinc-900 font-sans font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendNotification}
                disabled={sendingNotification || !notifyTarget.portal.client_email}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-sans font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {sendingNotification ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Notification Email</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
