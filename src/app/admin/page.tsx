"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import FormBuilderTab from "@/components/admin/FormBuilderTab";
import { 
  Lock, 
  FolderKanban, 
  Tag, 
  Mail, 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  LogOut, 
  Save, 
  Check, 
  AlertCircle,
  Percent,
  X,
  CreditCard,
  Building,
  DollarSign,
  Eye,
  ChevronUp,
  ChevronDown,
  FileText,
  Upload,
  Loader2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ProjectItem {
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
  media: any;
  subtitle?: string;
  cover_image_url?: string;
  summary_text?: string;
  full_text?: string;
  position?: number;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  has_addons?: boolean;
  addon_price?: number;
}

interface CardItem {
  id: string;
  name: string;
  tier: string;
  category: string;
  price: number;
  description?: string;
  has_addons?: boolean;
  addon_price?: number;
}

interface InquiryItem {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

interface CouponItem {
  id: string;
  code: string;
  type: string;
  value: number;
  expires_at?: string | null;
}

interface CardServiceItem {
  id: string;
  card_id: string;
  service_id: string;
  custom_name?: string | null;
  price_override?: number | null;
  master_services?: {
    name: string;
    price: number;
  } | null;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"site" | "portfolio" | "pricing" | "inquiries" | "settings" | "forms">("site");

  // Database datasets state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [cardServiceItems, setCardServiceItems] = useState<CardServiceItem[]>([]);
  const [showcaseImages, setShowcaseImages] = useState<{ id: string; url_path: string; position: number }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImagePosition, setNewImagePosition] = useState<number>(1);
  const [uploading, setUploading] = useState(false);
  const [projectUploading, setProjectUploading] = useState(false);
  const [bankSettings, setBankSettings] = useState({
    id: "",
    bank_name: "",
    account_number: "",
    account_name: "",
    contact_email: "",
    contact_phone: "",
    legal_footer: "",
    slideshow_interval: 2500
  });

  // Action status/alerts
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Editor states
  const [pricingActiveSubTab, setPricingActiveSubTab] = useState<"packages" | "services" | "coupons">("packages");
  const [editingProject, setEditingProject] = useState<Partial<ProjectItem> | null>(null);
  const [projectShowcaseImages, setProjectShowcaseImages] = useState<any[]>([]);
  const [isProjectsOrderDirty, setIsProjectsOrderDirty] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [editingCard, setEditingCard] = useState<Partial<CardItem> | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Partial<CouponItem> | null>(null);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const isMounted = useRef(false);

  // Persist admin panel navigation tabs across reloads to avoid UI layout reset confusion
  useEffect(() => {
    const savedTab = localStorage.getItem("tochay_admin_active_tab");
    if (savedTab === "site" || savedTab === "portfolio" || savedTab === "pricing" || savedTab === "inquiries" || savedTab === "settings" || savedTab === "forms") {
      setActiveTab(savedTab as any);
    }
    const savedSubTab = localStorage.getItem("tochay_admin_pricing_sub_tab");
    if (savedSubTab === "packages" || savedSubTab === "services" || savedSubTab === "coupons") {
      setPricingActiveSubTab(savedSubTab);
    }
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      localStorage.setItem("tochay_admin_active_tab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isMounted.current) {
      localStorage.setItem("tochay_admin_pricing_sub_tab", pricingActiveSubTab);
    }
  }, [pricingActiveSubTab]);
  const [showInclusionsModal, setShowInclusionsModal] = useState(false);
  
  const [inclusionsCardId, setInclusionsCardId] = useState<string | null>(null);
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<string>("");

  // Real-time UTC clock
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(
        d.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC"
        }) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check existing Supabase auth session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setIsAuthenticated(true);
      } else {
        // Look up local storage fallback session
        const localSession = localStorage.getItem("tochay_admin_bypass");
        if (localSession === "active") {
          setIsAuthenticated(true);
        }
      }
    };
    checkSession();
  }, []);

  // Fetch admin database records
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAllData = async () => {
      // 1. Projects
      try {
        const { data: dbProjects } = await supabase
          .from("portfolio_projects")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: false });
        if (dbProjects) setProjects(dbProjects);
      } catch (err) {
        console.error("Failed to load projects:", err);
      }

      // 2. Services
      try {
        const { data: dbServices } = await supabase
          .from("master_services")
          .select("*")
          .order("price", { ascending: false });
        if (dbServices) setServices(dbServices);
      } catch (err) {
        console.error("Failed to load master services:", err);
      }

      // 3. Suite Cards
      try {
        const { data: dbCards } = await supabase
          .from("service_cards")
          .select("*")
          .order("category");
        if (dbCards) setCards(dbCards);
      } catch (err) {
        console.error("Failed to load suite cards:", err);
      }

      // 4. Contact Inquiries
      try {
        const { data: dbInquiries } = await supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false });
        if (dbInquiries) setInquiries(dbInquiries);
      } catch (err) {
        console.error("Failed to load inquiries:", err);
      }

      // 5. Discount Promo Coupons
      try {
        const { data: dbCoupons } = await supabase
          .from("discount_codes")
          .select("*")
          .order("code");
        if (dbCoupons) setCoupons(dbCoupons);
      } catch (err) {
        console.error("Failed to load coupons:", err);
      }

      // 5b. Card Service Inclusions
      try {
        const { data: dbItems } = await supabase
          .from("card_service_items")
          .select("*, master_services(name, price)");
        if (dbItems) setCardServiceItems(dbItems as any);
      } catch (err) {
        console.error("Failed to load card inclusions:", err);
      }

      // 6. Site Settings
      try {
        const { data: dbSettings } = await supabase
          .from("site_settings")
          .select("*")
          .limit(1)
          .maybeSingle();
        if (dbSettings) {
          setBankSettings({
            id: dbSettings.id,
            bank_name: dbSettings.bank_name || "",
            account_number: dbSettings.account_number || "",
            account_name: dbSettings.account_name || "",
            contact_email: dbSettings.contact_email || "",
            contact_phone: dbSettings.contact_phone || "",
            legal_footer: dbSettings.legal_footer || "",
            slideshow_interval: dbSettings.slideshow_interval || 2500
          });
        }
      } catch (err) {
        console.error("Failed to load site settings:", err);
      }

      // 7. Showcase Slide Images
      try {
        const { data: dbShowcase } = await supabase
          .from("hero_slideshow_images")
          .select("*")
          .order("position", { ascending: true });
        if (dbShowcase && dbShowcase.length > 0) {
          setShowcaseImages(dbShowcase);
          const maxPos = dbShowcase.reduce((max, img) => img.position > max ? img.position : max, 0);
          setNewImagePosition(maxPos + 1);
        } else {
          const localData = localStorage.getItem("tochay_offline_showcase_images");
          if (localData) {
            const parsed = JSON.parse(localData);
            setShowcaseImages(parsed);
            const maxPos = parsed.reduce((max: number, img: any) => img.position > max ? img.position : max, 0);
            setNewImagePosition(maxPos + 1);
          }
        }
      } catch (err) {
        console.error("Failed to load showcase images from Supabase, checking local cache fallback:", err);
        const localData = localStorage.getItem("tochay_offline_showcase_images");
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            setShowcaseImages(parsed);
            const maxPos = parsed.reduce((max: number, img: any) => img.position > max ? img.position : max, 0);
            setNewImagePosition(maxPos + 1);
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    fetchAllData();
  }, [isAuthenticated]);

  // Alert dismisser timer
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  // Log in credentials verify
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      // Local development bypass passcode option
      if (password === "tochay2026" || password === "TOCHAYADMIN") {
        setIsAuthenticated(true);
        localStorage.setItem("tochay_admin_bypass", "active");
        setAuthLoading(false);
        return;
      }

      // Live Supabase Authenticate
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setAuthError(err.message || "Invalid email credentials or bypass password");
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out log out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("tochay_admin_bypass");
    setIsAuthenticated(false);
  };

  const handleEditProjectClick = async (project: ProjectItem) => {
    setEditingProject({
      ...project,
      subtitle: project.subtitle || project.tagline || "",
      cover_image_url: project.cover_image_url || project.image || "",
      summary_text: project.summary_text || project.about || "",
      full_text: project.full_text || "",
      media: typeof project.media === "string" ? project.media : JSON.stringify(project.media, null, 2)
    });

    try {
      const { data, error } = await supabase
        .from("showcase_images")
        .select("*")
        .eq("project_id", project.id)
        .order("display_order", { ascending: true });
      if (!error && data) {
        setProjectShowcaseImages(data);
      } else {
        setProjectShowcaseImages([]);
      }
    } catch (err) {
      console.error("Failed to load showcase images:", err);
      setProjectShowcaseImages([]);
    }
    setShowProjectModal(true);
  };

  // Mutators: Save Portfolio Case Study
  const handleSaveProject = async () => {
    if (!editingProject?.title) {
      setAlert({ type: "error", message: "Project title is required." });
      return;
    }

    const titleStr = editingProject.title.trim();
    const slugStr = (editingProject.slug || titleStr)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");

    try {
      // Safely parse media JSON without throwing syntax errors
      let parsedMedia = [];
      if (typeof editingProject.media === "string") {
        try {
          parsedMedia = JSON.parse(editingProject.media || "[]");
        } catch (jsonErr) {
          console.warn("Could not parse media JSON string, defaulting to empty array:", jsonErr);
          parsedMedia = [];
        }
      } else {
        parsedMedia = editingProject.media || [];
      }

      const payload = {
        title: titleStr,
        slug: slugStr,
        category: editingProject.category || "BRAND DESIGN",
        tagline: editingProject.tagline || editingProject.subtitle || "",
        image: editingProject.image || editingProject.cover_image_url || "/images/grit1.jpg",
        program: editingProject.program || "",
        industry: editingProject.industry || "",
        stage: editingProject.stage || "",
        about: editingProject.about || editingProject.summary_text || "",
        media: parsedMedia,
        subtitle: editingProject.subtitle || editingProject.tagline || "",
        cover_image_url: editingProject.cover_image_url || editingProject.image || "/images/grit1.jpg",
        summary_text: editingProject.summary_text || editingProject.about || "",
        full_text: editingProject.full_text || "",
        position: editingProject.id ? (editingProject.position ?? 0) : projects.length
      };

      let projectId = editingProject.id;

      if (editingProject.id) {
        // Update
        const { error } = await supabase
          .from("portfolio_projects")
          .update(payload)
          .eq("id", editingProject.id);
        if (error) throw error;

        setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...payload } : p));
        setAlert({ type: "success", message: "Case study updated successfully." });
      } else {
        // Insert
        const { data, error } = await supabase
          .from("portfolio_projects")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;

        if (data) {
          projectId = data.id;
          setProjects(prev => [data as ProjectItem, ...prev]);
        }
        setAlert({ type: "success", message: "Case study created successfully." });
      }

      // Sync showcase images
      if (projectId) {
        // Delete existing showcase images for this project
        await supabase
          .from("showcase_images")
          .delete()
          .eq("project_id", projectId);

        // Insert new showcase images
        if (projectShowcaseImages.length > 0) {
          const showcasePayload = projectShowcaseImages.map((img, idx) => ({
            project_id: projectId,
            image_url: img.image_url,
            block_type: img.block_type || "before",
            display_order: idx + 1
          }));
          const { error: showcaseError } = await supabase
            .from("showcase_images")
            .insert(showcasePayload);
          if (showcaseError) throw showcaseError;
        }
      }

      setShowProjectModal(false);
      setEditingProject(null);
      setProjectShowcaseImages([]);
    } catch (err: any) {
      console.warn("Failed to save portfolio project details:", err);
      const errorDetail = err.message || err.details || err.hint || String(err);
      setAlert({ type: "error", message: `Failed to save case study: ${errorDetail}` });
    }
  };

  // Delete Portfolio Case Study
  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this case study? This cannot be undone.")) return;

    try {
      const project = projects.find(p => p.id === id);
      if (project) {
        // Delete cover image
        if (project.image) {
          await deleteStorageFileByUrl(project.image);
        }

        // Delete all gallery/layout images in media blocks
        let mediaBlocks: any[] = [];
        try {
          mediaBlocks = typeof project.media === "string" ? JSON.parse(project.media) : project.media;
        } catch (_) {}

        if (Array.isArray(mediaBlocks)) {
          for (const block of mediaBlocks) {
            if (block.images && Array.isArray(block.images)) {
              for (const img of block.images) {
                if (img.src) {
                  await deleteStorageFileByUrl(img.src);
                }
              }
            }
          }
        }

        // Delete all showcase images from storage
        try {
          const { data: showcaseDbImages } = await supabase
            .from("showcase_images")
            .select("image_url")
            .eq("project_id", id);
          if (showcaseDbImages) {
            for (const img of showcaseDbImages) {
              if (img.image_url) {
                await deleteStorageFileByUrl(img.image_url);
              }
            }
          }
        } catch (err) {
          console.warn("Showcase images cleanup warning:", err);
        }
      }

      const { error } = await supabase.from("portfolio_projects").delete().eq("id", id);
      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      setAlert({ type: "success", message: "Case study deleted successfully." });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to delete project." });
    }
  };

  const handleMoveProjectOrder = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= projects.length) return;

    // Create a copy of the list and swap the items
    const reorderedList = [...projects];
    const temp = reorderedList[index];
    reorderedList[index] = reorderedList[targetIdx];
    reorderedList[targetIdx] = temp;

    // Update local state instantly for a snappy UI feel
    setProjects(reorderedList);
    setIsProjectsOrderDirty(true);
  };

  const handleSaveProjectsOrder = async () => {
    try {
      setUploading(true);
      const updates = projects.map((proj, idx) => ({
        id: proj.id,
        title: proj.title,
        slug: proj.slug,
        category: proj.category,
        tagline: proj.tagline,
        image: proj.image,
        program: proj.program,
        industry: proj.industry,
        stage: proj.stage,
        about: proj.about,
        media: proj.media || [],
        subtitle: proj.subtitle || "",
        cover_image_url: proj.cover_image_url || "",
        summary_text: proj.summary_text || "",
        full_text: proj.full_text || "",
        position: idx
      }));

      const { error } = await supabase.from("portfolio_projects").upsert(updates);
      if (error) throw error;

      setIsProjectsOrderDirty(false);
      setAlert({ type: "success", message: "Showcase portfolio order saved successfully." });
    } catch (err: any) {
      console.error("Failed to save projects order:", err);
      setAlert({ type: "error", message: err.message || "Failed to save portfolio order." });
    } finally {
      setUploading(false);
    }
  };

  // Mutators: Save One-Off Service (Create or Update)
  const handleSaveService = async () => {
    if (!editingService?.name || !editingService?.price) {
      setAlert({ type: "error", message: "Service name and price are required." });
      return;
    }

    try {
      const payload = {
        name: editingService.name,
        description: editingService.description || "",
        price: Number(editingService.price),
        has_addons: !!editingService.has_addons,
        addon_price: editingService.has_addons ? Number(editingService.addon_price || 0) : 0
      };

      if (editingService.id) {
        // Update
        const { error } = await supabase
          .from("master_services")
          .update(payload)
          .eq("id", editingService.id);
        if (error) throw error;

        setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...payload } : s));
        setAlert({ type: "success", message: `Service ${editingService.name} updated.` });
      } else {
        // Insert
        const { data, error } = await supabase
          .from("master_services")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;

        if (data) setServices(prev => [...prev, data as ServiceItem]);
        setAlert({ type: "success", message: `Service ${editingService.name} created.` });
      }
      setShowServiceModal(false);
      setEditingService(null);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to save service." });
    }
  };

  // Mutators: Delete One-Off Service
  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service? All card bundle associations will be removed.")) return;
    try {
      const { error } = await supabase
        .from("master_services")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== id));
      setCardServiceItems(prev => prev.filter(item => item.service_id !== id));
      setAlert({ type: "success", message: "Service deleted successfully." });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to delete service." });
    }
  };

  // Mutators: Save Suite Card (Create or Update)
  const handleSaveCard = async () => {
    if (!editingCard?.name || !editingCard?.price) {
      setAlert({ type: "error", message: "Package name and price are required." });
      return;
    }

    try {
      const payload = {
        name: editingCard.name,
        category: editingCard.category || "identity",
        tier: editingCard.tier || "custom",
        price: Number(editingCard.price),
        description: editingCard.description || "",
        has_addons: !!editingCard.has_addons,
        addon_price: editingCard.has_addons ? Number(editingCard.addon_price || 0) : 0
      };

      if (editingCard.id) {
        // Update
        const { error } = await supabase
          .from("service_cards")
          .update(payload)
          .eq("id", editingCard.id);
        if (error) throw error;

        setCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, ...payload } : c));
        setAlert({ type: "success", message: `Package ${editingCard.name} updated.` });
      } else {
        // Insert
        const { data, error } = await supabase
          .from("service_cards")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;

        if (data) setCards(prev => [...prev, data as CardItem]);
        setAlert({ type: "success", message: `Package ${editingCard.name} created.` });
      }
      setShowCardModal(false);
      setEditingCard(null);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to save package." });
    }
  };

  // Mutators: Delete Suite Card
  const handleDeleteCard = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package? All internal inclusions will be deleted.")) return;
    try {
      const { error } = await supabase
        .from("service_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setCards(prev => prev.filter(c => c.id !== id));
      setCardServiceItems(prev => prev.filter(item => item.card_id !== id));
      setAlert({ type: "success", message: "Package deleted successfully." });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to delete package." });
    }
  };

  // Mutators: Add Service Item to Package
  const handleAddInclusion = async (cardId: string, serviceId: string) => {
    if (!serviceId) return;
    try {
      const { data, error } = await supabase
        .from("card_service_items")
        .insert([{ card_id: cardId, service_id: serviceId }])
        .select("*, master_services(name, price)")
        .single();

      if (error) throw error;
      if (data) {
        setCardServiceItems(prev => [...prev, data as CardServiceItem]);
        setAlert({ type: "success", message: "Service added to package bundle." });
      }
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to add inclusion." });
    }
  };

  // Mutators: Remove Service Item from Package
  const handleRemoveInclusion = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("card_service_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      setCardServiceItems(prev => prev.filter(item => item.id !== itemId));
      setAlert({ type: "success", message: "Service removed from package bundle." });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to remove inclusion." });
    }
  };

  // Mutators: Update Inclusion overrides
  const handleSaveInclusionOverride = async (itemId: string, customName: string, priceOverride: number | null) => {
    try {
      const { error } = await supabase
        .from("card_service_items")
        .update({
          custom_name: customName || null,
          price_override: priceOverride !== null ? Number(priceOverride) : null
        })
        .eq("id", itemId);

      if (error) throw error;
      setCardServiceItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, custom_name: customName || null, price_override: priceOverride } 
          : item
      ));
      setAlert({ type: "success", message: "Inclusion custom overrides updated." });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to update overrides." });
    }
  };

  // Mutators: Delete Coupon Code
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon code?")) return;
    try {
      const { error } = await supabase.from("discount_codes").delete().eq("id", id);
      if (error) throw error;

      setCoupons(prev => prev.filter(c => c.id !== id));
      setAlert({ type: "success", message: "Promo coupon deleted successfully." });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to delete coupon." });
    }
  };

  // Mutators: Save Coupon Code
  const handleSaveCoupon = async () => {
    if (!editingCoupon?.code || !editingCoupon?.value) {
      setAlert({ type: "error", message: "Coupon code and override value are required." });
      return;
    }

    try {
      const payload = {
        code: editingCoupon.code.toUpperCase(),
        type: editingCoupon.type || "percentage",
        value: Number(editingCoupon.value),
        expires_at: editingCoupon.expires_at || null
      };

      if (editingCoupon.id) {
        // Update
        const { error } = await supabase
          .from("discount_codes")
          .update(payload)
          .eq("id", editingCoupon.id);
        if (error) throw error;

        setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...payload } : c));
        setAlert({ type: "success", message: "Promo coupon updated." });
      } else {
        // Insert
        const { data, error } = await supabase
          .from("discount_codes")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;

        if (data) setCoupons(prev => [data as CouponItem, ...prev]);
        setAlert({ type: "success", message: "Promo coupon created." });
      }
      setShowCouponModal(false);
      setEditingCoupon(null);
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to save coupon." });
    }
  };

  // Mutators: Save Settings
  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          bank_name: bankSettings.bank_name,
          account_number: bankSettings.account_number,
          account_name: bankSettings.account_name,
          contact_email: bankSettings.contact_email,
          contact_phone: bankSettings.contact_phone,
          legal_footer: bankSettings.legal_footer,
          slideshow_interval: Number(bankSettings.slideshow_interval)
        })
        .eq("id", bankSettings.id);

      if (error) throw error;

      setAlert({ type: "success", message: "Site configuration overrides saved successfully." });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to save settings." });
    }
  };

  // Helper to extract bucket file path from public Supabase Storage URL
  const getFilePathFromUrl = (url: string, bucketName = "showcase") => {
    const marker = `/public/${bucketName}/`;
    const index = url.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(url.substring(index + marker.length));
    }
    return null;
  };

  // Helper to delete individual storage asset by URL
  const deleteStorageFileByUrl = async (url: string, bucketName = "showcase") => {
    if (!url || url.startsWith("data:")) return;
    const filePath = getFilePathFromUrl(url, bucketName);
    if (filePath) {
      try {
        await supabase.storage.from(bucketName).remove([filePath]);
      } catch (err) {
        console.warn("Storage asset cleanup warning:", err);
      }
    }
  };

  // Mutators: Add Showcase image (LOCAL STATE ONLY)
  const handleAddShowcaseImage = (url: string, position: number) => {
    const tempId = `temp-${Math.random().toString(36).substring(2)}-${Date.now()}`;
    const newImage = { id: tempId, url_path: url, position };
    setShowcaseImages(prev => [...prev, newImage].sort((a, b) => a.position - b.position));
  };

  // Mutators: Delete Showcase image (LOCAL STATE ONLY)
  const handleDeleteShowcaseImage = (id: string) => {
    setShowcaseImages(prev => prev.filter(img => img.id !== id));
  };

  // Mutators: Update Showcase image position order (LOCAL STATE ONLY)
  const handleUpdateShowcasePosition = (id: string, newPos: number) => {
    setShowcaseImages(prev => 
      prev.map(img => img.id === id ? { ...img, position: newPos } : img).sort((a, b) => a.position - b.position)
    );
  };

  // Swap positions in local state
  const moveShowcaseImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= showcaseImages.length) return;

    setShowcaseImages(prev => {
      const next = [...prev];
      const tempPos = next[index].position;
      next[index].position = next[targetIndex].position;
      next[targetIndex].position = tempPos;
      return next.sort((a, b) => a.position - b.position);
    });
  };

  // Client-side image compressor before base64 conversion (limits resolution and quota bloat)
  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new (window as any).Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(event.target?.result as string);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Save local showcase changes to Supabase (with fallback to localStorage)
  const handleSaveShowcase = async () => {
    setUploading(true);
    let onlineSaved = false;
    let errorMsg = "";

    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
      if (!isPlaceholder) {
        // Retrieve current DB entries first to check what was deleted
        const { data: currentDbImages } = await supabase
          .from("hero_slideshow_images")
          .select("url_path");

        const newUrls = new Set(showcaseImages.map(img => img.url_path));
        const urlsToDelete = (currentDbImages || [])
          .map(img => img.url_path)
          .filter(url => !newUrls.has(url));

        // Clean up from storage
        for (const url of urlsToDelete) {
          await deleteStorageFileByUrl(url);
        }

        // 1. Delete all current rows in hero_slideshow_images
        const { error: deleteError } = await supabase
          .from("hero_slideshow_images")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all rows

        if (deleteError) throw deleteError;

        // 2. Map current state showcaseImages to insert payload
        const payload = showcaseImages.map((img, idx) => ({
          url_path: img.url_path,
          position: idx + 1
        }));

        if (payload.length > 0) {
          const { error: insertError } = await supabase
            .from("hero_slideshow_images")
            .insert(payload);

          if (insertError) throw insertError;
        }

        // 3. Fetch fresh records from Supabase to load real IDs
        const { data: freshData, error: fetchError } = await supabase
          .from("hero_slideshow_images")
          .select("*")
          .order("position", { ascending: true });

        if (fetchError) throw fetchError;
        if (freshData) {
          setShowcaseImages(freshData);
          const maxPos = freshData.reduce((max, img) => img.position > max ? img.position : max, 0);
          setNewImagePosition(maxPos + 1);
        }
        onlineSaved = true;
      } else {
        errorMsg = "Database endpoint is not configured (placeholder env URL detected).";
      }
    } catch (err: any) {
      console.warn("Supabase database save failed, writing locally to browser cache instead:", err);
      errorMsg = err.message || "Network failed.";
    }

    // Always fallback to localStorage so changes persist offline in local browser cache
    let localSaved = false;
    try {
      localStorage.setItem("tochay_offline_showcase_images", JSON.stringify(showcaseImages));
      localSaved = true;
    } catch (localStorageErr) {
      console.warn("Local browser storage write quota exceeded:", localStorageErr);
    }

    if (onlineSaved) {
      setAlert({ type: "success", message: "Showcase slideshow customizations saved to cloud database." });
    } else {
      if (localSaved) {
        setAlert({ type: "success", message: `Saved locally to browser layout (${errorMsg.includes("Failed to fetch") ? "database offline" : errorMsg}).` });
      } else {
        setAlert({ 
          type: "error", 
          message: "Unable to save slideshow. Image size too large for local caching. Delete old/large photos." 
        });
      }
    }
    setUploading(false);
  };

  // Image Upload helper
  const uploadShowcaseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;
      const targetPos = newImagePosition + i;

      let uploadedUrl = "";

      try {
        const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
        if (!isPlaceholder) {
          // 1. Try public storage bucket upload
          const { data, error } = await supabase.storage
            .from("showcase")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false
            });

          if (!error && data) {
            const { data: publicUrlData } = supabase.storage
              .from("showcase")
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        }
      } catch (storageErr) {
        console.warn("Storage upload threw exception, falling back to Base64:", storageErr);
      }

      if (uploadedUrl) {
        handleAddShowcaseImage(uploadedUrl, targetPos);
        successCount++;
      } else {
        // 2. Base64 database storage fallback (with client-side image compression)
        try {
          const base64String = await compressImage(file, 1200, 0.7);
          handleAddShowcaseImage(base64String, targetPos);
          successCount++;
        } catch (base64Err) {
          console.error("Compression fallback failed:", base64Err);
        }
      }
    }

    setUploading(false);
    if (successCount > 0) {
      setAlert({ type: "success", message: `Added ${successCount} image(s) to local workspace layout.` });
      setNewImagePosition(prev => prev + successCount);
    }
  };

  // Portfolio Cover Image Upload helper
  const uploadProjectCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProjectUploading(true);
    let uploadedUrl = "";

    try {
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
      if (!isPlaceholder) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `portfolio/${fileName}`;

        // 1. Try public storage bucket upload
        const { data, error } = await supabase.storage
          .from("showcase")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from("showcase")
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            uploadedUrl = publicUrlData.publicUrl;
          }
        }
      }
    } catch (storageErr) {
      console.warn("Project cover storage upload threw exception, falling back to Base64:", storageErr);
    }

    if (uploadedUrl) {
      setEditingProject(prev => prev ? { ...prev, image: uploadedUrl, cover_image_url: uploadedUrl } : null);
      setAlert({ type: "success", message: "Cover image uploaded successfully." });
      setProjectUploading(false);
    } else {
      // 2. Base64 database storage fallback (with client-side image compression)
      try {
        const base64String = await compressImage(file, 1200, 0.7);
        setEditingProject(prev => prev ? { ...prev, image: base64String, cover_image_url: base64String } : null);
        setAlert({ type: "success", message: "Cover image compressed and saved locally." });
        setProjectUploading(false);
      } catch (err: any) {
        setAlert({ type: "error", message: err.message || "Upload failed." });
        setProjectUploading(false);
      }
    }
  };

  // Showcase Gallery upload files
  const handleUploadShowcaseBlockFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProjectUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `portfolio-showcase/${fileName}`;

      let uploadedUrl = "";

      try {
        const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
        if (!isPlaceholder) {
          const { data, error } = await supabase.storage
            .from("showcase")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false
            });

          if (!error && data) {
            const { data: publicUrlData } = supabase.storage
              .from("showcase")
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        }
      } catch (storageErr) {
        console.warn("Showcase block storage upload threw exception, falling back to Base64:", storageErr);
      }

      if (!uploadedUrl) {
        // Fallback to Base64 image compression
        try {
          uploadedUrl = await compressImage(file, 1200, 0.7);
        } catch (base64Err) {
          console.error("Compression fallback failed:", base64Err);
        }
      }

      if (uploadedUrl) {
        const newBlock = {
          id: `temp-${Math.random().toString(36).substring(2)}-${Date.now()}`,
          image_url: uploadedUrl,
          block_type: "before", // default placement position: before the story
          display_order: projectShowcaseImages.length + successCount + 1
        };
        setProjectShowcaseImages(prev => [...prev, newBlock]);
        successCount++;
      }
    }

    setProjectUploading(false);
    if (successCount > 0) {
      setAlert({ type: "success", message: `Successfully uploaded ${successCount} showcase image(s).` });
    }
  };

  const handleUpdateBlockType = (idx: number, type: "before" | "after") => {
    setProjectShowcaseImages(prev => prev.map((img, i) => i === idx ? { ...img, block_type: type } : img));
  };

  const moveBlockOrder = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= projectShowcaseImages.length) return;

    setProjectShowcaseImages(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;

      // Reassign display_order indexes
      return copy.map((block, index) => ({ ...block, display_order: index + 1 }));
    });
  };

  const handleDeleteShowcaseBlock = async (idx: number) => {
    const target = projectShowcaseImages[idx];
    if (target.image_url && !target.image_url.startsWith("data:")) {
      await deleteStorageFileByUrl(target.image_url);
    }
    setProjectShowcaseImages(prev => 
      prev.filter((_, i) => i !== idx).map((block, index) => ({ ...block, display_order: index + 1 }))
    );
  };

  // Render Login Gate Screen
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col justify-center items-center p-6 font-sans">
        {/* Dynamic decorative backdrop grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 select-none pointer-events-none" />

        {/* Brand Label */}
        <div className="flex flex-col items-center gap-3 select-none mb-8 z-10">
          <Image
            src="/images/toflogoblack.png"
            alt="TY Logo"
            width={48}
            height={48}
            className="w-auto h-12 object-contain"
            priority
          />
          <h1 className="font-sans font-bold text-3xl tracking-tighter text-[#09090b] mt-1">
            administrator.
          </h1>
        </div>

        {/* Login Form Card */}
        <div className="w-full max-w-sm bg-white/70 backdrop-blur-md border border-zinc-200 rounded-3xl p-8 shadow-xl flex flex-col gap-6 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ffd230] flex items-center justify-center">
              <Lock className="w-4 h-4 text-zinc-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-sm text-zinc-950">Security Gate</span>
              <span className="font-sans font-normal text-zinc-400 text-xs">Verify credentials to enter dashboard</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                Admin Email
              </label>
              <input
                type="email"
                placeholder="tofunmiyinusa01@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-sans text-zinc-950 outline-hidden transition-all placeholder:text-zinc-300"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                Security Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-sans text-zinc-950 outline-hidden transition-all placeholder:text-zinc-300"
              />
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-sans text-xs text-red-700 leading-normal">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all duration-300 cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{authLoading ? "Verifying..." : "Verify & Authenticate"}</span>
            </button>
          </form>
        </div>

        <p className="font-mono text-[9px] text-zinc-400 mt-6 select-none z-10">
          SECURE CONNECTION CLIENT ENGINE
        </p>
      </main>
    );
  }

  // Render Dashboard Workspace
  return (
    <main className="min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans relative">
      
      {/* Absolute alert banner */}
      {alert && (
        <div className={`fixed top-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[100] px-5 py-3.5 rounded-2xl border flex items-center gap-3 shadow-xl leading-normal break-words ${
          alert.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {alert.type === "success" ? <Check className="w-4.5 h-4.5 shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 shrink-0" />}
          <span className="font-sans font-semibold text-xs text-left leading-normal">{alert.message}</span>
        </div>
      )}

      {/* Admin Top Dashboard Bar */}
      <header className="w-full border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Image
            src="/images/toflogoblack.png"
            alt="TY Logo"
            width={28}
            height={28}
            className="w-auto h-7 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-sans font-bold text-sm tracking-tight text-zinc-950">TY STUDIO</span>
            <span className="font-mono text-[8px] font-semibold text-zinc-400 uppercase tracking-widest">
              Control Panel
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="font-mono text-[10px] text-zinc-400 font-semibold bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full shrink-0">
            {timeStr}
          </span>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 font-sans font-bold text-xs text-zinc-500 hover:text-red-600 transition-colors duration-300 cursor-pointer"
          >
            <span>Exit Session</span>
            <LogOut className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </header>

      {/* Main Admin Sidebar & Tab content block */}
      <div className="flex flex-col md:flex-row flex-grow w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 py-10 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex flex-row md:flex-col gap-2 shrink-0 select-none overflow-x-auto pb-4 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("site")}
            className={`w-full px-5 py-3 rounded-xl flex items-center gap-3 font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
              activeTab === "site"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                : "bg-white text-zinc-500 hover:text-zinc-900 border-zinc-200"
            }`}
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span>Site Controls</span>
          </button>

          <button
            onClick={() => setActiveTab("portfolio")}
            className={`w-full px-5 py-3 rounded-xl flex items-center gap-3 font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
              activeTab === "portfolio"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                : "bg-white text-zinc-500 hover:text-zinc-900 border-zinc-200"
            }`}
          >
            <FolderKanban className="w-4 h-4 shrink-0" />
            <span>Showcase Portfolio</span>
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`w-full px-5 py-3 rounded-xl flex items-center gap-3 font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
              activeTab === "pricing"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                : "bg-white text-zinc-500 hover:text-zinc-900 border-zinc-200"
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span>Rates & Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab("inquiries")}
            className={`w-full px-5 py-3 rounded-xl flex items-center gap-3 font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
              activeTab === "inquiries"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                : "bg-white text-zinc-500 hover:text-zinc-900 border-zinc-200"
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            <span>Contact Inquiries</span>
            {inquiries.length > 0 && (
              <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === "inquiries" ? "bg-[#ffd230] text-zinc-950" : "bg-zinc-100 text-zinc-500"
              } ml-auto shrink-0`}>
                {inquiries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("forms")}
            className={`w-full px-5 py-3 rounded-xl flex items-center gap-3 font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
              activeTab === "forms"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                : "bg-white text-zinc-500 hover:text-zinc-900 border-zinc-200"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Custom Forms</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full px-5 py-3 rounded-xl flex items-center gap-3 font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
              activeTab === "settings"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                : "bg-white text-zinc-500 hover:text-zinc-900 border-zinc-200"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings & Coupons</span>
          </button>
        </aside>

        {/* Central Workspace Tab Body */}
        <section className="flex-grow bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs min-h-[500px]">
          
          {/* TAB 0: SITE CONTROLS */}
          {activeTab === "site" && (
            <div className="flex flex-col gap-8">
              {/* Transition Switch Interval */}
              <div className="flex flex-col gap-5 pb-6 border-b border-zinc-100">
                <div className="select-none">
                  <h2 className="font-sans font-bold text-xl text-zinc-950">Landing Slideshow Switch Speed</h2>
                  <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">
                    Configure the time interval (in milliseconds) before the landing page images automatically rotate.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
                  <div className="flex flex-col gap-1.5 flex-grow">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                      Rotation Interval (Milliseconds)
                    </label>
                    <input
                      type="number"
                      value={bankSettings.slideshow_interval || 2500}
                      onChange={(e) => setBankSettings({ ...bankSettings, slideshow_interval: Number(e.target.value) })}
                      placeholder="e.g. 2500"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                    />
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-3 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-semibold text-xs transition-all duration-300 cursor-pointer shadow-xs flex items-center gap-2 shrink-0 select-none"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Interval</span>
                  </button>
                </div>
              </div>

              {/* Showcase Images Manager */}
              <div className="flex flex-col gap-6">
                <div className="select-none">
                  <h2 className="font-sans font-bold text-xl text-zinc-950">Hero Slideshow Images</h2>
                  <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">
                    Manage the custom design images rendered in the expanding hero bar.
                  </p>
                </div>

                {/* Add showcase image form */}
                <div className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50/50 flex flex-col gap-4">
                  <span className="font-sans font-bold text-xs text-zinc-950 select-none">Add Showcase Image</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                        Image File Path or External URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /images/portfolio-templates.png"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2 px-3 text-xs font-sans outline-hidden text-zinc-950"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                        Slide Order Position
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1"
                        value={newImagePosition}
                        onChange={(e) => setNewImagePosition(Number(e.target.value))}
                        className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2 px-3 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 select-none">
                    <button
                      disabled={uploading}
                      onClick={() => {
                        if (!newImageUrl.trim()) return;
                        handleAddShowcaseImage(newImageUrl.trim(), newImagePosition);
                        setNewImageUrl("");
                        setNewImagePosition(prev => prev + 1);
                      }}
                      className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Image URL</span>
                    </button>

                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={uploadShowcaseFile}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-sans font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-zinc-400" />
                            <span>Upload from Device</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Guidelines callout alerts */}
                <div className="bg-[#ffd230]/10 border border-[#ffd230]/20 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-sans font-bold text-xs text-amber-900 select-none">Recommended Specs</span>
                    <p className="font-sans font-normal text-amber-800 text-[11px] leading-relaxed">
                      For best aesthetics on retina displays, upload images with an aspect ratio of <strong>16:10</strong> or <strong>16:9</strong> (e.g. 1920x1200 or 1920x1080 resolution). Ensure the files are optimized in WebP format for fast initial page load.
                    </p>
                  </div>
                </div>

                {/* Current showcase list layout */}
                <div className="flex flex-col gap-3">
                  <span className="font-sans font-semibold text-xs text-zinc-400 uppercase tracking-wider pl-0.5 select-none">
                    Current Setup
                  </span>
                  {showcaseImages.length === 0 ? (
                    <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-12 flex flex-col items-center justify-center text-center select-none">
                      <AlertCircle className="w-8 h-8 text-zinc-300 mb-2" />
                      <span className="font-sans font-bold text-zinc-400 text-xs">No Showcase Images Uploaded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {showcaseImages.map((img, idx) => (
                        <div
                          key={img.id}
                          className="border border-zinc-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4 flex-grow min-w-0">
                            <div className="relative w-24 h-14 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-100 shrink-0 select-none">
                              <img
                                src={img.url_path}
                                alt="Slideshow item"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as any).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200";
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-1 min-w-0 overflow-hidden">
                              <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[120px] sm:max-w-md" title={img.url_path}>
                                {img.url_path.startsWith("data:") 
                                  ? `Offline Asset (${Math.round((img.url_path.length * 3) / 4 / 1024)} KB)` 
                                  : img.url_path.split("/").pop()}
                              </span>
                              <span className="font-sans font-normal text-zinc-400 text-[10px]">
                                Position Order: {img.position}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center select-none">
                            {/* Reordering Up/Down controls */}
                            <div className="flex items-center gap-1 border border-zinc-200 rounded-lg p-0.5 bg-zinc-50/50">
                              <button
                                disabled={idx === 0}
                                onClick={() => moveShowcaseImage(idx, "up")}
                                className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-white disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={idx === showcaseImages.length - 1}
                                onClick={() => moveShowcaseImage(idx, "down")}
                                className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-white disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <label className="font-sans font-normal text-[10px] text-zinc-400">Order:</label>
                              <input
                                type="number"
                                defaultValue={img.position}
                                onBlur={(e) => handleUpdateShowcasePosition(img.id, Number(e.target.value))}
                                className="w-12 bg-zinc-50 border border-zinc-200 rounded-lg p-1 text-center font-sans font-bold text-xs text-zinc-950 focus:border-zinc-500 outline-hidden"
                              />
                            </div>
                            <button
                              onClick={() => handleDeleteShowcaseImage(img.id)}
                              className="text-zinc-400 hover:text-red-600 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save Showcase Changes Button */}
                <div className="flex flex-col gap-3 pt-6 border-t border-zinc-150 select-none mt-2">
                  <div className="flex items-center justify-between flex-wrap gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
                    <div className="flex flex-col">
                      <span className="font-sans font-bold text-xs text-zinc-950">Save Slideshow Customizations</span>
                      <p className="font-sans font-normal text-[10px] text-zinc-400">
                        Commit all added, deleted, and reordered slides to the active website.
                      </p>
                    </div>
                    <button
                      onClick={handleSaveShowcase}
                      disabled={uploading}
                      className="px-6 py-3 bg-[#ffd230] text-zinc-950 font-sans font-bold text-xs rounded-xl hover:bg-zinc-950 hover:text-white transition-all cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Showcase changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SHOWCASE PORTFOLIO */}
          {activeTab === "portfolio" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-4 border-b border-zinc-100">
                <div className="flex flex-col">
                  <h2 className="font-sans font-bold text-xl text-zinc-950">Showcase Portfolio</h2>
                  <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">Add, edit, or remove project case studies</p>
                </div>
                <div className="flex gap-2.5 items-center self-start">
                  {isProjectsOrderDirty && (
                    <button
                      onClick={handleSaveProjectsOrder}
                      className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white border border-zinc-200/50 rounded-full font-sans font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm animate-pulse"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Portfolio Order</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingProject({
                        title: "",
                        slug: "",
                        category: "BRAND DESIGN",
                        tagline: "",
                        image: "/images/grit1.jpg",
                        program: "",
                        industry: "",
                        stage: "Established",
                        about: "",
                        media: [],
                        subtitle: "",
                        cover_image_url: "/images/grit1.jpg",
                        summary_text: "",
                        full_text: ""
                      });
                      setProjectShowcaseImages([]);
                      setShowProjectModal(true);
                    }}
                    className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Project</span>
                  </button>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center select-none">
                  <FolderKanban className="w-10 h-10 text-zinc-200 mb-3" />
                  <span className="font-sans font-bold text-zinc-400 text-sm">No Projects in Database</span>
                  <p className="font-sans font-normal text-zinc-400 text-xs max-w-xs mt-1 leading-normal">
                    Seeded projects might still be loading, or your portfolio_projects table is currently empty.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((project, index) => (
                    <div
                      key={project.id}
                      className="border border-zinc-200 rounded-2xl p-4 flex items-start gap-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-zinc-100 shrink-0 select-none">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200";
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 flex-grow">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-[#ffd230] font-semibold">
                          {project.category}
                        </span>
                        <h4 className="font-sans font-bold text-sm text-zinc-950 tracking-tight leading-snug">
                          {project.title}
                        </h4>
                        <p className="font-sans font-normal text-zinc-400 text-[11px] line-clamp-1 max-w-[200px]">
                          {project.tagline}
                        </p>
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-zinc-50 select-none">
                          <button
                            onClick={() => handleEditProjectClick(project)}
                            className="text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <div className="flex items-center gap-1 ml-1 pl-2 border-l border-zinc-100">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveProjectOrder(index, "up")}
                              className="p-1 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 rounded-sm disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === projects.length - 1}
                              onClick={() => handleMoveProjectOrder(index, "down")}
                              className="p-1 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 rounded-sm disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-zinc-400 hover:text-red-600 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RATES & PRICING */}
          {activeTab === "pricing" && (
            <div className="flex flex-col gap-6">
              {/* Pricing Sub-Tabs Menu */}
              <div className="flex border-b border-zinc-200 gap-6 select-none mb-2">
                <button
                  onClick={() => setPricingActiveSubTab("packages")}
                  className={`pb-3 font-sans font-bold text-xs tracking-tight relative transition-colors cursor-pointer ${
                    pricingActiveSubTab === "packages" ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Suite Packages
                  {pricingActiveSubTab === "packages" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950" />
                  )}
                </button>
                <button
                  onClick={() => setPricingActiveSubTab("services")}
                  className={`pb-3 font-sans font-bold text-xs tracking-tight relative transition-colors cursor-pointer ${
                    pricingActiveSubTab === "services" ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  One-Off Services
                  {pricingActiveSubTab === "services" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950" />
                  )}
                </button>
                <button
                  onClick={() => setPricingActiveSubTab("coupons")}
                  className={`pb-3 font-sans font-bold text-xs tracking-tight relative transition-colors cursor-pointer ${
                    pricingActiveSubTab === "coupons" ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Promo Coupons
                  {pricingActiveSubTab === "coupons" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950" />
                  )}
                </button>
              </div>

              {/* Sub-tab 1: Suite Packages */}
              {pricingActiveSubTab === "packages" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-4 border-b border-zinc-100">
                    <div className="flex flex-col">
                      <h2 className="font-sans font-bold text-xl text-zinc-950">Suite Package Retainers</h2>
                      <p className="font-sans font-light text-zinc-400 text-xs mt-0.5">Manage bundle tiers, base pricing, and relational service inclusions</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingCard({
                          name: "",
                          category: "identity",
                          tier: "basic",
                          price: 40000,
                          description: ""
                        });
                        setShowCardModal(true);
                      }}
                      className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Package</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card) => {
                      const inclusions = cardServiceItems.filter(item => item.card_id === card.id);
                      return (
                        <div
                          key={card.id}
                          className="border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:shadow-xs transition-shadow"
                        >
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <div className="flex items-center justify-between select-none">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-[#ffd230] font-bold">
                                {card.category} suite
                              </span>
                              <span className="font-sans font-bold text-xs text-zinc-950 uppercase px-2 py-0.5 rounded-md bg-zinc-100">
                                {card.tier}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1 mt-2">
                              <h3 className="font-sans font-bold text-base text-zinc-950 tracking-tight leading-snug">
                                {card.name}
                              </h3>
                              <span className="font-sans font-extrabold text-lg text-zinc-950 mt-1 block">
                                ₦{Number(card.price).toLocaleString()}
                                {card.category === "asset" && <span className="font-normal text-zinc-400 text-xs">/mo</span>}
                              </span>
                              
                              {/* Inclusions summary list */}
                              <div className="mt-3 bg-zinc-50/50 border border-zinc-150 rounded-xl p-3 flex flex-col gap-2">
                                <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider">Suite Inclusions:</span>
                                {inclusions.length === 0 ? (
                                  <span className="font-sans font-normal text-[10px] text-zinc-400 italic">No inclusions mapped. Configure items below.</span>
                                ) : (
                                  <ul className="flex flex-col gap-1.5">
                                    {inclusions.map((item) => {
                                      const label = item.custom_name || item.master_services?.name || "Service Item";
                                      const rate = item.price_override !== null && item.price_override !== undefined 
                                        ? Number(item.price_override) 
                                        : Number(item.master_services?.price || 0);
                                      return (
                                        <li key={item.id} className="flex items-center justify-between gap-3 font-sans text-[11px] text-zinc-600">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                            <span className="truncate">{label}</span>
                                          </div>
                                          <span className="font-mono text-[10px] text-zinc-400 shrink-0">₦{rate.toLocaleString()}</span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center justify-end select-none mt-2 gap-3 pt-3 border-t border-zinc-100">
                            <button
                              onClick={() => {
                                setInclusionsCardId(card.id);
                                setShowInclusionsModal(true);
                              }}
                              className="text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer mr-auto"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span>Manage Items ({inclusions.length})</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setEditingCard(card);
                                setShowCardModal(true);
                              }}
                              className="text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="text-zinc-400 hover:text-red-600 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: One-Off Services */}
              {pricingActiveSubTab === "services" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-4 border-b border-zinc-100">
                    <div className="flex flex-col">
                      <h2 className="font-sans font-bold text-xl text-zinc-950">One-Off Services</h2>
                      <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">Manage stand-alone creative assets and base catalog item rates</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingService({
                          name: "",
                          description: "",
                          price: 15000
                        });
                        setShowServiceModal(true);
                      }}
                      className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Service</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border border-zinc-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xs transition-shadow"
                      >
                        <div className="flex flex-col gap-1 flex-grow">
                          <h4 className="font-sans font-bold text-base text-zinc-950 tracking-tight leading-snug">
                            {service.name}
                          </h4>
                          <p className="font-sans font-normal text-zinc-400 text-xs leading-relaxed max-w-lg">
                            {service.description || "No description provided."}
                          </p>
                          <span className="font-sans font-extrabold text-sm text-zinc-950 mt-1 block">
                            ₦{Number(service.price).toLocaleString()}
                            {service.name === "Decks" && <span className="font-normal text-zinc-400 text-[10px] lowercase"> / slide</span>}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center justify-end select-none gap-4">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceModal(true);
                            }}
                            className="text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-zinc-400 hover:text-red-600 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Promo Coupons */}
              {pricingActiveSubTab === "coupons" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-4 border-b border-zinc-100">
                    <div className="flex flex-col">
                      <h2 className="font-sans font-bold text-xl text-zinc-950">Promo Discount Coupons</h2>
                      <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">Manage coupons and active codes campaign rates</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingCoupon({
                          code: "",
                          type: "percentage",
                          value: 10,
                          expires_at: ""
                        });
                        setShowCouponModal(true);
                      }}
                      className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Coupon</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {coupons.map((c) => (
                      <div
                        key={c.id}
                        className="border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:shadow-xs transition-shadow"
                      >
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center justify-between select-none">
                            <span className="font-mono text-xs font-bold text-zinc-950 bg-zinc-100 px-2.5 py-0.5 rounded-md">
                              {c.code}
                            </span>
                            <span className="font-mono text-[9px] text-zinc-400">
                              {c.expires_at ? `Exp: ${new Date(c.expires_at).toLocaleDateString()}` : "Lifetime validity"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {c.type === "percentage" ? (
                              <Percent className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                            ) : (
                              <DollarSign className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                            )}
                            <span className="font-sans font-extrabold text-sm text-zinc-950">
                              {c.type === "percentage" ? `${c.value}% Off` : `₦${c.value.toLocaleString()} Off`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-zinc-50 select-none">
                          <button
                            onClick={() => {
                              setEditingCoupon({
                                ...c,
                                expires_at: c.expires_at ? c.expires_at.slice(0, 10) : ""
                              });
                              setShowCouponModal(true);
                            }}
                            className="text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="text-zinc-400 hover:text-red-600 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTACT INQUIRIES */}
          {activeTab === "inquiries" && (
            <div className="flex flex-col gap-6">
              <div className="pb-4 border-b border-zinc-100 select-none">
                <h2 className="font-sans font-bold text-xl text-zinc-950">Contact Inquiries</h2>
                <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">Read feedback submitted on the home screen collaboration form</p>
              </div>

              {inquiries.length === 0 ? (
                <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center select-none">
                  <Mail className="w-10 h-10 text-zinc-200 mb-3" />
                  <span className="font-sans font-bold text-zinc-400 text-sm">No Inquiries Found</span>
                  <p className="font-sans font-normal text-zinc-400 text-xs max-w-xs mt-1 leading-normal">
                    Form submissions from visitors will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="border border-zinc-200 rounded-2xl p-5 hover:shadow-xs transition-shadow flex flex-col gap-2 relative bg-zinc-50/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 select-none">
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-bold text-sm text-zinc-950">{inq.name}</span>
                          <a
                            href={`mailto:${inq.email}`}
                            className="font-sans font-medium text-[10px] text-zinc-400 hover:text-zinc-950 transition-colors bg-zinc-100 px-2 py-0.5 rounded-md"
                          >
                            {inq.email}
                          </a>
                        </div>
                        <span className="font-mono text-[9px] text-zinc-400">
                          {new Date(inq.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-sans font-normal text-zinc-600 text-xs leading-relaxed max-w-2xl mt-1">
                        {inq.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4b: CUSTOM FORMS */}
          {activeTab === "forms" && (
            <FormBuilderTab />
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-8">
              {/* Account details panel */}
              <div className="flex flex-col gap-5">
                <div className="pb-4 border-b border-zinc-100 select-none">
                  <h2 className="font-sans font-bold text-xl text-zinc-950">Metadata & Bank Settings</h2>
                  <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">Edit contact details and Zenith bank transfer rules drawn on invoices</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                      Bank Name
                    </label>
                    <div className="relative flex items-center">
                      <Building className="w-4 h-4 text-zinc-300 absolute left-3" />
                      <input
                        type="text"
                        value={bankSettings.bank_name}
                        onChange={(e) => setBankSettings({ ...bankSettings, bank_name: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans font-semibold outline-hidden transition-all text-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                      Account Number
                    </label>
                    <div className="relative flex items-center">
                      <CreditCard className="w-4 h-4 text-zinc-300 absolute left-3" />
                      <input
                        type="text"
                        value={bankSettings.account_number}
                        onChange={(e) => setBankSettings({ ...bankSettings, account_number: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans font-semibold outline-hidden transition-all text-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                      Account Beneficiary Name
                    </label>
                    <input
                      type="text"
                      value={bankSettings.account_name}
                      onChange={(e) => setBankSettings({ ...bankSettings, account_name: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden transition-all text-zinc-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                      Invoices Contact Phone
                    </label>
                    <input
                      type="text"
                      value={bankSettings.contact_phone}
                      onChange={(e) => setBankSettings({ ...bankSettings, contact_phone: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden transition-all text-zinc-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                      Invoices Support Email
                    </label>
                    <input
                      type="email"
                      value={bankSettings.contact_email}
                      onChange={(e) => setBankSettings({ ...bankSettings, contact_email: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden transition-all text-zinc-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                      Legal Disclaimer Footer
                    </label>
                    <textarea
                      rows={3}
                      value={bankSettings.legal_footer}
                      onChange={(e) => setBankSettings({ ...bankSettings, legal_footer: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-normal outline-hidden transition-all text-zinc-950 resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-3 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all duration-300 cursor-pointer shadow-xs flex items-center gap-2 self-start select-none"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Invoice Settings</span>
                </button>
              </div>
            </div>
          )}

        </section>
      </div>

      {/* FOOTER */}
      <footer className="w-full border-t border-zinc-200 bg-white py-6 select-none mt-10">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-sans font-bold text-xs text-zinc-400">
            TY STUDIO WORKSPACE © {new Date().getFullYear()}
          </span>
          <span className="font-sans font-normal text-[10px] text-zinc-400">
            Engineered with Supabase + Next.js Server Client
          </span>
        </div>
      </footer>

      {/* PORTFOLIO PROJECT SLIDE OVER DIALOG MODAL */}
      {showProjectModal && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => {
              setShowProjectModal(false);
              setEditingProject(null);
            }}
          />
          <div 
            data-lenis-prevent
            className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slide-in overflow-y-auto"
          >
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between select-none">
              <h3 className="font-sans font-bold text-lg text-zinc-950">
                {editingProject.id ? "Edit Case Study" : "Create Case Study"}
              </h3>
              <button 
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                }}
                className="text-zinc-400 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-grow flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BOSE Sound"
                  value={editingProject.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    const generatedSlug = newTitle
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^\w\-]+/g, "")
                      .replace(/\-\-+/g, "-");
                    setEditingProject({
                      ...editingProject,
                      title: newTitle,
                      slug: generatedSlug
                    });
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Unique Slug (URL Router)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. bose-sound"
                  value={editingProject.slug}
                  onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Category Tag
                  </label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  >
                    <option value="BRAND DESIGN">BRAND DESIGN</option>
                    <option value="BRAND SYSTEM">BRAND SYSTEM</option>
                    <option value="PACKAGING">PACKAGING</option>
                    <option value="MOTION">MOTION</option>
                    <option value="IDENTITY">IDENTITY</option>
                    <option value="ART DIRECTION">ART DIRECTION</option>
                    <option value="VISUAL SYSTEM">VISUAL SYSTEM</option>
                    <option value="GRAPHIC DESIGN">GRAPHIC DESIGN</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Industry Domain
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Consumer Tech"
                    value={editingProject.industry}
                    onChange={(e) => setEditingProject({ ...editingProject, industry: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Program Scope
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Design System, Code"
                    value={editingProject.program}
                    onChange={(e) => setEditingProject({ ...editingProject, program: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Stage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Established"
                    value={editingProject.stage}
                    onChange={(e) => setEditingProject({ ...editingProject, stage: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Cover Image Path / Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. /images/grit1.jpg"
                    value={editingProject.image}
                    onChange={(e) => setEditingProject({ ...editingProject, image: e.target.value })}
                    className="flex-grow bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  />
                  <div className="relative shrink-0 select-none">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadProjectCoverFile}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={projectUploading}
                    />
                    <button
                      type="button"
                      disabled={projectUploading}
                      className="px-4 py-2.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-semibold text-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {projectUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Subtitle (Tagline)
                </label>
                <input
                  type="text"
                  placeholder="Acoustic engineering met by pure..."
                  value={editingProject.subtitle || editingProject.tagline || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, subtitle: e.target.value, tagline: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Summary Text (About Brief)
                </label>
                <textarea
                  rows={3}
                  placeholder="Founded to challenge how we perceive auditory clarity..."
                  value={editingProject.summary_text || editingProject.about || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, summary_text: e.target.value, about: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-normal outline-hidden text-zinc-950 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Full Case Study Story Text
                </label>
                <textarea
                  rows={4}
                  placeholder="The complete detailed story text of this project case study..."
                  value={editingProject.full_text || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, full_text: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-normal outline-hidden text-zinc-950 resize-none leading-relaxed"
                />
              </div>

              {/* Showcase Images Manager */}
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between select-none">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Showcase Gallery Blocks
                  </label>
                  <div className="relative cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUploadShowcaseBlockFiles}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={projectUploading}
                    />
                    <button
                      type="button"
                      disabled={projectUploading}
                      className="px-3 py-1.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-lg font-sans font-bold text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Images</span>
                    </button>
                  </div>
                </div>

                {projectShowcaseImages.length === 0 ? (
                  <div className="border border-dashed border-zinc-200 rounded-2xl py-8 flex flex-col items-center justify-center text-center select-none bg-zinc-50/50">
                    <Upload className="w-6 h-6 text-zinc-200 mb-2" />
                    <span className="font-sans font-bold text-zinc-400 text-[10px]">No gallery blocks uploaded</span>
                    <p className="font-sans text-[9px] text-zinc-400 mt-0.5 max-w-[200px]">Upload images and set their block display types.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {projectShowcaseImages.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        className="flex items-center justify-between border border-zinc-100 bg-zinc-50/50 rounded-xl p-2.5 gap-3 shadow-2xs group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200/50 overflow-hidden shrink-0 select-none">
                            <img src={img.image_url} alt="Block" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-[8px] text-zinc-400 uppercase tracking-wide">Placement Position</span>
                            <select
                              value={img.block_type || "before"}
                              onChange={(e) => handleUpdateBlockType(idx, e.target.value as any)}
                              className="bg-transparent border-none p-0 pr-6 text-zinc-950 font-sans font-bold text-xs focus:ring-0 cursor-pointer outline-hidden select-none"
                            >
                              <option value="before">Before the Story Text</option>
                              <option value="after">After the Story Text</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 select-none shrink-0">
                          <button
                            type="button"
                            onClick={() => moveBlockOrder(idx, "up")}
                            disabled={idx === 0}
                            className="p-1 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 cursor-pointer hover:bg-zinc-100 rounded-md"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlockOrder(idx, "down")}
                            disabled={idx === projectShowcaseImages.length - 1}
                            className="p-1 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 cursor-pointer hover:bg-zinc-100 rounded-md"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteShowcaseBlock(idx)}
                            className="p-1 text-zinc-350 hover:text-red-600 cursor-pointer hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 select-none">
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                }}
                className="px-4 py-2 border border-zinc-200 text-zinc-500 hover:text-zinc-950 rounded-full font-sans font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                className="px-5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Case Study</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMO COUPON DIALOG MODAL */}
      {showCouponModal && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => {
              setShowCouponModal(false);
              setEditingCoupon(null);
            }}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col justify-between z-10 animate-scale-in">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between select-none">
              <h3 className="font-sans font-bold text-lg text-zinc-950">
                {editingCoupon.id ? "Edit Coupon" : "Create Coupon"}
              </h3>
              <button 
                onClick={() => {
                  setShowCouponModal(false);
                  setEditingCoupon(null);
                }}
                className="text-zinc-400 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TOCHAY10"
                  value={editingCoupon.code}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Discount Type
                </label>
                <select
                  value={editingCoupon.type}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Override Value
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10"
                  value={editingCoupon.value}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={editingCoupon.expires_at || ""}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, expires_at: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 select-none">
              <button
                onClick={() => {
                  setShowCouponModal(false);
                  setEditingCoupon(null);
                }}
                className="px-4 py-2 border border-zinc-200 text-zinc-500 hover:text-zinc-950 rounded-full font-sans font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCoupon}
                className="px-5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Coupon</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PACKAGE INCLUSIONS DIALOG MODAL */}
      {showInclusionsModal && inclusionsCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => {
              setShowInclusionsModal(false);
              setInclusionsCardId(null);
              setSelectedServiceToAdd("");
            }}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col justify-between z-10 animate-scale-in max-h-[85vh]">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between select-none">
              <div className="flex flex-col">
                <h3 className="font-sans font-bold text-lg text-zinc-950">
                  Manage Package Items
                </h3>
                <span className="font-sans text-xs text-zinc-400">
                  {cards.find(c => c.id === inclusionsCardId)?.name}
                </span>
              </div>
              <button 
                onClick={() => {
                  setShowInclusionsModal(false);
                  setInclusionsCardId(null);
                  setSelectedServiceToAdd("");
                }}
                className="text-zinc-400 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-6">
              {/* Current Inclusions List */}
              <div className="flex flex-col gap-3">
                <span className="font-sans font-bold text-xs text-zinc-950 select-none">Current Deliverables In Suite:</span>
                {cardServiceItems.filter(item => item.card_id === inclusionsCardId).length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-zinc-200 rounded-2xl select-none">
                    <span className="font-sans text-xs text-zinc-400 italic">No services mapped to this package card.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cardServiceItems
                      .filter(item => item.card_id === inclusionsCardId)
                      .map((item) => {
                        const baseName = item.master_services?.name || "Service Item";
                        const basePrice = item.master_services?.price || 0;
                        return (
                          <div key={item.id} className="border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 bg-zinc-50/30">
                            <div className="flex items-center justify-between select-none">
                              <span className="font-sans font-bold text-xs text-zinc-950">{baseName} <span className="font-normal text-zinc-400">(Base: ₦{basePrice.toLocaleString()})</span></span>
                              <button
                                onClick={() => handleRemoveInclusion(item.id)}
                                className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Display Label Override</label>
                                <input
                                  type="text"
                                  placeholder={baseName}
                                  value={item.custom_name || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCardServiceItems(prev => prev.map(x => x.id === item.id ? { ...x, custom_name: val } : x));
                                  }}
                                  className="bg-white border border-zinc-200 focus:border-zinc-500 rounded-lg py-1.5 px-3 text-[11px] font-sans text-zinc-950 outline-hidden"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Invoice Rate Override (₦)</label>
                                <input
                                  type="number"
                                  placeholder={basePrice.toString()}
                                  value={item.price_override !== null && item.price_override !== undefined ? item.price_override : ""}
                                  onChange={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : null;
                                    setCardServiceItems(prev => prev.map(x => x.id === item.id ? { ...x, price_override: val } : x));
                                  }}
                                  className="bg-white border border-zinc-200 focus:border-zinc-500 rounded-lg py-1.5 px-3 text-[11px] font-sans text-zinc-950 outline-hidden"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleSaveInclusionOverride(item.id, item.custom_name || "", item.price_override !== undefined ? item.price_override : null)}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-sans font-semibold text-[10px] self-start transition-all cursor-pointer shadow-xs"
                            >
                              Save Overrides
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Add New Inclusion Panel */}
              <div className="border-t border-zinc-100 pt-5 flex flex-col gap-3">
                <span className="font-sans font-bold text-xs text-zinc-950 select-none">Add Deliverable To Package:</span>
                <div className="flex gap-3">
                  <select
                    value={selectedServiceToAdd}
                    onChange={(e) => setSelectedServiceToAdd(e.target.value)}
                    className="flex-grow bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2 px-3 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  >
                    <option value="">-- Select a Master Service --</option>
                    {services
                      .filter(s => !cardServiceItems.some(item => item.card_id === inclusionsCardId && item.service_id === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} (₦{Number(s.price).toLocaleString()})</option>
                      ))
                    }
                  </select>
                  <button
                    onClick={() => {
                      if (!selectedServiceToAdd) return;
                      handleAddInclusion(inclusionsCardId, selectedServiceToAdd);
                      setSelectedServiceToAdd("");
                    }}
                    disabled={!selectedServiceToAdd}
                    className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end select-none">
              <button
                onClick={() => {
                  setShowInclusionsModal(false);
                  setInclusionsCardId(null);
                  setSelectedServiceToAdd("");
                }}
                className="px-5 py-2 bg-zinc-950 text-white rounded-full font-sans font-semibold text-xs cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUITE CARD DETAIL DIALOG MODAL */}
      {showCardModal && editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => {
              setShowCardModal(false);
              setEditingCard(null);
            }}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col justify-between z-10 animate-scale-in">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between select-none">
              <h3 className="font-sans font-bold text-lg text-zinc-950">
                {editingCard.id ? "Edit Package" : "Create Package"}
              </h3>
              <button 
                onClick={() => {
                  setShowCardModal(false);
                  setEditingCard(null);
                }}
                className="text-zinc-400 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Package Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Identity Suite"
                  value={editingCard.name || ""}
                  onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Category
                  </label>
                  <select
                    value={editingCard.category || "identity"}
                    onChange={(e) => setEditingCard({ ...editingCard, category: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  >
                    <option value="identity">Identity Suite</option>
                    <option value="asset">Monthly Retainer Pack</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Tier Level
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. premium"
                    value={editingCard.tier || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, tier: e.target.value.toLowerCase() })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Package Base Price (₦)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={editingCard.price !== undefined ? editingCard.price : ""}
                  onChange={(e) => setEditingCard({ ...editingCard, price: Number(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="flex items-center gap-2 mt-2 select-none">
                <input
                  type="checkbox"
                  id="card_has_addons"
                  checked={!!editingCard.has_addons}
                  onChange={(e) => setEditingCard({ ...editingCard, has_addons: e.target.checked })}
                  className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 w-4 h-4 cursor-pointer shadow-xs"
                />
                <label htmlFor="card_has_addons" className="font-sans font-semibold text-xs text-zinc-700 cursor-pointer">
                  Enable Additional Inclusion Add-ons
                </label>
              </div>

              {editingCard.has_addons && (
                <div className="flex flex-col gap-1 mt-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Add-on Price per Additional Inclusion (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={editingCard.addon_price !== undefined ? editingCard.addon_price : ""}
                    onChange={(e) => setEditingCard({ ...editingCard, addon_price: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 select-none">
              <button
                onClick={() => {
                  setShowCardModal(false);
                  setEditingCard(null);
                }}
                className="px-4 py-2 border border-zinc-200 text-zinc-500 hover:text-zinc-950 rounded-full font-sans font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCard}
                className="px-5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Package</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER SERVICE DIALOG MODAL */}
      {showServiceModal && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => {
              setShowServiceModal(false);
              setEditingService(null);
            }}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col justify-between z-10 animate-scale-in">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between select-none">
              <h3 className="font-sans font-bold text-lg text-zinc-950">
                {editingService.id ? "Edit Service" : "Create Service"}
              </h3>
              <button 
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingService(null);
                }}
                className="text-zinc-400 hover:text-zinc-950 focus:outline-hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logo Design"
                  value={editingService.name || ""}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Slide presentation featuring custom data visualization..."
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-normal outline-hidden text-zinc-950 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                  Base Rate Price (₦)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={editingService.price !== undefined ? editingService.price : ""}
                  onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                />
              </div>

              <div className="flex items-center gap-2 mt-2 select-none">
                <input
                  type="checkbox"
                  id="service_has_addons"
                  checked={!!editingService.has_addons}
                  onChange={(e) => setEditingService({ ...editingService, has_addons: e.target.checked })}
                  className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 w-4 h-4 cursor-pointer shadow-xs"
                />
                <label htmlFor="service_has_addons" className="font-sans font-semibold text-xs text-zinc-700 cursor-pointer">
                  Enable Additional Inclusion Add-ons
                </label>
              </div>

              {editingService.has_addons && (
                <div className="flex flex-col gap-1 mt-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                    Add-on Price per Additional Inclusion (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={editingService.addon_price !== undefined ? editingService.addon_price : ""}
                    onChange={(e) => setEditingService({ ...editingService, addon_price: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 flex items-center justify-end gap-3 select-none">
              <button
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingService(null);
                }}
                className="px-4 py-2 border border-zinc-200 text-zinc-500 hover:text-zinc-950 rounded-full font-sans font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                className="px-5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Service</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
