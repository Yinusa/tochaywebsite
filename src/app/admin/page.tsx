"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FormBuilderTab from "@/components/admin/FormBuilderTab";
import PresentationsTab from "@/components/admin/PresentationsTab";
import ClientPortalsTab from "@/components/admin/ClientPortalsTab";
import { 
  Lock, 
  FolderKanban, 
  Tag, 
  Mail, 
  Settings, 
  Layers, 
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
  ArrowDown,
  ArrowLeft,
  BookOpen,
  Share2,
  CheckCheck,
  MailOpen,
  Reply,
  Menu,
  PanelLeft,
  PanelLeftClose,
  LayoutGrid,
  GripVertical
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
  has_details?: boolean;
  is_case_study?: boolean;
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
  is_read?: boolean;
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
  const router = useRouter();
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Navigation tab & drawer state
  const [activeTab, setActiveTab] = useState<"site" | "case_studies" | "portfolio" | "pricing" | "inquiries" | "settings" | "forms" | "presentations" | "portals">("site");
  const [portfolioSubTab, setPortfolioSubTab] = useState<"branding" | "graphic" | "product">("branding");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Database datasets state
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [cardServiceItems, setCardServiceItems] = useState<CardServiceItem[]>([]);
  const [showcaseImages, setShowcaseImages] = useState<{ id: string; url_path: string; position: number }[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [heroUploadProgress, setHeroUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [projectUploading, setProjectUploading] = useState(false);
  const [projectUploadProgress, setProjectUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [projectShowcaseImages, setProjectShowcaseImages] = useState<any[]>([]);
  const [draggedHeroShowcaseIdx, setDraggedHeroShowcaseIdx] = useState<number | null>(null);
  const [dragOverHeroShowcaseIdx, setDragOverHeroShowcaseIdx] = useState<number | null>(null);
  const [draggedProjectShowcaseIdx, setDraggedProjectShowcaseIdx] = useState<number | null>(null);
  const [dragOverProjectShowcaseIdx, setDragOverProjectShowcaseIdx] = useState<number | null>(null);
  const [draggedProjectIdx, setDraggedProjectIdx] = useState<number | null>(null);
  const [dragOverProjectIdx, setDragOverProjectIdx] = useState<number | null>(null);
  const [isProjectsOrderDirty, setIsProjectsOrderDirty] = useState(false);
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
    if (savedTab === "site" || savedTab === "case_studies" || savedTab === "portfolio" || savedTab === "pricing" || savedTab === "inquiries" || savedTab === "settings" || savedTab === "forms" || savedTab === "presentations" || savedTab === "portals") {
      setActiveTab(savedTab as any);
    }
    const savedSubTab = localStorage.getItem("tochay_admin_pricing_sub_tab");
    if (savedSubTab === "packages" || savedSubTab === "services" || savedSubTab === "coupons") {
      setPricingActiveSubTab(savedSubTab);
    }
    isMounted.current = true;
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    localStorage.setItem("tochay_admin_active_tab", tab);
  };

  useEffect(() => {
    if (isMounted.current) {
      localStorage.setItem("tochay_admin_pricing_sub_tab", pricingActiveSubTab);
    }
  }, [pricingActiveSubTab]);
  const [showInclusionsModal, setShowInclusionsModal] = useState(false);
  
  const [inclusionsCardId, setInclusionsCardId] = useState<string | null>(null);
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState<string>("");

  // Inquiry filter & action states
  const [inquiryFilter, setInquiryFilter] = useState<"all" | "unread" | "read">("all");
  const [deletingInquiryId, setDeletingInquiryId] = useState<string | null>(null);

  const handleToggleInquiryRead = async (id: string, currentReadStatus: boolean) => {
    const nextStatus = !currentReadStatus;
    // Optimistic update
    setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, is_read: nextStatus } : inq));

    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: nextStatus })
        .eq("id", id);

      if (error) throw error;
      setAlert({
        type: "success",
        message: nextStatus ? "Marked inquiry as read" : "Marked inquiry as unread",
      });
    } catch (err: any) {
      console.error("Failed to update inquiry read status:", err);
      setAlert({ type: "error", message: "Failed to update inquiry status" });
      // Revert if error
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, is_read: currentReadStatus } : inq));
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this contact inquiry?")) {
      return;
    }

    setDeletingInquiryId(id);
    const prevInquiries = [...inquiries];
    setInquiries(prev => prev.filter(inq => inq.id !== id));

    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setAlert({ type: "success", message: "Inquiry deleted successfully" });
    } catch (err: any) {
      console.error("Failed to delete inquiry:", err);
      setAlert({ type: "error", message: "Failed to delete inquiry" });
      setInquiries(prevInquiries);
    } finally {
      setDeletingInquiryId(null);
    }
  };

  const handleMarkAllInquiriesAsRead = async () => {
    const unreadInquiries = inquiries.filter(inq => !inq.is_read);
    if (unreadInquiries.length === 0) return;

    const prevInquiries = [...inquiries];
    setInquiries(prev => prev.map(inq => ({ ...inq, is_read: true })));

    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("is_read", false);

      if (error) throw error;
      setAlert({ type: "success", message: "All inquiries marked as read" });
    } catch (err: any) {
      console.error("Failed to mark all as read:", err);
      setAlert({ type: "error", message: "Failed to mark all inquiries as read" });
      setInquiries(prevInquiries);
    }
  };

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
      try {
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
      } catch (err) {
        console.warn("Auth session check error:", err);
      } finally {
        setIsAuthChecking(false);
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
        } else {
          const localData = localStorage.getItem("tochay_offline_showcase_images");
          if (localData) {
            const parsed = JSON.parse(localData);
            setShowcaseImages(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load showcase images from Supabase, checking local cache fallback:", err);
        const localData = localStorage.getItem("tochay_offline_showcase_images");
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            setShowcaseImages(parsed);
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
      has_details: project.has_details ?? true,
      is_case_study: project.is_case_study ?? true,
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
        position: editingProject.id ? (editingProject.position ?? 0) : projects.length,
        has_details: editingProject.has_details ?? true,
        is_case_study: editingProject.is_case_study ?? true
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

  const handleDragDropProject = (targetIdx: number) => {
    if (draggedProjectIdx === null || draggedProjectIdx === targetIdx) {
      setDraggedProjectIdx(null);
      setDragOverProjectIdx(null);
      return;
    }
    setProjects(prev => {
      const copy = [...prev];
      const item = copy.splice(draggedProjectIdx, 1)[0];
      copy.splice(targetIdx, 0, item);
      return copy;
    });
    setIsProjectsOrderDirty(true);
    setDraggedProjectIdx(null);
    setDragOverProjectIdx(null);
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
      localStorage.setItem("tochay_offline_site_settings", JSON.stringify(bankSettings));

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
      setAlert({ type: "success", message: "Site configuration saved locally (offline mode)." });
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
  const handleAddShowcaseImage = (url: string) => {
    const tempId = `temp-${Math.random().toString(36).substring(2)}-${Date.now()}`;
    const newImage = { id: tempId, url_path: url, position: showcaseImages.length + 1 };
    setShowcaseImages(prev => [...prev, newImage]);
  };

  // Mutators: Delete Showcase image (LOCAL STATE ONLY)
  const handleDeleteShowcaseImage = (id: string) => {
    setShowcaseImages(prev => prev.filter(img => img.id !== id));
  };

  // Swap positions in local state
  const moveShowcaseImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= showcaseImages.length) return;

    setShowcaseImages(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      
      // Update position order dynamically based on index
      return next.map((img, idx) => ({ ...img, position: idx + 1 }));
    });
  };

  const handleDragDropHeroShowcase = (targetIdx: number) => {
    if (draggedHeroShowcaseIdx === null || draggedHeroShowcaseIdx === targetIdx) {
      setDraggedHeroShowcaseIdx(null);
      setDragOverHeroShowcaseIdx(null);
      return;
    }
    setShowcaseImages(prev => {
      const copy = [...prev];
      const item = copy.splice(draggedHeroShowcaseIdx, 1)[0];
      copy.splice(targetIdx, 0, item);
      return copy.map((img, idx) => ({ ...img, position: idx + 1 }));
    });
    setDraggedHeroShowcaseIdx(null);
    setDragOverHeroShowcaseIdx(null);
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

  // Image Upload helper (Real-time incremental append)
  const uploadShowcaseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setHeroUploadProgress({ current: 0, total: files.length });
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

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

      if (!uploadedUrl) {
        // 2. Base64 database storage fallback (with client-side image compression)
        try {
          uploadedUrl = await compressImage(file, 1200, 0.7);
        } catch (base64Err) {
          console.error("Compression fallback failed:", base64Err);
        }
      }

      if (uploadedUrl) {
        // Real-time render: Immediately append as each image finishes loading
        handleAddShowcaseImage(uploadedUrl);
        successCount++;
      }
      setHeroUploadProgress({ current: i + 1, total: files.length });
    }

    setUploading(false);
    setHeroUploadProgress(null);
    if (successCount > 0) {
      setAlert({ type: "success", message: `Added ${successCount} image(s) to hero slideshow layout.` });
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

  // Showcase Gallery upload files (Real-time incremental append)
  const handleUploadShowcaseBlockFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProjectUploading(true);
    setProjectUploadProgress({ current: 0, total: files.length });
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
        // Real-time render: Immediately append to state as soon as each image finishes!
        setProjectShowcaseImages(prev => [...prev, newBlock]);
        successCount++;
      }
      setProjectUploadProgress({ current: i + 1, total: files.length });
    }

    setProjectUploading(false);
    setProjectUploadProgress(null);
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

  const handleDragDropProjectShowcase = (targetIdx: number) => {
    if (draggedProjectShowcaseIdx === null || draggedProjectShowcaseIdx === targetIdx) {
      setDraggedProjectShowcaseIdx(null);
      setDragOverProjectShowcaseIdx(null);
      return;
    }
    setProjectShowcaseImages(prev => {
      const copy = [...prev];
      const item = copy.splice(draggedProjectShowcaseIdx, 1)[0];
      copy.splice(targetIdx, 0, item);
      return copy.map((block, index) => ({ ...block, display_order: index + 1 }));
    });
    setDraggedProjectShowcaseIdx(null);
    setDragOverProjectShowcaseIdx(null);
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

  // Render loading state while checking session
  if (isAuthChecking) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f7] flex items-center justify-center select-none animate-pulse">
        <Image
          src="/images/toflogoblack.png"
          alt="Loading..."
          width={38}
          height={38}
          className="w-auto h-9 object-contain"
          priority
        />
      </main>
    );
  }

  // Render Login Gate Screen
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col justify-center items-center p-6 font-sans tochay-admin tochay-admin-login">


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

  // Admin Tabs Definition
  const ADMIN_TABS = [
    { id: "site" as const, label: "Site Controls", icon: Eye },
    { id: "case_studies" as const, label: "Case Studies", icon: BookOpen },
    { id: "portfolio" as const, label: "Portfolio", icon: FolderKanban },
    { id: "pricing" as const, label: "Rates & Pricing", icon: Tag },
    { 
      id: "inquiries" as const, 
      label: "Contact Inquiries", 
      icon: Mail, 
      badge: inquiries.filter(i => !i.is_read).length > 0 
        ? `${inquiries.filter(i => !i.is_read).length} new` 
        : inquiries.length > 0 ? `${inquiries.length}` : null,
      badgeHighlight: inquiries.some(i => !i.is_read)
    },
    { id: "forms" as const, label: "Custom Forms", icon: FileText },
    { id: "settings" as const, label: "Settings & Coupons", icon: Settings },
    { id: "presentations" as const, label: "Client Decks", icon: Share2 },
    { id: "portals" as const, label: "Client Portals", icon: Layers }
  ];

  const currentTabObj = ADMIN_TABS.find(t => t.id === activeTab) || ADMIN_TABS[0];
  const CurrentTabIcon = currentTabObj.icon;

  // Render Dashboard Workspace
  return (
    <main data-lenis-prevent className="min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans relative tochay-admin tochay-admin-grid">
      
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
      <header className="w-full border-b border-zinc-200 bg-white px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between select-none sticky top-0 z-50 shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Hamburger / Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setIsMobileDrawerOpen(true);
              } else {
                setIsSidebarOpen(!isSidebarOpen);
              }
            }}
            className="p-2 -ml-1 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer flex items-center justify-center"
            title={isSidebarOpen ? "Collapse Navigation" : "Expand Navigation"}
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <Image
              src="/images/toflogoblack.png"
              alt="TY Logo"
              width={26}
              height={26}
              className="w-auto h-6 sm:h-7 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-sans font-black text-xs sm:text-sm tracking-tight text-zinc-950">TY STUDIO</span>
              <span className="font-mono text-[8px] font-semibold text-zinc-400 uppercase tracking-widest leading-none">
                Control Panel
              </span>
            </div>
          </div>

          {/* Current Active Tab Breadcrumb Badge */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-zinc-200">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 font-sans font-bold text-xs text-zinc-900">
              <CurrentTabIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>{currentTabObj.label}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden sm:inline-block font-mono text-[10px] text-zinc-400 font-semibold bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full shrink-0">
            {timeStr}
          </span>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl hover:bg-red-50 font-sans font-bold text-xs text-zinc-500 hover:text-red-600 transition-all cursor-pointer"
          >
            <span className="hidden xs:inline">Exit Session</span>
            <LogOut className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </header>

      {/* Mobile/Tablet Horizontal Swipeable Tab Bar */}
      <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto scrollbar-none px-4 py-2.5 bg-white border-b border-zinc-200/80 select-none w-full shrink-0">
        {ADMIN_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-full font-sans font-bold text-xs tracking-tight transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap border ${
                isActive
                  ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                  : "bg-zinc-50/80 text-zinc-600 hover:text-zinc-950 border-zinc-200/80 hover:bg-zinc-100"
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  tab.badgeHighlight
                    ? "bg-[#ffd230] text-zinc-950"
                    : isActive ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Slide-over Drawer Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-[85%] max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6 border-r border-zinc-200 animate-slide-in-left">
            
            {/* Top Bar */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/images/toflogoblack.png"
                    alt="TY Logo"
                    width={26}
                    height={26}
                    className="w-auto h-6 object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="font-sans font-bold text-xs tracking-tight text-zinc-950">TY STUDIO</span>
                    <span className="font-mono text-[8px] text-zinc-400 uppercase tracking-widest">Navigation</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none pr-1">
                {ADMIN_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        handleTabChange(tab.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-2xl flex items-center justify-between font-sans font-bold text-xs tracking-tight transition-all cursor-pointer border ${
                        isActive
                          ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                          : "bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          tab.badgeHighlight
                            ? "bg-[#ffd230] text-zinc-950"
                            : isActive ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-500"
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3">
              <span className="font-mono text-[10px] text-zinc-400 text-center">
                {timeStr}
              </span>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-sans font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Session</span>
              </button>
            </div>

          </div>

          {/* Click outside backdrop to close */}
          <div 
            className="flex-grow h-full cursor-pointer" 
            onClick={() => setIsMobileDrawerOpen(false)} 
          />
        </div>
      )}

      {/* Full-Screen Main Admin Workspace */}
      <div className="flex-grow w-full flex p-3 sm:p-5 lg:p-6 gap-5 lg:gap-6 max-w-none">
        
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden lg:flex flex-col gap-1.5 shrink-0 select-none transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-60 xl:w-64 opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none -ml-6"
          }`}
        >
          <div className="sticky top-20 flex flex-col gap-1.5 bg-white/70 backdrop-blur-md p-2.5 rounded-3xl border border-zinc-200/80 shadow-2xs">
            {ADMIN_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full px-4 py-2.5 rounded-2xl flex items-center justify-between font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
                    isActive
                      ? "bg-zinc-950 text-white border-zinc-950 shadow-xs font-bold"
                      : "bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TabIcon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-zinc-400"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      tab.badgeHighlight
                        ? "bg-[#ffd230] text-zinc-950"
                        : isActive ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Central Workspace Tab Body - Edge-to-Edge Full Screen Responsive */}
        <section className="flex-grow w-full bg-white border border-zinc-200/90 rounded-3xl p-5 sm:p-7 lg:p-9 shadow-xs min-h-[calc(100vh-120px)] overflow-x-hidden">
          
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
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                        Image File Path or External URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /images/portfolio-templates.png"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans outline-none focus:outline-none focus:ring-0 text-zinc-950"
                      />
                    </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 select-none">
                    <button
                      disabled={uploading}
                      onClick={() => {
                        if (!newImageUrl.trim()) return;
                        handleAddShowcaseImage(newImageUrl.trim());
                        setNewImageUrl("");
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
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-semibold text-xs text-zinc-400 uppercase tracking-wider pl-0.5 select-none">
                      Current Setup ({showcaseImages.length} Slides) — Drag or use arrows to reorder
                    </span>
                    {heroUploadProgress && (
                      <span className="font-sans font-bold text-[10px] text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading {heroUploadProgress.current} of {heroUploadProgress.total}...</span>
                      </span>
                    )}
                  </div>
                  {showcaseImages.length === 0 ? (
                    <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-12 flex flex-col items-center justify-center text-center select-none">
                      <AlertCircle className="w-8 h-8 text-zinc-300 mb-2" />
                      <span className="font-sans font-bold text-zinc-400 text-xs">No Showcase Images Uploaded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {showcaseImages.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", `${idx}`);
                            setDraggedHeroShowcaseIdx(idx);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverHeroShowcaseIdx(idx);
                          }}
                          onDragLeave={() => {
                            if (dragOverHeroShowcaseIdx === idx) setDragOverHeroShowcaseIdx(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDragDropHeroShowcase(idx);
                          }}
                          onDragEnd={() => {
                            setDraggedHeroShowcaseIdx(null);
                            setDragOverHeroShowcaseIdx(null);
                          }}
                          className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-grab active:cursor-grabbing select-none ${
                            draggedHeroShowcaseIdx === idx
                              ? "opacity-40 border-dashed border-zinc-400 bg-zinc-50 scale-98"
                              : dragOverHeroShowcaseIdx === idx
                              ? "border-zinc-950 bg-zinc-100 shadow-sm scale-101"
                              : "border-zinc-200 bg-white hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-3.5 flex-grow min-w-0">
                            {/* Drag Grip Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-700 shrink-0 p-0.5" title="Drag to reorder">
                              <GripVertical className="w-4 h-4" />
                            </div>

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
                                Slide {idx + 1}
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

                            <button
                              onClick={() => handleDeleteShowcaseImage(img.id)}
                              className="text-zinc-400 hover:text-red-650 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
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

          {/* TAB 1: SHOWCAS          {/* TAB 1: CASE STUDIES */}
          {activeTab === "case_studies" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-4 border-b border-zinc-100">
                <div className="flex flex-col">
                  <h2 className="font-sans font-bold text-xl text-zinc-950">Case Studies Showcase</h2>
                  <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">Feature project case studies on the home page slider</p>
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
                        full_text: "",
                        has_details: true,
                        is_case_study: true
                      });
                      setProjectShowcaseImages([]);
                      setShowProjectModal(true);
                    }}
                    className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Case Study</span>
                  </button>
                </div>
              </div>

              {projects.filter(p => p.is_case_study).length === 0 ? (
                <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center select-none">
                  <FolderKanban className="w-10 h-10 text-zinc-200 mb-3" />
                  <span className="font-sans font-bold text-zinc-400 text-sm">No Case Studies in Database</span>
                  <p className="font-sans font-normal text-zinc-400 text-xs max-w-xs mt-1 leading-normal">
                    Create a case study or toggle 'Show in Case Studies' on a project to feature it.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {projects
                    .map((project, index) => ({ project, index }))
                    .filter(({ project }) => project.is_case_study)
                    .map(({ project, index }) => (
                      <div
                        key={project.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", `${index}`);
                          setDraggedProjectIdx(index);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverProjectIdx(index);
                        }}
                        onDragLeave={() => {
                          if (dragOverProjectIdx === index) setDragOverProjectIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDragDropProject(index);
                        }}
                        onDragEnd={() => {
                          setDraggedProjectIdx(null);
                          setDragOverProjectIdx(null);
                        }}
                        className={`border rounded-2xl p-4 flex items-start gap-4 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                          draggedProjectIdx === index
                            ? "opacity-40 border-dashed border-zinc-400 bg-zinc-50 scale-98"
                            : dragOverProjectIdx === index
                            ? "border-zinc-950 bg-zinc-100 shadow-md scale-[1.01]"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md"
                        }`}
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

          {/* TAB 2: PORTFOLIO DESIGN ASSETS */}
          {activeTab === "portfolio" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-4 border-b border-zinc-100">
                <div className="flex flex-col">
                  <h2 className="font-sans font-bold text-xl text-zinc-950">Portfolio Design Assets</h2>
                  <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">Manage standalone designs and category assets</p>
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
                      const defCategory =
                        portfolioSubTab === "branding"
                          ? "BRAND DESIGN"
                          : portfolioSubTab === "graphic"
                          ? "GRAPHIC DESIGN"
                          : "PRODUCT DESIGN";
                      setEditingProject({
                        title: "",
                        slug: "",
                        category: defCategory,
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
                        full_text: "",
                        has_details: false,
                        is_case_study: false
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

              {/* Sub-Tabs Nav Bar */}
              <div className="flex border-b border-zinc-100 select-none -mt-2">
                <button
                  onClick={() => setPortfolioSubTab("branding")}
                  className={`px-5 py-2.5 font-sans font-bold text-xs tracking-tight border-b-2 transition-all cursor-pointer ${
                    portfolioSubTab === "branding"
                      ? "border-zinc-950 text-zinc-950"
                      : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  Branding
                </button>
                <button
                  onClick={() => setPortfolioSubTab("graphic")}
                  className={`px-5 py-2.5 font-sans font-bold text-xs tracking-tight border-b-2 transition-all cursor-pointer ${
                    portfolioSubTab === "graphic"
                      ? "border-zinc-950 text-zinc-950"
                      : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  Graphic Design
                </button>
                <button
                  onClick={() => setPortfolioSubTab("product")}
                  className={`px-5 py-2.5 font-sans font-bold text-xs tracking-tight border-b-2 transition-all cursor-pointer ${
                    portfolioSubTab === "product"
                      ? "border-zinc-950 text-zinc-950"
                      : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  Product Design
                </button>
              </div>

              {projects.filter(p => {
                if (portfolioSubTab === "branding") {
                  return p.category === "BRAND DESIGN" || p.category === "BRAND SYSTEM" || p.category === "IDENTITY" || p.category === "VISUAL SYSTEM";
                } else if (portfolioSubTab === "graphic") {
                  return p.category === "GRAPHIC DESIGN" || p.category === "PACKAGING" || p.category === "ART DIRECTION" || p.category === "MOTION";
                } else {
                  return p.category === "PRODUCT DESIGN" || p.category === "UI/UX";
                }
              }).length === 0 ? (
                <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center select-none bg-zinc-50/20">
                  <FolderKanban className="w-10 h-10 text-zinc-200 mb-3" />
                  <span className="font-sans font-bold text-zinc-400 text-sm">No Projects in this category</span>
                  <p className="font-sans font-normal text-zinc-400 text-xs max-w-xs mt-1 leading-normal">
                    Click 'Create Project' to add visual design cards to this category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {projects
                    .map((project, index) => ({ project, index }))
                    .filter(({ project }) => {
                      if (portfolioSubTab === "branding") {
                        return project.category === "BRAND DESIGN" || project.category === "BRAND SYSTEM" || project.category === "IDENTITY" || project.category === "VISUAL SYSTEM";
                      } else if (portfolioSubTab === "graphic") {
                        return project.category === "GRAPHIC DESIGN" || project.category === "PACKAGING" || project.category === "ART DIRECTION" || project.category === "MOTION";
                      } else {
                        return project.category === "PRODUCT DESIGN" || project.category === "UI/UX";
                      }
                    })
                    .map(({ project, index }) => (
                      <div
                        key={project.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", `${index}`);
                          setDraggedProjectIdx(index);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverProjectIdx(index);
                        }}
                        onDragLeave={() => {
                          if (dragOverProjectIdx === index) setDragOverProjectIdx(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDragDropProject(index);
                        }}
                        onDragEnd={() => {
                          setDraggedProjectIdx(null);
                          setDragOverProjectIdx(null);
                        }}
                        className={`border rounded-2xl p-4 flex items-start gap-4 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                          draggedProjectIdx === index
                            ? "opacity-40 border-dashed border-zinc-400 bg-zinc-50 scale-98"
                            : dragOverProjectIdx === index
                            ? "border-zinc-950 bg-zinc-100 shadow-md scale-[1.01]"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md"
                        }`}
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
              {/* Header with Title & Filter / Bulk Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 select-none">
                <div>
                  <h2 className="font-sans font-bold text-xl text-zinc-950">Contact Inquiries</h2>
                  <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">
                    Messages and project inquiries submitted via your portfolio contact section
                  </p>
                </div>

                {inquiries.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Pills */}
                    <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                      <button
                        onClick={() => setInquiryFilter("all")}
                        className={`px-3 py-1 rounded-lg font-sans font-semibold text-[11px] transition-all cursor-pointer ${
                          inquiryFilter === "all"
                            ? "bg-white text-zinc-950 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        All ({inquiries.length})
                      </button>
                      <button
                        onClick={() => setInquiryFilter("unread")}
                        className={`px-3 py-1 rounded-lg font-sans font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                          inquiryFilter === "unread"
                            ? "bg-white text-zinc-950 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        {inquiries.some(i => !i.is_read) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        )}
                        Unread ({inquiries.filter(i => !i.is_read).length})
                      </button>
                      <button
                        onClick={() => setInquiryFilter("read")}
                        className={`px-3 py-1 rounded-lg font-sans font-semibold text-[11px] transition-all cursor-pointer ${
                          inquiryFilter === "read"
                            ? "bg-white text-zinc-950 shadow-xs"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        Read ({inquiries.filter(i => i.is_read).length})
                      </button>
                    </div>

                    {/* Mark All as Read Button */}
                    {inquiries.some(i => !i.is_read) && (
                      <button
                        onClick={handleMarkAllInquiriesAsRead}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white font-sans font-semibold text-[11px] hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Inquiry List */}
              {(() => {
                const filteredInquiries = inquiries.filter((inq) => {
                  if (inquiryFilter === "unread") return !inq.is_read;
                  if (inquiryFilter === "read") return !!inq.is_read;
                  return true;
                });

                if (inquiries.length === 0) {
                  return (
                    <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center select-none">
                      <Mail className="w-10 h-10 text-zinc-200 mb-3" />
                      <span className="font-sans font-bold text-zinc-400 text-sm">No Inquiries Found</span>
                      <p className="font-sans font-normal text-zinc-400 text-xs max-w-xs mt-1 leading-normal">
                        Form submissions from visitors will appear here automatically.
                      </p>
                    </div>
                  );
                }

                if (filteredInquiries.length === 0) {
                  return (
                    <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center select-none bg-zinc-50/50">
                      <MailOpen className="w-8 h-8 text-zinc-300 mb-2" />
                      <span className="font-sans font-semibold text-zinc-600 text-xs">
                        No {inquiryFilter} inquiries
                      </span>
                      <button
                        onClick={() => setInquiryFilter("all")}
                        className="font-sans font-bold text-xs text-[#09090b] underline mt-2 cursor-pointer"
                      >
                        View all inquiries
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-3.5">
                    {filteredInquiries.map((inq) => {
                      const isUnread = !inq.is_read;
                      const isDeleting = deletingInquiryId === inq.id;

                      return (
                        <div
                          key={inq.id}
                          className={`border rounded-2xl p-5 transition-all duration-200 flex flex-col gap-3 relative ${
                            isUnread
                              ? "bg-white border-amber-300/80 shadow-sm"
                              : "bg-zinc-50/60 border-zinc-200/80 opacity-90 hover:opacity-100"
                          } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          {/* Card Top Row: Sender Info & Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none pb-2 border-b border-zinc-100">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Unread Indicator Badge */}
                              {isUnread && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-sans font-bold text-[10px] uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                  New
                                </span>
                              )}

                              <span className="font-sans font-bold text-sm text-zinc-950">
                                {inq.name}
                              </span>

                              <a
                                href={`mailto:${inq.email}?subject=${encodeURIComponent(`Re: Inquiry from ${inq.name} - TY Studio`)}`}
                                className="font-sans font-medium text-[11px] text-zinc-500 hover:text-zinc-950 transition-colors bg-zinc-100 hover:bg-zinc-200 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1"
                              >
                                <span>{inq.email}</span>
                              </a>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <span className="font-mono text-[10px] text-zinc-400 mr-2">
                                {new Date(inq.created_at).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>

                              {/* Toggle Read / Unread */}
                              <button
                                onClick={() => handleToggleInquiryRead(inq.id, !!inq.is_read)}
                                title={isUnread ? "Mark as Read" : "Mark as Unread"}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-sans font-semibold text-[11px] transition-colors cursor-pointer border ${
                                  isUnread
                                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                                    : "bg-white hover:bg-zinc-100 text-zinc-500 border-zinc-200"
                                }`}
                              >
                                {isUnread ? (
                                  <>
                                    <Check className="w-3 h-3 text-zinc-700" />
                                    <span>Mark Read</span>
                                  </>
                                ) : (
                                  <>
                                    <MailOpen className="w-3 h-3 text-zinc-400" />
                                    <span>Unread</span>
                                  </>
                                )}
                              </button>

                              {/* Direct Reply Button */}
                              <a
                                href={`mailto:${inq.email}?subject=${encodeURIComponent(`Re: Inquiry from ${inq.name} - TY Studio`)}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-sans font-semibold text-[11px] bg-[#ffd230] text-zinc-950 hover:bg-[#ffe17d] transition-colors cursor-pointer"
                              >
                                <Reply className="w-3 h-3" />
                                <span>Reply</span>
                              </a>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteInquiry(inq.id)}
                                disabled={isDeleting}
                                title="Delete Inquiry"
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Message Body */}
                          <div className="pt-1">
                            <p className="font-sans font-normal text-zinc-700 text-xs sm:text-sm leading-relaxed max-w-3xl whitespace-pre-wrap">
                              {inq.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4b: CUSTOM FORMS */}
          {activeTab === "forms" && (
            <FormBuilderTab />
          )}

          {/* TAB 4c: CLIENT PRESENTATION DECKS */}
          {activeTab === "presentations" && (
            <PresentationsTab />
          )}

          {/* TAB 4d: CLIENT PROJECT PORTALS */}
          {activeTab === "portals" && (
            <ClientPortalsTab />
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
      <footer className="w-full border-t border-zinc-200/80 bg-white py-5 select-none mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="font-sans font-bold text-xs text-zinc-400">
            TY STUDIO CONTROL PANEL &bull; {new Date().getFullYear()}
          </span>
          <span className="font-sans font-normal text-[11px] text-zinc-400">
            Connected to Supabase Live Database
          </span>
        </div>
      </footer>

      {/* FULL-PAGE PORTFOLIO PROJECT / CASE STUDY EDITOR */}
      {showProjectModal && editingProject && (
        <div data-lenis-prevent className="fixed inset-0 z-[70] bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans overflow-y-auto animate-fade-in select-none">
          {/* Top Sticky Header Bar */}
          <header className="w-full border-b border-zinc-200 bg-white px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between select-none sticky top-0 z-50 shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-sans font-bold text-xs text-zinc-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Admin</span>
              </button>

              <div className="flex flex-col">
                <h2 className="font-sans font-bold text-sm sm:text-base text-zinc-950">
                  {editingProject.id 
                    ? (editingProject.is_case_study ? `Edit Case Study: ${editingProject.title || "Untitled"}` : `Edit Project: ${editingProject.title || "Untitled"}`)
                    : (editingProject.is_case_study ? "Create New Case Study" : "Create New Project")}
                </h2>
                <span className="hidden sm:inline font-sans text-[11px] text-zinc-400">
                  Configure project metadata, narrative case study story, and showcase media
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                }}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-sans font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white font-sans font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingProject.is_case_study ? "Save Case Study" : "Save Project"}</span>
              </button>
            </div>
          </header>

          {/* Full-Page Content Body */}
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
                
                {/* Column 1: Core Details */}
                <div className="flex flex-col gap-4">
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
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
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
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
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
                        className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                      >
                        <option value="BRAND DESIGN">BRAND DESIGN</option>
                        <option value="GRAPHIC DESIGN">GRAPHIC DESIGN</option>
                        <option value="PRODUCT DESIGN">PRODUCT DESIGN</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                        Industry Domain
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Consumer Tech"
                        value={editingProject.industry || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, industry: e.target.value })}
                        className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
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
                        value={editingProject.program || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, program: e.target.value })}
                        className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                        Stage
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Growth, Established"
                        value={editingProject.stage || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, stage: e.target.value })}
                        className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5 select-none">
                      Cover Image
                    </label>

                    {editingProject.image ? (
                      <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-grow">
                          <div className="w-16 h-12 rounded-xl bg-zinc-200 overflow-hidden border border-zinc-200/80 shrink-0 select-none">
                            <img
                              src={editingProject.image}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as any).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200";
                              }}
                            />
                          </div>
                          <div className="flex flex-col min-w-0 flex-grow">
                            <span className="font-sans font-bold text-xs text-zinc-950 truncate" title={editingProject.image}>
                              {editingProject.image.startsWith("data:") 
                                ? `Custom Upload (${Math.round((editingProject.image.length * 3) / 4 / 1024)} KB)` 
                                : editingProject.image.split("/").pop() || "Cover Image"}
                            </span>
                            <span className="font-sans text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <Check className="w-3 h-3" />
                              <span>Cover Active</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 select-none">
                          <div className="relative">
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
                              className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 rounded-xl text-xs font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-3xs"
                            >
                              {projectUploading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>Change</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditingProject({ ...editingProject, image: "", cover_image_url: "" })}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove Cover Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full border border-dashed border-zinc-200 hover:border-zinc-400 rounded-2xl p-4 flex items-center justify-between gap-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={uploadProjectCoverFile}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={projectUploading}
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-sans font-bold text-xs text-zinc-950">Upload Cover Image</span>
                            <span className="font-sans text-[10px] text-zinc-400">PNG, JPG, or WebP (Recommended 16:9 ratio)</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={projectUploading}
                          className="px-3.5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl text-xs font-sans font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          {projectUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>Select File</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Case study checkbox */}
                  <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                    <input
                      type="checkbox"
                      id="is_case_study"
                      checked={!!editingProject.is_case_study}
                      onChange={(e) => setEditingProject({ ...editingProject, is_case_study: e.target.checked })}
                      className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="is_case_study" className="font-sans font-bold text-xs text-zinc-950 cursor-pointer">
                      Show in Case Studies Page
                    </label>
                  </div>

                  {/* Enable Details Page Toggle */}
                  <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                    <input
                      type="checkbox"
                      id="has_details"
                      checked={!!editingProject.has_details}
                      onChange={(e) => setEditingProject({ ...editingProject, has_details: e.target.checked })}
                      className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex flex-col cursor-pointer" onClick={() => setEditingProject({ ...editingProject, has_details: !editingProject.has_details })}>
                      <label htmlFor="has_details" className="font-sans font-bold text-xs text-zinc-950 cursor-pointer">
                        Enable Detailed Case Study Page
                      </label>
                      <span className="font-sans font-normal text-[10px] text-zinc-400">
                        When enabled, clicking this project card navigates to <code className="bg-zinc-200/60 px-1 py-0.5 rounded text-[9px]">/projects/{editingProject.slug || "slug"}</code>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Detailed Narrative & Media */}
                <div className="flex flex-col gap-4">
                  {editingProject.has_details ? (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                          Detail Subtitle / Overview Tagline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. An audio identity created for clarity, space, and emotion."
                          value={editingProject.subtitle || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, subtitle: e.target.value })}
                          className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                          Brief Summary Narrative (Left Column)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Short summary paragraph that introduces the challenge and scope..."
                          value={editingProject.summary_text || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, summary_text: e.target.value })}
                          className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-normal outline-hidden text-zinc-950 resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                          Full Story Narrative (Right Column)
                        </label>
                        <textarea
                          rows={5}
                          placeholder="Detailed case study breakdown, process narrative, design decisions..."
                          value={editingProject.full_text || ""}
                          onChange={(e) => setEditingProject({ ...editingProject, full_text: e.target.value })}
                          className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-normal outline-hidden text-zinc-950 resize-none"
                        />
                      </div>

                      {/* Showcase Gallery Images */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">
                            Showcase Gallery Images ({projectShowcaseImages.length}) — Drag or use arrows
                          </label>
                          <div className="flex items-center gap-2">
                            {projectUploadProgress && (
                              <span className="font-sans font-bold text-[10px] text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Uploading {projectUploadProgress.current} of {projectUploadProgress.total}...</span>
                              </span>
                            )}
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleUploadShowcaseBlockFiles}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={projectUploading}
                              />
                              <button
                                type="button"
                                disabled={projectUploading}
                                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-sans font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {projectUploading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                                <span>Upload Showcase Images</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {projectShowcaseImages.length === 0 ? (
                          <div className="w-full border border-dashed border-zinc-200 rounded-xl py-6 flex flex-col items-center justify-center text-center select-none bg-zinc-50/50">
                            <span className="font-sans text-xs text-zinc-400">No showcase images added yet.</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 max-h-[540px] overflow-y-auto pr-1">
                            {projectShowcaseImages.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", `${idx}`);
                                  setDraggedProjectShowcaseIdx(idx);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDragOverProjectShowcaseIdx(idx);
                                }}
                                onDragLeave={() => {
                                  if (dragOverProjectShowcaseIdx === idx) setDragOverProjectShowcaseIdx(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleDragDropProjectShowcase(idx);
                                }}
                                onDragEnd={() => {
                                  setDraggedProjectShowcaseIdx(null);
                                  setDragOverProjectShowcaseIdx(null);
                                }}
                                className={`flex items-center justify-between p-2.5 rounded-xl gap-3 transition-all cursor-grab active:cursor-grabbing select-none ${
                                  draggedProjectShowcaseIdx === idx
                                    ? "opacity-40 border-dashed border-zinc-400 bg-zinc-50 scale-98"
                                    : dragOverProjectShowcaseIdx === idx
                                    ? "border-zinc-950 bg-zinc-100 shadow-sm scale-101"
                                    : "bg-zinc-50 border border-zinc-200 hover:border-zinc-300"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                                  {/* Drag Handle */}
                                  <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-700 shrink-0 p-0.5" title="Drag to reorder">
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  <span className="font-mono text-xs text-zinc-400 font-bold w-4 text-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="w-14 h-9 bg-zinc-200 rounded-lg overflow-hidden shrink-0 border border-zinc-200">
                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex flex-col gap-1 min-w-0 flex-grow">
                                    <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Placement</span>
                                    <div className="inline-flex items-center bg-zinc-200/60 p-0.5 rounded-lg border border-zinc-200/80 w-fit">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateBlockType(idx, "before")}
                                        className={`px-2.5 py-0.5 rounded-md font-sans font-bold text-[10px] transition-all cursor-pointer ${
                                          item.block_type === "before" || !item.block_type
                                            ? "bg-white text-zinc-950 shadow-3xs border border-zinc-200/60"
                                            : "text-zinc-500 hover:text-zinc-900"
                                        }`}
                                      >
                                        Before Story
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateBlockType(idx, "after")}
                                        className={`px-2.5 py-0.5 rounded-md font-sans font-bold text-[10px] transition-all cursor-pointer ${
                                          item.block_type === "after"
                                            ? "bg-white text-zinc-950 shadow-3xs border border-zinc-200/60"
                                            : "text-zinc-500 hover:text-zinc-900"
                                        }`}
                                      >
                                        After Story
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => moveBlockOrder(idx, "up")}
                                    className="p-1 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === projectShowcaseImages.length - 1}
                                    onClick={() => moveBlockOrder(idx, "down")}
                                    className="p-1 text-zinc-400 hover:text-zinc-950 disabled:opacity-30 cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteShowcaseBlock(idx)}
                                    className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-200 rounded-2xl bg-white/40 h-full min-h-[350px] select-none">
                      <FileText className="w-8 h-8 text-zinc-350 mb-2" />
                      <span className="font-sans font-bold text-zinc-400 text-xs">Narrative Details Disabled</span>
                      <p className="font-sans text-[10px] text-zinc-400 max-w-xs mt-1 leading-normal">
                        Toggle "Enable Detailed Case Study Page" on the left column to configure subtitles, case study story text, and gallery images.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMO COUPON FULL PAGE OVERLAY */}
      {showCouponModal && editingCoupon && (
        <div className="fixed inset-0 z-[70] bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans overflow-y-auto animate-fade-in select-none" data-lenis-prevent>
          <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowCouponModal(false);
                  setEditingCoupon(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-sans font-bold text-xs text-zinc-700 transition-colors cursor-pointer shrink-0"
                title="Back to pricing"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Pricing</span>
              </button>
              <div className="h-4 w-px bg-zinc-200 hidden sm:block shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-sans font-bold text-sm sm:text-base text-zinc-950 truncate">
                  {editingCoupon.id ? "Edit Promo Coupon" : "Create Promo Coupon"}
                </span>
                <span className="font-sans text-[11px] text-zinc-400 truncate">
                  {editingCoupon.code || "New Code"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCouponModal(false);
                  setEditingCoupon(null);
                }}
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer hidden xs:inline-flex"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCoupon}
                className="px-4.5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Coupon</span>
              </button>
            </div>
          </header>

          <div className="w-full max-w-xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-col gap-1.5">
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

              <div className="flex flex-col gap-1.5">
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

              <div className="flex flex-col gap-1.5">
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

              <div className="flex flex-col gap-1.5">
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
          </div>
        </div>
      )}

      {/* PACKAGE INCLUSIONS FULL PAGE OVERLAY */}
      {showInclusionsModal && inclusionsCardId && (
        <div className="fixed inset-0 z-[70] bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans overflow-y-auto animate-fade-in select-none" data-lenis-prevent>
          <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowInclusionsModal(false);
                  setInclusionsCardId(null);
                  setSelectedServiceToAdd("");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-sans font-bold text-xs text-zinc-700 transition-colors cursor-pointer shrink-0"
                title="Back to pricing"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Packages</span>
              </button>
              <div className="h-4 w-px bg-zinc-200 hidden sm:block shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-sans font-bold text-sm sm:text-base text-zinc-950 truncate">
                  Manage Package Items & Inclusions
                </span>
                <span className="font-sans text-[11px] text-zinc-400 truncate">
                  {cards.find(c => c.id === inclusionsCardId)?.name}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowInclusionsModal(false);
                setInclusionsCardId(null);
                setSelectedServiceToAdd("");
              }}
              className="px-4.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-sans font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              Done Managing
            </button>
          </header>

          <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Add New Inclusion Panel */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col gap-3">
                <span className="font-sans font-bold text-xs text-zinc-950 select-none">Add Deliverable / Master Service To Package:</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedServiceToAdd}
                    onChange={(e) => setSelectedServiceToAdd(e.target.value)}
                    className="flex-grow bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2.5 px-3 text-xs font-sans font-semibold outline-hidden text-zinc-950"
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
                    type="button"
                    onClick={() => {
                      if (!selectedServiceToAdd) return;
                      handleAddInclusion(inclusionsCardId, selectedServiceToAdd);
                      setSelectedServiceToAdd("");
                    }}
                    disabled={!selectedServiceToAdd}
                    className="px-5 py-2.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-bold text-xs transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                  >
                    Add to Suite
                  </button>
                </div>
              </div>

              {/* Current Inclusions List */}
              <div className="flex flex-col gap-3 pt-2">
                <span className="font-sans font-bold text-xs text-zinc-950 select-none">Current Deliverables in this Package Suite:</span>
                {cardServiceItems.filter(item => item.card_id === inclusionsCardId).length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-zinc-200 rounded-2xl select-none">
                    <span className="font-sans text-xs text-zinc-400 italic">No services mapped to this package card yet. Add one above.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cardServiceItems
                      .filter(item => item.card_id === inclusionsCardId)
                      .map((item) => {
                        const baseName = item.master_services?.name || "Service Item";
                        const basePrice = item.master_services?.price || 0;
                        return (
                          <div key={item.id} className="border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3 bg-zinc-50/40">
                            <div className="flex items-center justify-between select-none">
                              <span className="font-sans font-bold text-xs text-zinc-950">{baseName} <span className="font-normal text-zinc-400">(Base Master Rate: ₦{basePrice.toLocaleString()})</span></span>
                              <button
                                type="button"
                                onClick={() => handleRemoveInclusion(item.id)}
                                className="text-zinc-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove item"
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
                                  className="bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2 px-3 text-xs font-sans text-zinc-950 outline-hidden"
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
                                  className="bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2 px-3 text-xs font-sans text-zinc-950 outline-hidden"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveInclusionOverride(item.id, item.custom_name || "", item.price_override !== undefined ? item.price_override : null)}
                              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-sans font-bold text-xs self-start transition-all cursor-pointer shadow-3xs"
                            >
                              Save Overrides
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUITE CARD DETAIL FULL PAGE OVERLAY */}
      {showCardModal && editingCard && (
        <div className="fixed inset-0 z-[70] bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans overflow-y-auto animate-fade-in select-none" data-lenis-prevent>
          <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowCardModal(false);
                  setEditingCard(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-sans font-bold text-xs text-zinc-700 transition-colors cursor-pointer shrink-0"
                title="Back to pricing"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Packages</span>
              </button>
              <div className="h-4 w-px bg-zinc-200 hidden sm:block shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-sans font-bold text-sm sm:text-base text-zinc-950 truncate">
                  {editingCard.id ? "Edit Suite Package" : "Create Suite Package"}
                </span>
                <span className="font-sans text-[11px] text-zinc-400 truncate">
                  {editingCard.name || "Untitled Package"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCardModal(false);
                  setEditingCard(null);
                }}
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer hidden xs:inline-flex"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCard}
                className="px-4.5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Package</span>
              </button>
            </div>
          </header>

          <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-col gap-1.5">
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
                <div className="flex flex-col gap-1.5">
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

                <div className="flex flex-col gap-1.5">
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

              <div className="flex flex-col gap-1.5">
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

              <div className="flex items-center gap-2 pt-1 select-none">
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
                <div className="flex flex-col gap-1.5 mt-1">
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
          </div>
        </div>
      )}

      {/* MASTER SERVICE FULL PAGE OVERLAY */}
      {showServiceModal && editingService && (
        <div className="fixed inset-0 z-[70] bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans overflow-y-auto animate-fade-in select-none" data-lenis-prevent>
          <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingService(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-sans font-bold text-xs text-zinc-700 transition-colors cursor-pointer shrink-0"
                title="Back to pricing"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Services</span>
              </button>
              <div className="h-4 w-px bg-zinc-200 hidden sm:block shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-sans font-bold text-sm sm:text-base text-zinc-950 truncate">
                  {editingService.id ? "Edit One-Off Service" : "Create One-Off Service"}
                </span>
                <span className="font-sans text-[11px] text-zinc-400 truncate">
                  {editingService.name || "Untitled Service"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingService(null);
                }}
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer hidden xs:inline-flex"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                className="px-4.5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Service</span>
              </button>
            </div>
          </header>

          <div className="w-full max-w-xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-col gap-1.5">
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

              <div className="flex flex-col gap-1.5">
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

              <div className="flex flex-col gap-1.5">
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

              <div className="flex items-center gap-2 pt-1 select-none">
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
                <div className="flex flex-col gap-1.5 mt-1">
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
          </div>
        </div>
      )}

    </main>
  );
}
