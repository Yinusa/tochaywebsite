"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  Check, 
  Clock, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  X, 
  MessageSquare, 
  ExternalLink, 
  Shield, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  FolderOpen, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Loader2, 
  Maximize2, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Mail,
  Phone,
  DollarSign,
  ArrowUpRight,
  Receipt,
  FileCheck2,
  Settings,
  Trash2,
  Bell,
  Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface PhasePresentation {
  id: string;
  presentation_id: string;
  version_label: string;
  is_current_version: boolean;
  deck_title?: string;
  client_name?: string;
  token?: string;
}

interface PortalPhase {
  id: string;
  portal_id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "inactive";
  sort_order: number;
  completed_at?: string | null;
  presentations?: PhasePresentation[];
}

interface PortalFile {
  id: string;
  portal_id: string;
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

interface ClientPortal {
  id: string;
  client_name: string;
  project_title: string;
  token: string;
  client_logo_url?: string | null;
  client_email?: string | null;
  notification_preferences?: {
    milestones?: boolean;
    presentations?: boolean;
    files?: boolean;
  } | null;
  status: "Onboarding" | "In Progress" | "In Review" | "Completed" | "On Hold";
  start_date?: string | null;
  target_delivery_date?: string | null;
  budget_total?: number;
  deposit_paid?: number;
  invoice_status?: "Deposit Paid" | "Awaiting Balance" | "Paid in Full";
  created_at: string;
  phases?: PortalPhase[];
  files?: PortalFile[];
  invoice_items?: PortalInvoiceItem[];
}

interface PresentationAsset {
  id: string;
  presentation_id: string;
  file_url: string;
  filename: string;
  category: string;
  sort_order: number;
  status: "Review" | "Approved" | "Rejected";
}

interface AssetComment {
  id?: string;
  presentation_asset_id: string;
  author_name: string;
  comment: string;
  created_at: string;
}

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"roadmap" | "files" | "financials" | "settings">("roadmap");

  // Client Notification Email Settings State
  const [clientEmailInput, setClientEmailInput] = useState("");
  const [clientNotifPrefs, setClientNotifPrefs] = useState({
    milestones: true,
    presentations: true,
    files: true
  });
  const [savingClientSettings, setSavingClientSettings] = useState(false);
  const [clientSettingsAlert, setClientSettingsAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Active Presentation deck per phase state: { [phaseId: string]: string (presentationId) }
  const [selectedDeckByPhase, setSelectedDeckByPhase] = useState<{ [phaseId: string]: string }>({});

  // Loaded Presentation Decks Data
  const [loadedDecks, setLoadedDecks] = useState<{
    [presId: string]: {
      deck: any;
      assets: PresentationAsset[];
      comments: { [assetId: string]: AssetComment[] };
    };
  }>({});

  // Lightbox Proofing modal state matching presentation deck
  const [activeAssetIdx, setActiveAssetIdx] = useState<number | null>(null);
  const [activePhaseAssets, setActivePhaseAssets] = useState<PresentationAsset[]>([]);
  const [lightboxDeckId, setLightboxDeckId] = useState<string | null>(null);
  const [lightboxDeckTitle, setLightboxDeckTitle] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("Client Reviewer");
  const [newComment, setNewComment] = useState("");
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [isFullscreenMedia, setIsFullscreenMedia] = useState<boolean>(true);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [collapsedPhases, setCollapsedPhases] = useState<{ [phaseId: string]: boolean }>({});

  const togglePhaseCollapse = (phaseId: string) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  // Site & Bank Settings state (synced with admin site_settings in Supabase)
  const [siteSettings, setSiteSettings] = useState({
    bank_name: "Opay Bank",
    account_number: "7062974830",
    account_name: "Oluwatofunmi Yinusa",
    contact_email: "tofunmiyinusa01@gmail.com",
    contact_phone: "+234 706 297 4830",
    legal_footer: "All services require 70% upfront payment. Final source deliverables are released only upon full settlement of the remaining balance."
  });

  // Countdown timer state
  const [countdownStr, setCountdownStr] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
    isOverdue: false,
    hasTarget: false
  });

  useEffect(() => {
    const savedName = localStorage.getItem("clientAuthorName");
    if (savedName) setAuthorName(savedName);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadPortal(true);

    // Silent background sync only when cross-tab storage changes (e.g. Admin updates data)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key || 
        e.key.startsWith("tochay_offline_client_portals") || 
        e.key.startsWith("tochay_offline_presentations") ||
        e.key.startsWith("tochay_offline_assets_")
      ) {
        loadPortal(false);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [token]);

  const loadPortal = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      // 1. Fetch portal from Supabase / localStorage fallback
      let portalData: ClientPortal | null = null;
      let cachedMatch: ClientPortal | null = null;
      
      const cached = localStorage.getItem("tochay_offline_client_portals");
      if (cached) {
        try {
          const list: ClientPortal[] = JSON.parse(cached);
          cachedMatch = list.find((p) => p.token === token) || null;
        } catch (e) {
          console.warn("Failed to parse cached portals:", e);
        }
      }

      try {
        const { data, error } = await supabase
          .from("client_portals")
          .select("*")
          .eq("token", token)
          .single();

        if (error) throw error;
        if (data) portalData = data;
      } catch (err) {
        console.warn("Cloud portal fetch notice, using fallback cache:", err);
        if (cachedMatch) portalData = cachedMatch;
      }

      if (!portalData && cachedMatch) {
        portalData = cachedMatch;
      }

      if (!portalData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // 2. Fetch Phases & Presentations
      let phases: PortalPhase[] = [];
      let files: PortalFile[] = [];

      try {
        const { data: phasesData } = await supabase
          .from("portal_phases")
          .select("*")
          .eq("portal_id", portalData.id)
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
          .eq("portal_id", portalData.id)
          .order("created_at", { ascending: false });

        if (filesData && filesData.length > 0) files = filesData;
      } catch (err) {
        console.warn("Child relations fetch notice:", err);
      }

      // Merge with local fallback if Supabase returned phases or files
      if (cachedMatch?.phases && cachedMatch.phases.length > 0) {
        if (phases.length === 0) {
          phases = cachedMatch.phases;
        } else {
          // Merge per-phase presentation links if Supabase child table was empty
          phases = phases.map((p, pIdx) => {
            const cachedP = cachedMatch.phases?.[pIdx];
            const pId = p.id || cachedP?.id || `phase_${pIdx}`;
            const hasPres = p.presentations && p.presentations.length > 0;
            return {
              ...p,
              id: pId,
              presentations: hasPres ? p.presentations : (cachedP?.presentations || [])
            };
          });
        }
      } else {
        phases = phases.map((p, pIdx) => ({
          ...p,
          id: p.id || `phase_${pIdx}`
        }));
      }

      if (files.length === 0 && cachedMatch?.files && cachedMatch.files.length > 0) {
        files = cachedMatch.files;
      }

      // Initialize selected presentation versions STRICTLY per phase
      const initialDeckMap: { [phaseId: string]: string } = {};
      const decksToFetchIds = new Set<string>();

      phases.forEach((phase, pIdx) => {
        const phaseKey = phase.id || `phase_${pIdx}`;
        if (phase.presentations && phase.presentations.length > 0) {
          const currentPres = phase.presentations.find((p) => p.is_current_version) || phase.presentations[0];
          if (currentPres && currentPres.presentation_id) {
            initialDeckMap[phaseKey] = currentPres.presentation_id;
            decksToFetchIds.add(currentPres.presentation_id);
          }
        }
      });

      setSelectedDeckByPhase(initialDeckMap);

      // 3. Fetch assets and comments for all linked presentations
      const loadedDecksObj: { [presId: string]: any } = {};

      for (const presId of Array.from(decksToFetchIds)) {
        try {
          let deckRecord: any = null;
          let assetsData: PresentationAsset[] = [];

          // Try Supabase first
          try {
            const { data: dbDeck } = await supabase
              .from("presentations")
              .select("*")
              .eq("id", presId)
              .single();
            if (dbDeck) deckRecord = dbDeck;

            const { data: dbAssets } = await supabase
              .from("presentation_assets")
              .select("*")
              .eq("presentation_id", presId)
              .order("sort_order", { ascending: true });
            if (dbAssets && dbAssets.length > 0) assetsData = dbAssets;
          } catch (e) {
            console.warn(`DB query notice for presentation ${presId}:`, e);
          }

          // Fallback to local storage presentations cache
          if (!deckRecord || assetsData.length === 0) {
            const cachedPresStr = localStorage.getItem("tochay_offline_presentations");
            if (cachedPresStr) {
              try {
                const localDecks = JSON.parse(cachedPresStr);
                const localDeck = localDecks.find((d: any) => d.id === presId);
                if (localDeck) {
                  if (!deckRecord) deckRecord = localDeck;
                  if (assetsData.length === 0) {
                    const localAssetsStr = localStorage.getItem(`tochay_offline_assets_${presId}`);
                    if (localAssetsStr) {
                      assetsData = JSON.parse(localAssetsStr);
                    } else if (localDeck.assets && localDeck.assets.length > 0) {
                      assetsData = localDeck.assets;
                    }
                  }
                }
              } catch (e) {
                console.warn("Failed to parse offline presentation cache:", e);
              }
            }
          }

          const commentsMap: { [assetId: string]: AssetComment[] } = {};
          if (assetsData && assetsData.length > 0) {
            const assetIds = assetsData.map((a) => a.id);
            try {
              const { data: commentsData } = await supabase
                .from("presentation_comments")
                .select("*")
                .in("presentation_asset_id", assetIds)
                .order("created_at", { ascending: true });

              if (commentsData) {
                commentsData.forEach((c) => {
                  if (!commentsMap[c.presentation_asset_id]) {
                    commentsMap[c.presentation_asset_id] = [];
                  }
                  commentsMap[c.presentation_asset_id].push(c);
                });
              }
            } catch (e) {
              console.warn("Comments DB query notice:", e);
            }
          }

          loadedDecksObj[presId] = {
            deck: deckRecord,
            assets: assetsData || [],
            comments: commentsMap
          };
        } catch (err) {
          console.warn(`Could not load presentation ${presId}:`, err);
        }
      }

      let invoiceItems: PortalInvoiceItem[] = portalData.invoice_items || [];
      if (!invoiceItems || invoiceItems.length === 0) {
        const cachedItems = localStorage.getItem(`tochay_offline_invoice_items_${portalData.id}`);
        if (cachedItems) {
          try { invoiceItems = JSON.parse(cachedItems); } catch (e) {}
        }
      }
      if ((!invoiceItems || invoiceItems.length === 0) && cachedMatch?.invoice_items) {
        invoiceItems = cachedMatch.invoice_items;
      }

      setLoadedDecks(loadedDecksObj);
      setPortal({
        ...portalData,
        phases,
        files,
        invoice_items: invoiceItems
      });

      if (portalData.client_email) {
        setClientEmailInput(portalData.client_email);
      }
      if (portalData.notification_preferences) {
        setClientNotifPrefs(prev => ({
          ...prev,
          ...portalData.notification_preferences
        }));
      }

      // 4. Fetch site & bank settings dynamically from Supabase / local cache
      try {
        const { data: dbSettings } = await supabase
          .from("site_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (dbSettings) {
          setSiteSettings({
            bank_name: dbSettings.bank_name || "Opay Bank",
            account_number: dbSettings.account_number || "7062974830",
            account_name: dbSettings.account_name || "Oluwatofunmi Yinusa",
            contact_email: dbSettings.contact_email || "tofunmiyinusa01@gmail.com",
            contact_phone: dbSettings.contact_phone || "+234 706 297 4830",
            legal_footer: dbSettings.legal_footer || "All services require 70% upfront payment. Final source deliverables are released only upon full settlement of the remaining balance."
          });
        } else {
          const cachedSettings = localStorage.getItem("tochay_offline_site_settings");
          if (cachedSettings) {
            const parsed = JSON.parse(cachedSettings);
            setSiteSettings(prev => ({
              ...prev,
              ...parsed
            }));
          }
        }
      } catch (err) {
        const cachedSettings = localStorage.getItem("tochay_offline_site_settings");
        if (cachedSettings) {
          try {
            const parsed = JSON.parse(cachedSettings);
            setSiteSettings(prev => ({ ...prev, ...parsed }));
          } catch (e) {}
        }
      }
    } catch (err: any) {
      console.error("Portal load failure:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Countdown Timer Calculator
  useEffect(() => {
    if (!portal?.target_delivery_date) {
      setCountdownStr((prev) => ({ ...prev, hasTarget: false }));
      return;
    }

    const calculateTimeRemaining = () => {
      const targetTime = new Date(portal.target_delivery_date!).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setCountdownStr({
          days: 0,
          hours: 0,
          mins: 0,
          secs: 0,
          isOverdue: true,
          hasTarget: true
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownStr({
        days,
        hours,
        mins,
        secs,
        isOverdue: false,
        hasTarget: true
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [portal?.target_delivery_date]);

  // Version Switcher Handler
  const handleSelectPresentationVersion = async (phaseId: string, presId: string) => {
    setSelectedDeckByPhase((prev) => ({
      ...prev,
      [phaseId]: presId
    }));

    if (!loadedDecks[presId]) {
      try {
        let deckRecord: any = null;
        let assetsData: PresentationAsset[] = [];

        try {
          const { data: dbDeck } = await supabase
            .from("presentations")
            .select("*")
            .eq("id", presId)
            .single();
          if (dbDeck) deckRecord = dbDeck;

          const { data: dbAssets } = await supabase
            .from("presentation_assets")
            .select("*")
            .eq("presentation_id", presId)
            .order("sort_order", { ascending: true });
          if (dbAssets && dbAssets.length > 0) assetsData = dbAssets;
        } catch (e) {
          console.warn("DB version fetch notice:", e);
        }

        if (!deckRecord || assetsData.length === 0) {
          const cachedPresStr = localStorage.getItem("tochay_offline_presentations");
          if (cachedPresStr) {
            try {
              const localDecks = JSON.parse(cachedPresStr);
              const localDeck = localDecks.find((d: any) => d.id === presId);
              if (localDeck) {
                if (!deckRecord) deckRecord = localDeck;
                if (assetsData.length === 0) {
                  const localAssetsStr = localStorage.getItem(`tochay_offline_assets_${presId}`);
                  if (localAssetsStr) {
                    assetsData = JSON.parse(localAssetsStr);
                  } else if (localDeck.assets && localDeck.assets.length > 0) {
                    assetsData = localDeck.assets;
                  }
                }
              }
            } catch (e) {
              console.warn("Failed to parse offline version cache:", e);
            }
          }
        }

        const commentsMap: { [assetId: string]: AssetComment[] } = {};
        if (assetsData && assetsData.length > 0) {
          const assetIds = assetsData.map((a) => a.id);
          try {
            const { data: commentsData } = await supabase
              .from("presentation_comments")
              .select("*")
              .in("presentation_asset_id", assetIds)
              .order("created_at", { ascending: true });

            if (commentsData) {
              commentsData.forEach((c) => {
                if (!commentsMap[c.presentation_asset_id]) {
                  commentsMap[c.presentation_asset_id] = [];
                }
                commentsMap[c.presentation_asset_id].push(c);
              });
            }
          } catch (e) {
            console.warn("Comments DB notice:", e);
          }
        }

        setLoadedDecks((prev) => ({
          ...prev,
          [presId]: {
            deck: deckRecord,
            assets: assetsData || [],
            comments: commentsMap
          }
        }));
      } catch (err) {
        console.error("Failed to load selected presentation version:", err);
      }
    }
  };

  // Asset Status Update (Approve / Request Changes)
  const handleUpdateAssetStatus = async (
    deckId: string,
    assetId: string,
    clickedStatus: "Approved" | "Rejected"
  ) => {
    const deckInfo = loadedDecks[deckId];
    if (!deckInfo) return;

    const currentAsset = deckInfo.assets.find((a) => a.id === assetId);
    const nextStatus = (currentAsset?.status === clickedStatus ? "Review" : clickedStatus) as
      | "Review"
      | "Approved"
      | "Rejected";

    const updatedAssets = deckInfo.assets.map((a) => (a.id === assetId ? { ...a, status: nextStatus } : a));

    setLoadedDecks((prev) => ({
      ...prev,
      [deckId]: {
        ...prev[deckId],
        assets: updatedAssets
      }
    }));

    setActivePhaseAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, status: nextStatus } : a))
    );

    try {
      await supabase.from("presentation_assets").update({ status: nextStatus }).eq("id", assetId);
    } catch (err) {
      console.warn("Offline status update cached locally.");
    }

    if ((nextStatus === "Approved" || nextStatus === "Rejected") && currentAsset && portal) {
      const approvedCount = updatedAssets.filter((a) => a.status === "Approved").length;
      fetch("/api/presentation-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          deckId,
          deckTitle: deckInfo.deck?.title || portal.project_title,
          clientName: portal.client_name,
          assetId: currentAsset.id,
          filename: currentAsset.filename,
          category: currentAsset.category,
          fileUrl: currentAsset.file_url,
          reviewerName: authorName.trim() || "Client Reviewer",
          approvedCount,
          totalCount: updatedAssets.length,
          token: portal.token
        })
      }).catch((err) => console.warn("Email alert notice:", err));
    }
  };

  // Post Comment Handler
  const handlePostComment = async (deckId: string, assetId: string) => {
    if (!newComment.trim()) return;

    const reviewer = authorName.trim() || "Client Reviewer";
    localStorage.setItem("clientAuthorName", reviewer);

    const freshComment: AssetComment = {
      presentation_asset_id: assetId,
      author_name: reviewer,
      comment: newComment.trim(),
      created_at: new Date().toISOString()
    };

    const deckInfo = loadedDecks[deckId];
    const assetComments = deckInfo?.comments[assetId] || [];
    const updatedCommentsList = [...assetComments, freshComment];

    setLoadedDecks((prev) => ({
      ...prev,
      [deckId]: {
        ...prev[deckId],
        comments: {
          ...prev[deckId]?.comments,
          [assetId]: updatedCommentsList
        }
      }
    }));

    setNewComment("");

    try {
      await supabase.from("presentation_comments").insert([freshComment]);
    } catch (err) {
      console.warn("Offline comment cached.");
    }

    const targetAsset = deckInfo?.assets.find((a) => a.id === assetId);
    if (targetAsset && portal) {
      fetch("/api/presentation-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Comment",
          deckId,
          deckTitle: deckInfo?.deck?.title || portal.project_title,
          clientName: portal.client_name,
          assetId: targetAsset.id,
          filename: targetAsset.filename,
          category: targetAsset.category,
          fileUrl: targetAsset.file_url,
          reviewerName: reviewer,
          comment: freshComment.comment,
          token: portal.token
        })
      }).catch((err) => console.warn("Comment email alert notice:", err));
    }
  };

  // Client Notification Email Settings Handlers
  const handleSaveClientSettings = async () => {
    if (!portal) return;
    const trimmedEmail = clientEmailInput.trim();
    if (trimmedEmail && !trimmedEmail.includes("@")) {
      setClientSettingsAlert({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    try {
      setSavingClientSettings(true);
      const isNewOrChanged = trimmedEmail && trimmedEmail !== (portal.client_email || "");

      // 1. Update in Supabase
      const { error } = await supabase
        .from("client_portals")
        .update({
          client_email: trimmedEmail || null,
          notification_preferences: clientNotifPrefs
        })
        .eq("id", portal.id);

      if (error) {
        console.warn("Supabase portal settings update notice:", error);
      }

      // Update local storage fallback
      const cached = localStorage.getItem("tochay_offline_portals");
      if (cached) {
        try {
          const list = JSON.parse(cached);
          const updated = list.map((p: any) => p.id === portal.id ? { ...p, client_email: trimmedEmail || null, notification_preferences: clientNotifPrefs } : p);
          localStorage.setItem("tochay_offline_portals", JSON.stringify(updated));
        } catch (e) {}
      }

      setPortal(prev => prev ? ({
        ...prev,
        client_email: trimmedEmail || null,
        notification_preferences: clientNotifPrefs
      }) : null);

      // 2. If new or changed email, send welcome onboarding email!
      if (isNewOrChanged) {
        try {
          await fetch("/api/portal-notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientEmail: trimmedEmail,
              clientName: portal.client_name,
              projectTitle: portal.project_title,
              token: portal.token,
              type: "onboarding"
            })
          });
        } catch (e) {
          console.warn("Welcome email dispatch notice:", e);
        }
      }

      setClientSettingsAlert({
        type: "success",
        message: isNewOrChanged 
          ? `Settings saved! Welcome onboarding email sent to ${trimmedEmail}`
          : "Notification preferences updated successfully!"
      });
      setTimeout(() => setClientSettingsAlert(null), 5000);
    } catch (err: any) {
      console.error("Failed to save client settings:", err);
      setClientSettingsAlert({ type: "error", message: "Failed to update notification settings." });
    } finally {
      setSavingClientSettings(false);
    }
  };

  const handleDeleteClientEmail = async () => {
    if (!portal) return;
    try {
      setSavingClientSettings(true);
      await supabase
        .from("client_portals")
        .update({ client_email: null })
        .eq("id", portal.id);

      const cached = localStorage.getItem("tochay_offline_portals");
      if (cached) {
        try {
          const list = JSON.parse(cached);
          const updated = list.map((p: any) => p.id === portal.id ? { ...p, client_email: null } : p);
          localStorage.setItem("tochay_offline_portals", JSON.stringify(updated));
        } catch (e) {}
      }

      setClientEmailInput("");
      setPortal(prev => prev ? ({ ...prev, client_email: null }) : null);
      setClientSettingsAlert({ type: "success", message: "Notification email removed." });
      setTimeout(() => setClientSettingsAlert(null), 4000);
    } catch (err) {
      setClientSettingsAlert({ type: "error", message: "Failed to remove email." });
    } finally {
      setSavingClientSettings(false);
    }
  };

  const handlePrevAsset = () => {
    if (activeAssetIdx !== null && activeAssetIdx > 0) {
      setActiveAssetIdx(activeAssetIdx - 1);
      setZoomScale(1);
      setRotationDegrees(0);
      setPdfPage(1);
    }
  };

  const handleNextAsset = () => {
    if (activeAssetIdx !== null && activeAssetIdx < activePhaseAssets.length - 1) {
      setActiveAssetIdx(activeAssetIdx + 1);
      setZoomScale(1);
      setRotationDegrees(0);
      setPdfPage(1);
    }
  };

  // Downloadable Studio PDF Invoice / Receipt Generator (Matching Pricing PDF Aesthetic)
  const generatePortalInvoicePdf = () => {
    if (!portal) return;

    const doc = new jsPDF();
    const isPaidInFull = portal.invoice_status === "Paid in Full";
    const totalBudget = portal.budget_total || 0;
    const depositPaid = isPaidInFull ? totalBudget : (portal.deposit_paid || 0);
    const balanceDue = isPaidInFull ? 0 : Math.max(0, totalBudget - depositPaid);
    const invNumber = `${isPaidInFull ? "REC" : "INV"}-${portal.token.slice(-6).toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const buildPdf = (logoImg?: HTMLImageElement) => {
      // 1. Brand Header matching Pricing
      let textStartX = 20;
      if (logoImg) {
        doc.addImage(logoImg, "PNG", 20, 15, 12, 12);
        textStartX = 36;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text("Brand Systems & High-Fidelity Products", textStartX, 17);
      doc.text(`Email: ${siteSettings.contact_email || "tofunmiyinusa01@gmail.com"}`, textStartX, 22);
      doc.text(`Tel: ${siteSettings.contact_phone || "+234 706 297 4830"}`, textStartX, 27);

      // 2. Invoice / Receipt Metadata Block matching Pricing
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(9, 9, 11);
      doc.text(isPaidInFull ? "RECEIPT ISSUED TO:" : "INVOICE TO:", 140, 20);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(63, 63, 70);
      doc.text(portal.client_name, 140, 26);
      doc.text(`${isPaidInFull ? "Receipt" : "Invoice"} No: ${invNumber}`, 140, 31);
      doc.text(`Date: ${dateStr}`, 140, 36);

      // 3. Line Divider
      doc.setDrawColor(228, 228, 231);
      doc.line(20, 45, 190, 45);

      // 4. Build Table Body Rows with Deliverables & Scope
      const tableBody: string[][] = [];
      const itemsList = (portal.invoice_items && portal.invoice_items.length > 0)
        ? portal.invoice_items
        : [
            {
              id: "default",
              name: portal.project_title,
              description: "Full brand design scope & milestone deliverables",
              quantity: 1,
              unit_price: totalBudget,
              has_addons: false,
              addon_price: 0,
              additional_units: 0
            }
          ];

      itemsList.forEach((item) => {
        const baseRate = Number(item.unit_price || 0);
        const addonUnits = Number(item.additional_units || 0);
        const addonRate = Number(item.addon_price || 0);
        const rate = baseRate + (addonUnits * addonRate);
        const lineTotal = rate * Number(item.quantity || 1);

        let displayName = item.name;
        if (item.has_addons && addonUnits > 0) {
          displayName += ` (+${addonUnits} Add-on${addonUnits !== 1 ? "s" : ""})`;
        }

        tableBody.push([
          displayName,
          item.description || "Scope and deliverable specifications.",
          (item.quantity || 1).toString(),
          `N${rate.toLocaleString()}`,
          `N${lineTotal.toLocaleString()}`
        ]);
      });

      // 5. Render AutoTable Grid matching Pricing Theme
      autoTable(doc, {
        startY: 52,
        head: [["Service / Deliverable", "Details & Inclusions", "Qty", "Rate (NGN)", "Total (NGN)"]],
        body: tableBody,
        theme: "striped",
        headStyles: { fillColor: [9, 9, 11], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { textColor: [63, 63, 70] },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 65 },
          2: { cellWidth: 15, halign: "center" },
          3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 25, halign: "right" }
        },
        margin: { left: 20, right: 20 }
      });

      // 6. Totals Calculations matching Pricing
      const finalY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(63, 63, 70);
      doc.text("Subtotal:", 130, finalY);
      doc.text(`N${totalBudget.toLocaleString()}`, 190, finalY, { align: "right" });

      let currentOffset = finalY;
      if (depositPaid > 0) {
        currentOffset += 6;
        doc.text(isPaidInFull ? "Settled Payment:" : "Deposit Paid:", 130, currentOffset);
        doc.text(`-N${depositPaid.toLocaleString()}`, 190, currentOffset, { align: "right" });
      }

      currentOffset += 8;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(9, 9, 11);
      doc.text(isPaidInFull ? "Remaining Balance Due:" : "Balance Due (NGN):", 130, currentOffset);
      doc.text(`N${balanceDue.toLocaleString()}`, 190, currentOffset, { align: "right" });

      // 7. Bank Transfer / Official Confirmation Box matching Pricing
      const boxY = currentOffset + 14;
      doc.setFillColor(248, 248, 247);
      doc.rect(20, boxY, 170, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(9, 9, 11);
      doc.text(
        isPaidInFull ? "OFFICIAL RECEIPT CONFIRMATION - PAID IN FULL" : "BANK TRANSFER PAYMENT DETAILS",
        24,
        boxY + 6
      );

      doc.setFont("helvetica", "normal");
      doc.setTextColor(63, 63, 70);
      doc.text(
        `Bank: ${siteSettings.bank_name || "Opay Bank"}  |  Acc Number: ${siteSettings.account_number || "7062974830"}  |  Name: ${siteSettings.account_name || "Oluwatofunmi Yinusa"}`,
        24,
        boxY + 12
      );

      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text(
        isPaidInFull
          ? "This document serves as verified proof of full settlement for all listed deliverables."
          : "Please email the payment receipt screenshot directly to begin milestone deliverables.",
        24,
        boxY + 18
      );

      // 8. Disclaimer Footer matching Pricing
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(161, 161, 170);
      const disclaimerText = siteSettings.legal_footer || "All services require 70% upfront payment. Final source deliverables are released only upon full settlement of the remaining balance.";
      const splitDisclaimer = doc.splitTextToSize(disclaimerText, 170);
      doc.text(splitDisclaimer, 20, boxY + 34);

      // Trigger Save
      doc.save(`${isPaidInFull ? "receipt" : "invoice"}-${portal.client_name.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString().slice(-4)}.pdf`);
    };

    const logoImg = new Image();
    logoImg.src = "/images/toflogoblack.png";
    logoImg.onload = () => buildPdf(logoImg);
    logoImg.onerror = () => buildPdf(undefined);
  };

  if (!mounted || (loading && !portal)) {
    return (
      <div className="min-h-screen bg-[#f8f8f7] flex flex-col items-center justify-center p-6 text-center select-none">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 mb-4" />
        <h2 className="font-sans font-bold text-lg text-zinc-900">Loading Client Portal...</h2>
        <p className="font-sans text-xs text-zinc-400 mt-1">Retrieving roadmap milestones and project assets</p>
      </div>
    );
  }

  if (notFound || !portal) {
    return (
      <div className="min-h-screen bg-[#f8f8f7] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-sans font-bold text-xl text-zinc-900">Portal Not Found or Expired</h2>
        <p className="font-sans text-xs text-zinc-500 max-w-sm mt-1.5 leading-relaxed">
          The client project link you are trying to access does not exist or may have been updated.
        </p>
        <Link
          href="/"
          className="mt-6 px-5 py-2.5 rounded-xl bg-zinc-950 text-white font-sans font-bold text-xs hover:bg-zinc-800 transition-all shadow-xs"
        >
          Return to TY Studio
        </Link>
      </div>
    );
  }

  const completedPhasesCount = (portal.phases || []).filter((p) => p.status === "completed").length;
  const totalPhasesCount = (portal.phases || []).length;
  const progressPercent = totalPhasesCount > 0 ? Math.round((completedPhasesCount / totalPhasesCount) * 100) : 0;
  const activePhase = (portal.phases || []).find((p) => p.status === "active");
  const activeAsset = activeAssetIdx !== null && activePhaseAssets[activeAssetIdx] ? activePhaseAssets[activeAssetIdx] : null;

  return (
    <main className="w-full min-h-screen bg-[#f8f8f7] text-[#09090b] selection:bg-[#ffd230] selection:text-zinc-950 flex flex-col justify-between font-sans relative">
      
      {/* Dynamic Global Navbar */}
      <Navbar />

      {/* Main Core View Area */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 pt-36 pb-20 flex-grow flex flex-col gap-8">
        
        {/* Page Title & Client Metadata - Sleek presentation style */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200/80 pb-8 gap-6 select-none">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold bg-zinc-150/40 px-3 py-1 rounded-md self-start">
                {portal.client_name}
              </span>
              <span className={`font-sans font-bold text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider ${
                portal.status === "Completed"
                  ? "bg-emerald-100 text-emerald-900"
                  : portal.status === "In Review"
                  ? "bg-amber-100 text-amber-900"
                  : portal.status === "On Hold"
                  ? "bg-zinc-100 text-zinc-600"
                  : "bg-zinc-950 text-white"
              }`}>
                {portal.status}
              </span>
            </div>
            <h1 className="font-sans font-bold text-3xl sm:text-4xl text-zinc-950 tracking-tight leading-none mt-1">
              {portal.project_title}
            </h1>
          </div>

          {/* Right Metrics: Countdown Target & Overall Roadmap Progress */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {/* Live Countdown Badge if date is set */}
            {countdownStr.hasTarget && (
              <div className="flex flex-col gap-1 min-w-[140px]">
                <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Target Delivery
                </span>
                <span className="font-mono font-bold text-xs text-zinc-900">
                  {countdownStr.isOverdue
                    ? "Final Wrap-Up"
                    : `${countdownStr.days}d ${countdownStr.hours}h ${countdownStr.mins}m ${countdownStr.secs}s`}
                </span>
              </div>
            )}

            {/* Roadmap progress bar */}
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider">
                Roadmap Progress
              </span>
              <div className="flex items-center gap-3">
                <div className="flex-grow bg-zinc-200/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-sans font-bold text-xs text-zinc-950 shrink-0">
                  {progressPercent}% Finished
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal View Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 select-none w-full max-w-full">
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-4 py-2 rounded-full font-sans font-bold text-xs tracking-tight transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
              activeTab === "roadmap"
                ? "bg-zinc-950 text-white shadow-xs"
                : "bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200/80"
            }`}
          >
            <span>Roadmap</span>
            <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded-full shrink-0 ${
              activeTab === "roadmap" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"
            }`}>
              {(portal.phases || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`px-4 py-2 rounded-full font-sans font-bold text-xs tracking-tight transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
              activeTab === "files"
                ? "bg-zinc-950 text-white shadow-xs"
                : "bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200/80"
            }`}
          >
            <span>Deliverables & Files</span>
            <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded-full shrink-0 ${
              activeTab === "files" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"
            }`}>
              {(portal.files || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("financials")}
            className={`px-4 py-2 rounded-full font-sans font-bold text-xs tracking-tight transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
              activeTab === "financials"
                ? "bg-zinc-950 text-white shadow-xs"
                : "bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200/80"
            }`}
          >
            <span>Retainer & Invoicing</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`p-2.5 rounded-full font-sans font-bold text-xs tracking-tight transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              activeTab === "settings"
                ? "bg-zinc-950 text-white shadow-xs"
                : "bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200/80"
            }`}
            title="Notification & Email Settings"
            aria-label="Notification & Email Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* TAB 1: ROADMAP & DECKS */}
        {activeTab === "roadmap" && (
          <div className="flex flex-col gap-8">
            {/* Visual Stepper Track */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 select-none">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-500" />
                  <h2 className="font-sans font-bold text-base text-zinc-950">Roadmap</h2>
                </div>
                <span className="font-mono text-xs text-zinc-400">{completedPhasesCount}/{totalPhasesCount} Completed</span>
              </div>

              <div className="overflow-x-auto scrollbar-none pb-2 pt-1">
                <div className="flex items-center min-w-max gap-3 sm:gap-4">
                  {(portal.phases || []).map((phase, idx) => {
                    const isCompleted = phase.status === "completed";
                    const isActive = phase.status === "active";

                    return (
                      <div key={phase.id || idx} className="flex items-center gap-3 sm:gap-4">
                        <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all ${
                          isActive
                            ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                            : isCompleted
                            ? "bg-white text-emerald-950 border-emerald-200"
                            : "bg-white/60 text-zinc-400 border-zinc-200/80 opacity-60"
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : isActive
                              ? "bg-[#ffd230] text-zinc-950"
                              : "bg-zinc-200 text-zinc-500"
                          }`}>
                            {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                          </div>

                          <span className="font-sans font-bold text-xs tracking-tight">
                            {phase.title}
                          </span>
                        </div>

                        {idx < (portal.phases || []).length - 1 && (
                          <div className={`w-6 sm:w-10 h-0.5 rounded-full ${
                            isCompleted ? "bg-emerald-400" : "bg-zinc-200"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Roadmap Phases List */}
            <div className="flex flex-col gap-6">
              {(portal.phases || []).length === 0 ? (
                <div className="border border-dashed border-zinc-200 rounded-3xl py-16 flex flex-col items-center justify-center text-center p-6 bg-white select-none">
                  <Layers className="w-10 h-10 text-zinc-300 mb-2" />
                  <span className="font-sans font-bold text-zinc-600 text-sm">Roadmap In Preparation</span>
                  <p className="font-sans text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
                    Project phases and milestones are being configured by the studio team.
                  </p>
                </div>
              ) : (
                (portal.phases || []).map((phase, idx) => {
                  const isActive = phase.status === "active";
                  const isCompleted = phase.status === "completed";
                  const isInactive = phase.status === "inactive";

                  const phaseKey = phase.id || `phase_${idx}`;
                  const phasePresList = phase.presentations || [];
                  const activePresId = phasePresList.length > 0
                    ? (selectedDeckByPhase[phaseKey] || phasePresList.find((p) => p.is_current_version)?.presentation_id || phasePresList[0]?.presentation_id)
                    : null;
                  const activePresData = activePresId ? loadedDecks[activePresId] : null;
                  const activePresAssets = (activePresId && activePresData) ? (activePresData.assets || []) : [];
                  const approvedAssetsCount = activePresAssets.filter((a) => a.status === "Approved").length;

                  const isCollapsed = collapsedPhases[phaseKey] !== undefined 
                    ? collapsedPhases[phaseKey] 
                    : !isActive;

                  return (
                    <div
                      key={phaseKey}
                      className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                        isActive
                          ? "bg-white border-zinc-200/80 shadow-xs"
                          : isCompleted
                          ? "bg-white border-emerald-200/90 shadow-2xs"
                          : "bg-white/40 border-zinc-200/60 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* Phase Header with Collapse/Expand */}
                      <div 
                        onClick={() => togglePhaseCollapse(phaseKey)}
                        className={`p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none cursor-pointer ${
                          isActive && !isCollapsed
                            ? "bg-zinc-50/40 border-b border-zinc-100" 
                            : isCompleted && !isCollapsed
                            ? "border-b border-emerald-100/50 bg-emerald-50/15" 
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : isActive
                              ? "bg-zinc-950 text-white ring-4 ring-zinc-200/60"
                              : "bg-zinc-200 text-zinc-400"
                          }`}>
                            {isCompleted ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : isActive ? (
                              <span className="w-2 h-2 rounded-full bg-[#ffd230] animate-pulse"></span>
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 uppercase">
                                Phase {idx + 1}
                              </span>
                              <h3 className={`font-sans font-bold text-base sm:text-lg tracking-tight ${
                                isActive ? "text-zinc-950" : isCompleted ? "text-zinc-800" : "text-zinc-400"
                              }`}>
                                {phase.title}
                              </h3>
                            </div>
                            {phase.description && phase.description.trim().length > 0 && phase.description !== "Description of the milestone deliverables." && (
                              <p className={`font-sans text-xs mt-1 leading-relaxed ${
                                isActive ? "text-zinc-600" : "text-zinc-400"
                              }`}>
                                {phase.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-sans font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Phase Completed</span>
                            </span>
                          )}
                          {isActive && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 text-white font-sans font-bold text-[11px] shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd230] animate-pulse"></span>
                              <span>In Active Review</span>
                            </span>
                          )}
                          {isInactive && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-400 font-sans font-semibold text-[11px]">
                              <span>Upcoming Milestone</span>
                            </span>
                          )}

                          {/* Collapse / Expand chevron trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePhaseCollapse(phaseKey);
                            }}
                            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all cursor-pointer"
                            title={isCollapsed ? "Expand presentations" : "Collapse presentations"}
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${!isCollapsed ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      </div>

                      {/* PHASE PRESENTATION DECK (COLLAPSIBLE) */}
                      {!isCollapsed && (
                        <div className="p-6 sm:p-8 flex flex-col gap-6">
                          {phasePresList.length === 0 ? (
                            <div className="border border-dashed border-zinc-200 rounded-2xl py-10 flex flex-col items-center justify-center text-center p-6 bg-zinc-50/50">
                              <Layers className="w-7 h-7 text-zinc-300 mb-2" />
                              <span className="font-sans font-bold text-zinc-500 text-xs">No Presentations Attached Yet</span>
                              <p className="font-sans text-[11px] text-zinc-400 mt-0.5 max-w-sm">
                                Deliverables and design concepts for this milestone will be published here once ready for review.
                              </p>
                            </div>
                          ) : (
                            <>
                              {phasePresList.length > 1 && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/60">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-zinc-500 shrink-0" />
                                    <span className="font-sans font-bold text-xs text-zinc-800">
                                      Review Deck Versions:
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {phasePresList.map((pres) => {
                                      const isSelected = activePresId === pres.presentation_id;
                                      return (
                                        <button
                                          key={pres.presentation_id}
                                          onClick={() => handleSelectPresentationVersion(phaseKey, pres.presentation_id)}
                                          className={`px-3 py-1.5 rounded-xl font-sans font-bold text-xs transition-all cursor-pointer border ${
                                            isSelected
                                              ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                                              : "bg-white text-zinc-600 hover:text-zinc-950 border-zinc-200/80"
                                          }`}
                                        >
                                          {pres.version_label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {activePresAssets.length === 0 ? (
                                <div className="border border-dashed border-zinc-200 rounded-2xl py-10 flex flex-col items-center justify-center text-center p-6 bg-zinc-50/50">
                                  <Layers className="w-7 h-7 text-zinc-300 mb-2" />
                                  <span className="font-sans font-bold text-zinc-500 text-xs">No Assets in this Deck Version</span>
                                  <p className="font-sans text-[11px] text-zinc-400 mt-0.5">
                                    Upload assets to this presentation deck in admin.
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center justify-between">
                                    <span className="font-sans font-bold text-xs text-zinc-700 uppercase tracking-wider">
                                      Phase Deliverables ({approvedAssetsCount}/{activePresAssets.length} Approved)
                                    </span>
                                    <span className="font-sans text-[11px] text-zinc-400">
                                      Click any asset for full-screen view, comments, and approvals
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {activePresAssets.map((asset, assetIdx) => {
                                      const commentsCount = activePresData?.comments[asset.id]?.length || 0;
                                      const isApproved = asset.status === "Approved";
                                      const isRejected = asset.status === "Rejected";

                                      return (
                                        <div
                                          key={asset.id}
                                          onClick={() => {
                                            setActivePhaseAssets(activePresAssets);
                                            setActiveAssetIdx(assetIdx);
                                            setLightboxDeckId(activePresId!);
                                            setLightboxDeckTitle(activePresData?.deck?.title || phase.title);
                                            setIsFullscreenMedia(true);
                                            setZoomScale(1);
                                            setRotationDegrees(0);
                                            setPdfPage(1);
                                          }}
                                          className="bg-white/60 backdrop-blur-xs border border-zinc-200/60 rounded-2xl overflow-hidden hover:shadow-lg hover:border-zinc-300/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                                        >
                                          {/* Media Preview viewport */}
                                          <div className="relative w-full aspect-4/3 bg-zinc-50 flex items-center justify-center overflow-hidden select-none border-b border-zinc-200/60">
                                            {asset.file_url?.startsWith("data:video/") || asset.filename?.match(/\.(mp4|webm|mov)$/i) ? (
                                              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white text-xs font-bold font-sans">VIDEO PREVIEW</div>
                                            ) : asset.filename?.endsWith(".pdf") ? (
                                              <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600 text-sm font-black font-sans">DOCUMENT PDF</div>
                                            ) : (
                                              <img src={asset.file_url} alt={asset.filename} className="w-full h-full object-cover" />
                                            )}
                                            
                                            {/* Floating asset status badge */}
                                            <div className="absolute top-3 left-3 select-none pointer-events-none">
                                              <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                isApproved 
                                                  ? "bg-emerald-500 text-white" 
                                                  : isRejected
                                                  ? "bg-red-500 text-white"
                                                  : "bg-zinc-800 text-white"
                                              }`}>
                                                {isApproved ? "Approved" : isRejected ? "Revision Required" : "Reviewing"}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Info block */}
                                          <div className="p-4 flex flex-col gap-1.5 select-none">
                                            <span className="font-sans font-bold text-xs text-zinc-900 truncate block">
                                              {asset.filename}
                                            </span>
                                            <div className="flex items-center justify-between text-zinc-400 text-[9px] font-sans font-semibold uppercase tracking-wider mt-1">
                                              <span>{asset.category}</span>
                                              <span className="flex items-center gap-1 text-zinc-500">
                                                <MessageSquare className="w-3 h-3" />
                                                <span>{commentsCount}</span>
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {isCompleted && (
                        <div className="p-6 bg-emerald-50/20 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>All deliverables in this phase have been reviewed and approved.</span>
                          </div>

                          {phase.completed_at && (
                            <span className="font-mono text-[10px] text-emerald-700 shrink-0">
                              Signed off on {new Date(phase.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DELIVERABLES & ASSETS DOWNLOADS */}
        {activeTab === "files" && (
          <section className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-sans font-bold text-lg text-zinc-950">Deliverables & Asset Downloads</h3>
                <p className="font-sans text-xs text-zinc-400 mt-0.5">
                  High-resolution vector assets, brand guidelines PDF, typography, and production packages.
                </p>
              </div>

              <span className="font-mono text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-xl">
                {(portal.files || []).length} Files Ready
              </span>
            </div>

            {(portal.files || []).length === 0 ? (
              <div className="border border-dashed border-zinc-200 rounded-2xl py-16 flex flex-col items-center justify-center text-center p-6 bg-zinc-50/50">
                <FolderOpen className="w-10 h-10 text-zinc-300 mb-2" />
                <span className="font-sans font-bold text-zinc-600 text-sm">No Download Packages Yet</span>
                <p className="font-sans text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
                  Final vector files, master brand guidelines, and collateral packages will be uploaded here once review phases are complete.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(portal.files || []).map((file, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-zinc-200/80 flex items-center justify-center text-zinc-700 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-sans font-bold text-xs text-zinc-950 truncate">{file.filename}</h4>
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

                    <a
                      href={file.file_url}
                      download={file.filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-2xs shrink-0"
                      title="Download Asset"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: FINANCIAL RETAINER & INVOICE */}
        {activeTab === "financials" && (
          <section className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
              <div>
                <h3 className="font-sans font-bold text-lg text-zinc-950">Contract & Invoicing Retainer</h3>
                <p className="font-sans text-xs text-zinc-400 mt-0.5">
                  Itemized scope breakdown, payment record, and official studio invoice.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={generatePortalInvoicePdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-sans font-bold text-xs transition-colors shadow-xs cursor-pointer"
                  title="Download Studio PDF Invoice / Receipt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{portal.invoice_status === "Paid in Full" ? "Download Receipt PDF" : "Download Invoice PDF"}</span>
                </button>

                <span className={`font-sans font-bold text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                  portal.invoice_status === "Paid in Full"
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-amber-100 text-amber-900"
                }`}>
                  {portal.invoice_status || "Deposit Paid (50%)"}
                </span>
              </div>
            </div>

            {/* Official Paid in Full Receipt Banner */}
            {portal.invoice_status === "Paid in Full" && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs font-sans">
                <div className="flex items-center gap-2.5 text-emerald-900">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <span className="font-bold block">Official Receipt • Settled in Full</span>
                    <span className="text-emerald-700 text-[11px]">All project milestones and deliverables are 100% funded and confirmed.</span>
                  </div>
                </div>

                <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100/80 px-2.5 py-1 rounded-lg shrink-0">
                  Confirmed
                </span>
              </div>
            )}

            {(() => {
              const isPaidInFull = portal.invoice_status === "Paid in Full";
              const totalBudget = portal.budget_total || 0;
              const depositPaid = isPaidInFull ? totalBudget : (portal.deposit_paid || 0);
              const remainingBalance = isPaidInFull ? 0 : Math.max(0, totalBudget - depositPaid);
              const itemsList = (portal.invoice_items && portal.invoice_items.length > 0)
                ? portal.invoice_items
                : [{
                    id: "default-item",
                    name: portal.project_title,
                    description: "Complete visual identity design, milestones roadmap, and master deliverables package.",
                    unit_price: totalBudget,
                    quantity: 1
                  }];

              return (
                <div className="flex flex-col gap-6">
                  {/* Financial 3-Card Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex flex-col justify-between gap-1.5">
                      <span className="font-sans font-medium text-xs text-zinc-400">Total Project Contract</span>
                      <span className="font-sans font-extrabold text-xl text-zinc-950">
                        ₦{totalBudget.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/60 flex flex-col justify-between gap-1.5">
                      <span className="font-sans font-medium text-xs text-emerald-800">
                        {isPaidInFull ? "Payment Settled" : "Deposit Received"}
                      </span>
                      <span className="font-sans font-extrabold text-xl text-emerald-900">
                        ₦{depositPaid.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex flex-col justify-between gap-1.5">
                      <span className="font-sans font-medium text-xs text-zinc-400">Remaining Balance</span>
                      <span className={`font-sans font-extrabold text-xl ${isPaidInFull ? "text-emerald-700" : "text-zinc-950"}`}>
                        ₦{remainingBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Itemized Deliverables Scope Table */}
                  <div className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-sans font-bold text-xs text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                        <span>Itemized Scope & Deliverables</span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                          {itemsList.length} {itemsList.length === 1 ? "Item" : "Items"}
                        </span>
                      </h4>
                      <span className="font-sans text-[11px] text-zinc-400">
                        Official Contract Scope
                      </span>
                    </div>

                    <div className="rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Deliverable / Scope Specification</th>
                              <th className="py-3 px-4 text-center">Qty</th>
                              <th className="py-3 px-4 text-right">Unit Rate</th>
                              <th className="py-3 px-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-xs font-sans">
                            {itemsList.map((item, idx) => {
                              const basePrice = Number(item.unit_price || 0);
                              const addonsTotal = (Number(item.additional_units || 0)) * (Number(item.addon_price || 0));
                              const lineSubtotal = (basePrice + addonsTotal) * Number(item.quantity || 1);
                              return (
                                <tr key={item.id || idx} className="hover:bg-zinc-50/40 transition-colors">
                                  <td className="py-3.5 px-4">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-bold text-zinc-900">{item.name}</span>
                                      {item.description && (
                                        <span className="text-[11px] text-zinc-500 leading-relaxed max-w-xl">
                                          {item.description}
                                        </span>
                                      )}
                                      {item.has_addons && (item.additional_units || 0) > 0 && (
                                        <span className="text-[10px] font-mono font-semibold text-emerald-700 mt-0.5">
                                          + {item.additional_units} Add-on units (₦{addonsTotal.toLocaleString()})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-mono text-zinc-700 font-semibold">
                                    {item.quantity}
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-mono text-zinc-600">
                                    ₦{(basePrice + addonsTotal).toLocaleString()}
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-sans font-bold text-zinc-950">
                                    ₦{lineSubtotal.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-zinc-50/40 border-t border-zinc-200/80 text-xs font-sans">
                            <tr>
                              <td colSpan={3} className="py-2.5 px-4 text-right font-bold text-zinc-600">
                                Contract Total:
                              </td>
                              <td className="py-2.5 px-4 text-right font-extrabold text-zinc-950">
                                ₦{totalBudget.toLocaleString()}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="py-2 px-4 text-right font-bold text-emerald-700">
                                {isPaidInFull ? "Settled Payment:" : "Deposit Paid:"}
                              </td>
                              <td className="py-2 px-4 text-right font-extrabold text-emerald-700">
                                -₦{depositPaid.toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-t border-zinc-200 font-bold bg-zinc-100/50">
                              <td colSpan={3} className="py-3 px-4 text-right text-zinc-900">
                                Remaining Balance Due:
                              </td>
                              <td className={`py-3 px-4 text-right font-extrabold text-sm ${isPaidInFull ? "text-emerald-700" : "text-zinc-950"}`}>
                                ₦{remainingBalance.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bank Wire Settlement Details */}
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col gap-3 mt-2">
              <span className="font-sans font-bold text-xs text-zinc-900 uppercase tracking-wider">
                Direct Bank Transfer Wire Instructions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                <div>
                  <span className="font-medium text-zinc-400 block text-[11px]">Bank Name</span>
                  <span className="font-bold text-zinc-900">{siteSettings.bank_name || "Opay Bank"}</span>
                </div>
                <div>
                  <span className="font-medium text-zinc-400 block text-[11px]">Account Number</span>
                  <span className="font-mono font-bold text-zinc-900">{siteSettings.account_number || "7062974830"}</span>
                </div>
                <div>
                  <span className="font-medium text-zinc-400 block text-[11px]">Account Beneficiary</span>
                  <span className="font-bold text-zinc-900">{siteSettings.account_name || "Oluwatofunmi Yinusa"}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: CLIENT NOTIFICATION SETTINGS */}
        {activeTab === "settings" && (
          <section className="flex flex-col gap-6">
            <div className="p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/80 shadow-xs flex flex-col gap-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-sans font-bold text-base sm:text-lg text-zinc-950">
                      Notification & Email Settings
                    </h2>
                    <p className="font-sans text-xs text-zinc-500 mt-0.5">
                      Configure where project roadmap updates, design reviews, and download links will be delivered.
                    </p>
                  </div>
                </div>

                {portal.client_email && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-sans font-bold text-[11px] self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Notifications Active</span>
                  </div>
                )}
              </div>

              {/* Alert Feedback */}
              {clientSettingsAlert && (
                <div className={`p-4 rounded-2xl border text-xs font-sans font-semibold flex items-center justify-between gap-3 animate-fade-in ${
                  clientSettingsAlert.type === "success"
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-red-50/80 border-red-200 text-red-900"
                }`}>
                  <div className="flex items-center gap-2">
                    {clientSettingsAlert.type === "success" ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{clientSettingsAlert.message}</span>
                  </div>
                  <button
                    onClick={() => setClientSettingsAlert(null)}
                    className="p-1 rounded-md hover:bg-black/5 text-zinc-400 hover:text-zinc-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Primary Email Field */}
              <div className="flex flex-col gap-2">
                <label className="font-sans font-bold text-xs text-zinc-900 uppercase tracking-wider">
                  Client Notification Email
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-grow relative flex items-center">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-4 pointer-events-none" />
                    <input
                      type="email"
                      value={clientEmailInput}
                      onChange={(e) => setClientEmailInput(e.target.value)}
                      placeholder="e.g. client@yourcompany.com"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-11 pr-4 py-3 font-sans text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white transition-all outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleSaveClientSettings}
                      disabled={savingClientSettings}
                      className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 font-sans font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {savingClientSettings ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Settings</span>
                    </button>

                    {portal.client_email && (
                      <button
                        type="button"
                        onClick={handleDeleteClientEmail}
                        disabled={savingClientSettings}
                        className="p-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-zinc-200 rounded-2xl transition-colors cursor-pointer"
                        title="Remove Email Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="font-sans text-[11px] text-zinc-400 mt-1">
                  ✨ When you enter your email and click <strong className="text-zinc-700">Save Settings</strong>, an instant welcome onboarding email with your private portal access link will be delivered to your inbox.
                </p>
              </div>

              {/* Specific Notification Event Checkboxes */}
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100">
                <span className="font-sans font-bold text-xs text-zinc-900 uppercase tracking-wider">
                  Notification Subscriptions
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!clientNotifPrefs.milestones}
                      onChange={(e) => setClientNotifPrefs(prev => ({ ...prev, milestones: e.target.checked }))}
                      className="mt-0.5 accent-zinc-950 rounded"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-bold text-xs text-zinc-950">Milestone Roadmap</span>
                      <span className="font-sans text-[11px] text-zinc-400 leading-snug">
                        Updates when milestone phases advance or complete.
                      </span>
                    </div>
                  </label>

                  <label className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!clientNotifPrefs.presentations}
                      onChange={(e) => setClientNotifPrefs(prev => ({ ...prev, presentations: e.target.checked }))}
                      className="mt-0.5 accent-zinc-950 rounded"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-bold text-xs text-zinc-950">Presentation Proofs</span>
                      <span className="font-sans text-[11px] text-zinc-400 leading-snug">
                        Notifications when new concepts are ready for review.
                      </span>
                    </div>
                  </label>

                  <label className="p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!clientNotifPrefs.files}
                      onChange={(e) => setClientNotifPrefs(prev => ({ ...prev, files: e.target.checked }))}
                      className="mt-0.5 accent-zinc-950 rounded"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-sans font-bold text-xs text-zinc-950">Final Deliverables</span>
                      <span className="font-sans text-[11px] text-zinc-400 leading-snug">
                        Alerts when download files & font packages are released.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          </section>
        )}
      </div>

      {/* 6. INTERACTIVE PROOFING LIGHTBOX MODAL (MATCHING PRESENTATION VIEWER) */}
      {activeAsset && activeAssetIdx !== null && lightboxDeckId && (
        <div className="fixed inset-0 z-50 flex flex-col lg:flex-row overflow-hidden select-none bg-[#f8f8f7] text-[#09090b] animate-scale-in">
          
          {/* Left panel: Media Viewport */}
          <div className={`flex-grow flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
            isFullscreenMedia ? "w-full h-screen bg-black" : "h-[60vh] lg:h-screen lg:w-2/3 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-zinc-100/30"
          }`}>
            
            {/* Header top bar */}
            {!isFullscreenMedia && (
              <div className="py-4 px-6 flex items-center justify-between select-none bg-white/70 backdrop-blur-md border-b border-zinc-200/50 z-20 w-full">
                <div className="flex items-center gap-3 min-w-0 pr-6">
                  <span className="font-sans font-bold text-[8px] text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-sm select-none uppercase tracking-widest shrink-0">
                    {activeAsset.category}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 shrink-0" />
                  <h3 className="font-sans font-black text-xs text-zinc-950 truncate block tracking-tight">
                    {activeAsset.filename}
                  </h3>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = activeAsset.file_url;
                      link.download = activeAsset.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-2 hover:bg-zinc-50 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-zinc-950"
                    title="Download Original"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveAssetIdx(null)}
                    className="p-2 hover:bg-zinc-50 rounded-xl transition-all cursor-pointer text-zinc-400 hover:text-zinc-950"
                    title="Close Reviewer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Floating fullscreen top controls: Review toggle + Direct Close button */}
            {isFullscreenMedia && (
              <div className="absolute top-6 right-6 flex items-center gap-2 z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreenMedia(false);
                  }}
                  className="px-3.5 py-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white rounded-full transition-all cursor-pointer shadow-2xl flex items-center gap-1.5 text-xs font-sans font-bold backdrop-blur-md"
                  title="Switch to split review mode"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Feedback & Approvals</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAssetIdx(null);
                  }}
                  className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white rounded-full hover:scale-105 transition-all cursor-pointer shadow-2xl backdrop-blur-md"
                  title="Close Reviewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Main view frame viewport */}
            <div 
              onClick={() => setIsFullscreenMedia(!isFullscreenMedia)}
              className={`flex-grow flex items-center justify-center relative overflow-hidden cursor-zoom-in ${
                isFullscreenMedia ? "bg-black p-0 cursor-zoom-out" : "bg-zinc-50/40 p-6"
              }`}
            >
              <div 
                className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
                style={{ 
                  transform: `scale(${zoomScale}) rotate(${rotationDegrees}deg)`,
                }}
              >
                {activeAsset.file_url?.startsWith("data:video/") || activeAsset.filename?.match(/\.(mp4|webm|mov)$/i) ? (
                  <video 
                    src={activeAsset.file_url} 
                    controls 
                    className="max-w-[80vw] max-h-[45vh] lg:max-h-[75vh] object-contain rounded-lg shadow-xl" 
                  />
                ) : activeAsset.filename?.endsWith(".pdf") ? (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white text-zinc-900 p-8 rounded-lg shadow-xl flex flex-col items-center justify-center min-w-[320px] aspect-3/4 border border-zinc-200"
                  >
                    <FileText className="w-12 h-12 text-red-500 mb-2" />
                    <span className="font-sans font-bold text-sm">PDF DOCUMENT</span>
                    <span className="font-sans text-[10px] text-zinc-400 mt-1">{activeAsset.filename}</span>
                    <div className="mt-4 flex items-center gap-3 border border-zinc-200 rounded-lg p-1.5 bg-zinc-50 select-none">
                      <button 
                        onClick={() => setPdfPage(p => Math.max(1, p - 1))}
                        disabled={pdfPage === 1}
                        className="p-1 hover:bg-zinc-200 rounded-md disabled:opacity-30"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold px-1">Page {pdfPage}</span>
                      <button 
                        onClick={() => setPdfPage(p => p + 1)}
                        className="p-1 hover:bg-zinc-200 rounded-md"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={activeAsset.file_url} 
                    alt={activeAsset.filename} 
                    onClick={() => setIsFullscreenMedia(!isFullscreenMedia)}
                    className={`transition-all duration-300 object-contain ${
                      isFullscreenMedia 
                        ? "w-screen h-screen max-w-none max-h-none rounded-none shadow-none cursor-zoom-out" 
                        : "max-w-[90vw] lg:max-w-[55vw] max-h-[45vh] lg:max-h-[75vh] rounded-lg shadow-xl cursor-zoom-in"
                    }`} 
                    title={isFullscreenMedia ? "Click to view review screen" : "Click to view fullscreen distraction-free"}
                  />
                )}
              </div>

              {/* Floating microtoolbar controls directly on the picture viewport at the bottom */}
              {!isFullscreenMedia && (
                <div 
                  className="absolute bottom-5 left-1/2 -translate-x-1/2 select-none z-30 flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md text-zinc-750 px-4 py-2.5 rounded-full border border-zinc-200/50 shadow-md hover:bg-white/90 transition-all">
                    <button 
                      onClick={() => setZoomScale(z => Math.max(0.5, z - 0.25))}
                      className="p-1 text-zinc-400 hover:text-zinc-950 transition-all cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="font-mono text-[9px] font-bold text-zinc-500 tracking-tight select-none min-w-[32px] text-center">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button 
                      onClick={() => setZoomScale(z => Math.min(3, z + 0.25))}
                      className="p-1 text-zinc-400 hover:text-zinc-950 transition-all cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-3.5 bg-zinc-200" />
                    <button 
                      onClick={() => setRotationDegrees(r => (r + 90) % 360)}
                      className="p-1 text-zinc-400 hover:text-zinc-950 transition-all cursor-pointer"
                      title="Rotate Right"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Floating review navigation clicks (Left / Right) */}
              {!isFullscreenMedia && activeAssetIdx > 0 && (
                <button
                  className="absolute left-4 p-3 bg-white hover:bg-zinc-50 text-zinc-950 rounded-full transition-all cursor-pointer z-10 border border-zinc-200 shadow-md"
                  onClick={(e) => { e.stopPropagation(); handlePrevAsset(); }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {!isFullscreenMedia && activeAssetIdx < activePhaseAssets.length - 1 && (
                <button
                  className="absolute right-4 p-3 bg-white hover:bg-zinc-50 text-zinc-950 rounded-full transition-all cursor-pointer z-10 border border-zinc-200 shadow-md"
                  onClick={(e) => { e.stopPropagation(); handleNextAsset(); }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

          </div>

          {/* Right panel: Feedback Comments Sidebar & Action block */}
          {!isFullscreenMedia && (
            <div className="w-full lg:w-96 shrink-0 bg-white flex flex-col justify-between h-[40vh] lg:h-screen z-20 border-t lg:border-t-0 lg:border-l border-zinc-200">
              
              {/* Header: Review status toggler */}
              <div className="p-5 border-b border-zinc-200 flex flex-col gap-3 bg-white select-none">
                <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider">Asset Status Actions</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleUpdateAssetStatus(lightboxDeckId, activeAsset.id, "Approved")}
                    className={`py-2 px-3 rounded-xl font-sans font-bold text-xs tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeAsset.status === "Approved"
                        ? "bg-emerald-500 text-white shadow-xs scale-98"
                        : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleUpdateAssetStatus(lightboxDeckId, activeAsset.id, "Rejected")}
                    className={`py-2.5 px-3 rounded-xl font-sans font-bold text-xs tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeAsset.status === "Rejected"
                        ? "bg-red-500 text-white shadow-xs scale-98"
                        : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-200"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Request Changes</span>
                  </button>
                </div>
              </div>

              {/* Body: Feedback Chronological Comment thread */}
              <div className="flex-grow p-5 overflow-y-auto flex flex-col gap-4 bg-[#f8f8f7]/55">
                <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider block select-none mb-1">Live Comments Feed</span>
                
                {(!loadedDecks[lightboxDeckId]?.comments[activeAsset.id] || loadedDecks[lightboxDeckId].comments[activeAsset.id].length === 0) ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 rounded-2xl select-none bg-zinc-100/40">
                    <MessageSquare className="w-6 h-6 text-zinc-300 mb-2" />
                    <span className="font-sans font-bold text-zinc-400 text-[10px]">No Comments Yet</span>
                    <p className="font-sans text-[9px] text-zinc-450 mt-0.5 leading-normal max-w-[180px]">Type feedback below to note revision requests.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {loadedDecks[lightboxDeckId].comments[activeAsset.id].map((comment, cIdx) => {
                      const isMe = comment.author_name === authorName;
                      const initials = comment.author_name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() || "CR";
                      return (
                        <div 
                          key={comment.id || cIdx} 
                          className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {/* Round initials avatar */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-sans font-bold border shrink-0 select-none ${
                            isMe ? "bg-zinc-950 text-white border-zinc-900" : "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}>
                            {initials}
                          </div>

                          <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-bold text-[10px] text-zinc-900">{comment.author_name}</span>
                              <span className="font-mono text-[8px] text-zinc-400">
                                {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className={`p-3 rounded-2xl text-xs font-sans leading-relaxed ${
                              isMe ? "bg-zinc-950 text-white rounded-tr-none" : "bg-white border border-zinc-200/80 text-zinc-800 rounded-tl-none shadow-2xs"
                            }`}>
                              {comment.comment}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer: User Name & Comment input */}
              <div className="p-4 border-t border-zinc-200 bg-white flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Your Name (e.g. Sarah / Brand Lead)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type feedback comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handlePostComment(lightboxDeckId, activeAsset.id);
                      }
                    }}
                    className="flex-grow px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl font-sans text-xs text-zinc-900 focus:outline-none focus:border-zinc-950"
                  />

                  <button
                    type="button"
                    onClick={() => handlePostComment(lightboxDeckId, activeAsset.id)}
                    className="p-2 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </main>
  );
}
