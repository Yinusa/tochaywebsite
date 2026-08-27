"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
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
  GripVertical,
  Share2, 
  Clock, 
  FileText,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PresentationDeck {
  id: string;
  client_name: string;
  title: string;
  token: string;
  categories: string[];
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
  views_count?: number;
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

export default function PresentationsTab() {
  // Decks and assets states
  const [decks, setDecks] = useState<PresentationDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");

  // Edit / Create Modal state
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Partial<PresentationDeck> | null>(null);
  const [deckAssets, setDeckAssets] = useState<Partial<PresentationAsset>[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [expiryDuration, setExpiryDuration] = useState<"1w" | "2w" | "1m" | "permanent">("1w");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [draggedAssetIdx, setDraggedAssetIdx] = useState<number | null>(null);
  const [dragOverAssetIdx, setDragOverAssetIdx] = useState<number | null>(null);

  // Load presentation data on mount
  useEffect(() => {
    loadPresentations();
  }, []);

  // Alert dismisser
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      
      // Fetch from Supabase
      const { data: decksData, error: decksError } = await supabase
        .from("presentations")
        .select("*")
        .order("created_at", { ascending: false });

      if (decksError) throw decksError;

      // Fetch views counts and map them
      const enrichedDecks = await Promise.all(
        (decksData || []).map(async (deck) => {
          // Fetch Views count
          const { count: viewsCount } = await supabase
            .from("presentation_views")
            .select("id", { count: "exact", head: true })
            .eq("presentation_id", deck.id);

          // Validate link expiry real-time
          let isExpired = deck.is_expired;
          if (deck.expires_at && new Date(deck.expires_at) < new Date()) {
            isExpired = true;
            // update in background
            await supabase.from("presentations").update({ is_expired: true }).eq("id", deck.id);
          }

          return {
            ...deck,
            is_expired: isExpired,
            views_count: viewsCount || 0
          };
        })
      );

      setDecks(enrichedDecks);
      
      // Save local backup
      localStorage.setItem("tochay_offline_presentations", JSON.stringify(enrichedDecks));
    } catch (err: any) {
      console.warn("Supabase fetch failed, syncing with local fallback cache...", err);
      const cached = localStorage.getItem("tochay_offline_presentations");
      if (cached) {
        setDecks(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewDeckClick = () => {
    // Generate a valid RFC4122 v4 UUID for database integrity
    const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

    const generatedToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    
    setEditingDeck({
      id: generatedUuid,
      title: "",
      client_name: "",
      token: generatedToken,
      categories: ["Logo Marks", "Color Palette", "UI Prototypes"],
      expires_at: null,
      is_expired: false
    });
    setDeckAssets([]);
    setExpiryDuration("1w");
    setShowDeckModal(true);
  };

  const handleEditDeckClick = async (deck: PresentationDeck) => {
    setEditingDeck(deck);
    
    // Load duration selection
    if (!deck.expires_at) {
      setExpiryDuration("permanent");
    } else {
      const diffMs = new Date(deck.expires_at).getTime() - new Date(deck.created_at).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays <= 8) setExpiryDuration("1w");
      else if (diffDays <= 16) setExpiryDuration("2w");
      else setExpiryDuration("1m");
    }

    try {
      // Load assets from database
      const { data, error } = await supabase
        .from("presentation_assets")
        .select("*")
        .eq("presentation_id", deck.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setDeckAssets(data || []);
    } catch (err) {
      console.warn("Failed to load assets from DB, checking local storage cache...", err);
      const cachedAssets = localStorage.getItem(`tochay_offline_assets_${deck.id}`);
      if (cachedAssets) {
        setDeckAssets(JSON.parse(cachedAssets));
      } else {
        setDeckAssets([]);
      }
    }
    setShowDeckModal(true);
  };

  const handleAddCategory = () => {
    if (!categoryInput.trim() || !editingDeck) return;
    const cat = categoryInput.trim();
    if (editingDeck.categories?.includes(cat)) return;
    
    setEditingDeck({
      ...editingDeck,
      categories: [...(editingDeck.categories || []), cat]
    });
    setCategoryInput("");
  };

  const handleRemoveCategory = (cat: string) => {
    if (!editingDeck) return;
    setEditingDeck({
      ...editingDeck,
      categories: (editingDeck.categories || []).filter(c => c !== cat)
    });
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingDeck || !editingDeck.id) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const filePath = `presentations/${editingDeck.id}/${fileName}`;
      
      let fileUrl = "";

      try {
        // Direct bucket upload
        const { error: uploadError } = await supabase.storage
          .from("showcase")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("showcase").getPublicUrl(filePath);
        fileUrl = publicUrlData?.publicUrl || "";
      } catch (err) {
        console.warn("Storage upload failed, fallback to base64 encoding", err);
        // Base64 converter fallback
        fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newAsset: Partial<PresentationAsset> = {
        id: "asset-" + Math.random().toString(36).substring(2, 9),
        presentation_id: editingDeck.id,
        file_url: fileUrl,
        filename: file.name,
        category: editingDeck.categories?.[0] || "General",
        sort_order: deckAssets.length + i,
        status: "Review"
      };

      // Real-time render: Immediately append the uploaded asset as soon as it finishes!
      setDeckAssets(prev => [...prev, newAsset]);
      setUploadProgress({ current: i + 1, total: files.length });
    }

    setUploading(false);
    setUploadProgress(null);
  };

  const handleDragDropAsset = (targetIdx: number) => {
    if (draggedAssetIdx === null || draggedAssetIdx === targetIdx) {
      setDraggedAssetIdx(null);
      setDragOverAssetIdx(null);
      return;
    }
    setDeckAssets(prev => {
      const copy = [...prev];
      const item = copy.splice(draggedAssetIdx, 1)[0];
      copy.splice(targetIdx, 0, item);
      return copy.map((asset, idx) => ({ ...asset, sort_order: idx }));
    });
    setDraggedAssetIdx(null);
    setDragOverAssetIdx(null);
  };

  const moveAssetOrder = (index: number, direction: "up" | "down") => {
    const list = [...deckAssets];
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }

    const reordered = list.map((asset, idx) => ({ ...asset, sort_order: idx }));
    setDeckAssets(reordered);
  };

  const handleUpdateAssetCategory = (index: number, category: string) => {
    const list = [...deckAssets];
    list[index].category = category;
    setDeckAssets(list);
  };

  const handleRemoveAsset = (index: number) => {
    setDeckAssets(deckAssets.filter((_, idx) => idx !== index));
  };

  const handleSaveDeck = async () => {
    if (!editingDeck || !editingDeck.title?.trim() || !editingDeck.client_name?.trim()) {
      setAlert({ type: "error", message: "Please enter deck title and client name." });
      return;
    }

    // Expiration timestamp setting
    let expiresAt: string | null = null;
    const now = new Date();
    if (expiryDuration === "1w") {
      expiresAt = new Date(now.setDate(now.getDate() + 7)).toISOString();
    } else if (expiryDuration === "2w") {
      expiresAt = new Date(now.setDate(now.getDate() + 14)).toISOString();
    } else if (expiryDuration === "1m") {
      expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
    }

    const payloadDeck = {
      ...editingDeck,
      expires_at: expiresAt,
      is_expired: expiresAt ? new Date(expiresAt) < new Date() : false
    };

    try {
      setLoading(true);

      // Write Deck metadata to presentations table
      const { error: deckError } = await supabase
        .from("presentations")
        .upsert([payloadDeck]);

      if (deckError) throw deckError;

      // Write Deck assets list (clear first to prevent duplicates on edit)
      if (editingDeck.id) {
        await supabase.from("presentation_assets").delete().eq("presentation_id", editingDeck.id);
        
        if (deckAssets.length > 0) {
          const cleanAssets = deckAssets.map(asset => {
            const copy = { ...asset };
            if (copy.id?.startsWith("asset-")) {
              delete copy.id; // Let database generate true UUIDs
            }
            return copy;
          });

          const { error: assetsError } = await supabase
            .from("presentation_assets")
            .insert(cleanAssets);

          if (assetsError) throw assetsError;
        }
      }

      setAlert({ type: "success", message: "Presentation deck saved successfully!" });
      setShowDeckModal(false);
      setEditingDeck(null);
      loadPresentations();
    } catch (err: any) {
      console.warn("Supabase write failed, saving locally to browser storage cache...", err);
      
      // Offline fallback saving
      const localDecks = [...decks];
      const existIdx = localDecks.findIndex(d => d.id === payloadDeck.id);
      
      const newDeck: PresentationDeck = {
        id: payloadDeck.id!,
        client_name: payloadDeck.client_name!,
        title: payloadDeck.title!,
        token: payloadDeck.token!,
        categories: payloadDeck.categories!,
        expires_at: payloadDeck.expires_at,
        is_expired: payloadDeck.is_expired!,
        created_at: new Date().toISOString(),
        views_count: existIdx >= 0 ? localDecks[existIdx].views_count : 0
      };

      if (existIdx >= 0) {
        localDecks[existIdx] = newDeck;
      } else {
        localDecks.unshift(newDeck);
      }

      setDecks(localDecks);
      localStorage.setItem("tochay_offline_presentations", JSON.stringify(localDecks));
      localStorage.setItem(`tochay_offline_assets_${newDeck.id}`, JSON.stringify(deckAssets));
      
      setAlert({ type: "success", message: "Saved changes locally (offline client mode)." });
      setShowDeckModal(false);
      setEditingDeck(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm("Are you sure you want to delete this presentation deck? All client files, comments, and views counters will be removed forever.")) return;

    try {
      setLoading(true);

      // Clean storage files in backgrounds
      const { data: fileAssets } = await supabase
        .from("presentation_assets")
        .select("file_url")
        .eq("presentation_id", deckId);

      if (fileAssets && fileAssets.length > 0) {
        const filePaths = fileAssets
          .map(a => {
            const matches = a.file_url.match(/showcase\/(presentations\/.*)/);
            return matches ? matches[1] : null;
          })
          .filter(Boolean) as string[];
        
        if (filePaths.length > 0) {
          await supabase.storage.from("showcase").remove(filePaths);
        }
      }

      const { error } = await supabase.from("presentations").delete().eq("id", deckId);
      if (error) throw error;

      setAlert({ type: "success", message: "Presentation deck deleted successfully!" });
      loadPresentations();
    } catch (err) {
      console.warn("Failed to delete from Cloud database, removing from local cache...", err);
      const filtered = decks.filter(d => d.id !== deckId);
      setDecks(filtered);
      localStorage.setItem("tochay_offline_presentations", JSON.stringify(filtered));
      localStorage.removeItem(`tochay_offline_assets_${deckId}`);
      setAlert({ type: "success", message: "Deck removed from local cache." });
    } finally {
      setLoading(false);
    }
  };

  const copyClientLink = (token: string) => {
    const origin = window.location.origin;
    const url = `${origin}/presentation/${token}`;
    navigator.clipboard.writeText(url);
    setAlert({ type: "success", message: "Public client URL copied to clipboard!" });
  };

  const filteredDecks = decks.filter(deck => {
    const matchesSearch = deck.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          deck.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "active") return matchesSearch && !deck.is_expired;
    if (statusFilter === "expired") return matchesSearch && deck.is_expired;
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Alert banner component */}
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

      {/* Tab Header block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-150 pb-5 gap-4 select-none">
        <div>
          <h2 className="font-sans font-bold text-xl text-zinc-950">Client Presentation Decks</h2>
          <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">
            Create and share premium design presentation decks with your clients for review and approval.
          </p>
        </div>
        <button
          onClick={handleCreateNewDeckClick}
          className="px-5 py-2.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Presentation</span>
        </button>
      </div>

      {/* Presentation Statistics counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-2xl p-5 shadow-2xs">
          <span className="font-sans font-bold text-[10px] text-zinc-400 uppercase tracking-wider block">Total Decks Created</span>
          <span className="font-sans font-black text-3xl text-zinc-950 block mt-1">{decks.length}</span>
        </div>
        <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-2xl p-5 shadow-2xs">
          <span className="font-sans font-bold text-[10px] text-zinc-400 uppercase tracking-wider block">Active Reviews</span>
          <span className="font-sans font-black text-3xl text-emerald-600 block mt-1">
            {decks.filter(d => !d.is_expired).length}
          </span>
        </div>
        <div className="bg-zinc-50/50 border border-zinc-200/50 rounded-2xl p-5 shadow-2xs">
          <span className="font-sans font-bold text-[10px] text-zinc-400 uppercase tracking-wider block">Expired Links</span>
          <span className="font-sans font-black text-3xl text-red-600 block mt-1">
            {decks.filter(d => d.is_expired).length}
          </span>
        </div>
      </div>

      {/* Filter toolbar block */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-zinc-200 bg-zinc-50/30 rounded-2xl p-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md bg-white border border-zinc-200 rounded-xl px-4 py-2 flex items-center gap-2 focus-within:border-zinc-500 shadow-3xs transition-all">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search deck title or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-zinc-900 placeholder:text-zinc-300 text-xs font-sans w-full"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 self-end sm:self-auto select-none">
          <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-1" />
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider border transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-zinc-950 text-white border-zinc-950"
                : "bg-white text-zinc-500 border-zinc-200 hover:text-zinc-950"
            }`}
          >
            All Decks
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3.5 py-1.5 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider border transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-zinc-950 text-white border-zinc-950"
                : "bg-white text-zinc-500 border-zinc-200 hover:text-zinc-950"
            }`}
          >
            Active
          </button>
        </div>
      </div>

      {/* Grid listing decks */}
      {loading && decks.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-3 select-none">
          <Loader2 className="w-6 h-6 text-zinc-950 animate-spin" />
          <span className="font-sans font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Retrieving Presentation Decks...</span>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div className="w-full border border-dashed border-zinc-200 rounded-3xl py-24 flex flex-col items-center justify-center text-center select-none bg-zinc-50/10">
          <Share2 className="w-8 h-8 text-zinc-300 mb-3" />
          <span className="font-sans font-bold text-zinc-950 text-sm">No Presentation Decks Found</span>
          <p className="font-sans text-xs text-zinc-450 mt-1 max-w-[280px] leading-relaxed">
            {searchQuery ? "No presentations match your search filters." : "Create your first presentation deck to share files with reviewers."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDecks.map((deck) => (
            <div 
              key={deck.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between gap-5 relative group"
            >
              {/* Card Top details */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-sm select-none">
                    {deck.client_name}
                  </span>
                  <span className={`text-[8px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full select-none ${
                    deck.is_expired
                      ? "bg-red-50 border border-red-105 text-red-600"
                      : "bg-emerald-50 border border-emerald-100 text-emerald-600"
                  }`}>
                    {deck.is_expired ? "Expired" : "Active"}
                  </span>
                </div>
                
                <h3 className="font-sans font-bold text-base text-zinc-950 tracking-tight mt-1 truncate block group-hover:text-[#ffd230] transition-colors">
                  {deck.title}
                </h3>
                
                {/* Details list */}
                <div className="flex items-center gap-4 text-[10px] text-zinc-400 font-sans font-semibold mt-2 select-none">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{deck.expires_at ? `Exp: ${new Date(deck.expires_at).toLocaleDateString()}` : "Permanent"}</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{deck.views_count || 0} Views</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons row */}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-4 mt-1 select-none">
                <span className="font-mono text-[8px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Link: /presentation/{deck.token}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyClientLink(deck.token)}
                    className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-950 transition-all cursor-pointer"
                    title="Copy share link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(`/presentation/${deck.token}`, "_blank")}
                    className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-950 transition-all cursor-pointer"
                    title="Preview Showcase Portal"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditDeckClick(deck)}
                    className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-950 transition-all cursor-pointer"
                    title="Edit Deck"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDeck(deck.id)}
                    className="p-2 hover:bg-red-50 rounded-xl text-zinc-400 hover:text-red-650 transition-all cursor-pointer ml-1"
                    title="Delete Presentation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* FULL-PAGE PRESENTATION DECK EDITOR */}
      {showDeckModal && editingDeck && (
        <div data-lenis-prevent className="fixed inset-0 z-[70] bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans overflow-y-auto animate-fade-in select-none">
          
          {/* Top Sticky Header Bar */}
          <header className="w-full border-b border-zinc-200 bg-white px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between select-none sticky top-0 z-50 shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setShowDeckModal(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-sans font-bold text-xs text-zinc-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Decks</span>
              </button>

              <div className="flex flex-col">
                <h2 className="font-sans font-bold text-sm sm:text-base text-zinc-950">
                  {editingDeck.created_at ? `Modify Presentation: ${editingDeck.title || "Untitled"}` : "Configure New Presentation"}
                </h2>
                <span className="hidden sm:inline font-sans text-[11px] text-zinc-400">
                  Setup client presentation slides, password access, and expiration controls
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowDeckModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-sans font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDeck}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white font-sans font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingDeck.created_at ? "Update Presentation" : "Publish Presentation"}</span>
              </button>
            </div>
          </header>

          {/* Full Page Body */}
          <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
              
              {/* Form Settings column */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-450 uppercase tracking-wider pl-0.5">Presentation Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Brand Concept Review"
                    value={editingDeck.title || ""}
                    onChange={(e) => setEditingDeck({ ...editingDeck, title: e.target.value })}
                    className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-none focus:outline-none focus:ring-0 text-zinc-950"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-450 uppercase tracking-wider pl-0.5">Client Studio Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Studio"
                    value={editingDeck.client_name || ""}
                    onChange={(e) => setEditingDeck({ ...editingDeck, client_name: e.target.value })}
                    className="w-full bg-white border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-none focus:outline-none focus:ring-0 text-zinc-950"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-sans font-semibold text-[10px] text-zinc-450 uppercase tracking-wider pl-0.5">Custom Presentation Link Slug</label>
                  <div className="flex items-center bg-white border border-zinc-200 focus-within:border-zinc-500 rounded-xl px-4 py-2.5">
                    <span className="font-sans text-xs text-zinc-400 select-none mr-1">/presentation/</span>
                    <input
                      type="text"
                      required
                      placeholder="brand-identity-v1"
                      value={editingDeck.token || ""}
                      onChange={(e) => setEditingDeck({ 
                        ...editingDeck, 
                        token: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") 
                      })}
                      className="flex-grow bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs font-sans font-semibold text-zinc-950"
                    />
                  </div>
                  <span className="font-sans text-[9px] text-zinc-400 pl-0.5 mt-0.5 leading-normal">
                    This determines the URL. (Only lowercase letters, numbers, and hyphens allowed).
                  </span>
                </div>

                {/* Expiry selector */}
                <div className="flex flex-col gap-1 select-none">
                  <label className="font-sans font-semibold text-[10px] text-zinc-450 uppercase tracking-wider pl-0.5">Link Active Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: "1w", label: "1 Week" },
                      { key: "2w", label: "2 Weeks" },
                      { key: "1m", label: "1 Month" },
                      { key: "permanent", label: "Permanent" }
                    ].map((duration) => (
                      <button
                        key={duration.key}
                        type="button"
                        onClick={() => setExpiryDuration(duration.key as any)}
                        className={`py-2 px-1 rounded-xl font-sans font-bold text-[10px] tracking-tight transition-all cursor-pointer border ${
                          expiryDuration === duration.key
                            ? "bg-zinc-950 text-white border-zinc-950"
                            : "bg-zinc-55 text-zinc-450 hover:text-zinc-900 border-zinc-200"
                        }`}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories Manager */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-semibold text-[10px] text-zinc-450 uppercase tracking-wider pl-0.5">Presentation Review Categories</label>
                  
                  {/* Category Pills list */}
                  <div className="flex flex-wrap gap-1.5 select-none min-h-[36px] bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                    {(editingDeck.categories || []).length === 0 ? (
                      <span className="font-sans text-[10px] text-zinc-400 italic pl-1 self-center">No categories defined yet</span>
                    ) : (
                      (editingDeck.categories || []).map((cat, idx) => (
                        <span 
                          key={idx} 
                          className="font-sans text-[10px] font-bold text-zinc-800 bg-white border border-zinc-200 px-2 py-0.5 rounded-md flex items-center gap-1.5"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat)}
                            className="text-zinc-450 hover:text-red-650 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add category text field */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom category..."
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                      className="flex-grow bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2 px-3 text-xs font-sans font-semibold outline-none focus:outline-none focus:ring-0 text-zinc-950"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl font-sans font-semibold text-xs cursor-pointer shadow-3xs border border-zinc-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Uploads and assets ordering column */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 select-none">
                  <span className="font-sans font-semibold text-[10px] text-zinc-450 uppercase tracking-wider pl-0.5">Presentation Uploaded Deliverables</span>
                  <div className="relative w-full border border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50 hover:border-zinc-450 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group">
                    <Upload className="w-7 h-7 text-zinc-400 group-hover:text-zinc-950 transition-colors mb-2" />
                    <span className="font-sans font-bold text-xs text-zinc-950 block">Select Files (Images, Videos, PDFs)</span>
                    <span className="font-sans text-[10px] text-zinc-450 mt-0.5">Drag assets or click to select reviewer files</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleUploadFiles}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Upload assets list tracker */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5 select-none">
                      Asset Sequencing ({deckAssets.length} Uploads) — Drag or use arrows to reorder
                    </span>
                    {uploadProgress && (
                      <span className="font-sans font-bold text-[10px] text-amber-600 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading {uploadProgress.current} of {uploadProgress.total}...</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 max-h-[540px] overflow-y-auto border border-zinc-200 rounded-2xl p-2.5 bg-zinc-50/30">
                    {uploading && deckAssets.length === 0 ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 select-none">
                        <Loader2 className="w-6 h-6 text-zinc-950 animate-spin" />
                        <span className="font-sans font-bold text-zinc-600 text-xs">
                          Uploading images ({uploadProgress ? `${uploadProgress.current}/${uploadProgress.total}` : "Preparing..."})...
                        </span>
                      </div>
                    ) : deckAssets.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center select-none text-zinc-450 italic text-[10px] font-sans">
                        No files uploaded to this presentation deck yet.
                      </div>
                    ) : (
                      deckAssets.map((asset, idx) => (
                        <div 
                          key={asset.id || idx}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", `${idx}`);
                            setDraggedAssetIdx(idx);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverAssetIdx(idx);
                          }}
                          onDragLeave={() => {
                            if (dragOverAssetIdx === idx) setDragOverAssetIdx(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDragDropAsset(idx);
                          }}
                          onDragEnd={() => {
                            setDraggedAssetIdx(null);
                            setDragOverAssetIdx(null);
                          }}
                          className={`bg-white border rounded-xl p-3 flex items-center justify-between gap-3 shadow-3xs transition-all cursor-grab active:cursor-grabbing select-none ${
                            draggedAssetIdx === idx
                              ? "opacity-40 border-dashed border-zinc-400 bg-zinc-50 scale-98"
                              : dragOverAssetIdx === idx
                              ? "border-zinc-950 bg-zinc-100 shadow-sm scale-101"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                            {/* Drag Grip Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-700 shrink-0 p-0.5" title="Drag to reorder">
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* thumbnail preview */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 flex items-center justify-center">
                              {asset.filename?.endsWith(".pdf") ? (
                                <FileText className="w-5 h-5 text-red-500" />
                              ) : asset.filename?.match(/\.(mp4|webm|mov)$/i) || asset.file_url?.startsWith("data:video/") ? (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white font-mono text-[7px] font-bold">VIDEO</div>
                              ) : (
                                <img src={asset.file_url} alt={asset.filename} className="w-full h-full object-cover" />
                              )}
                            </div>

                            <div className="flex flex-col min-w-0 flex-grow">
                              <span className="font-sans font-bold text-xs text-zinc-950 truncate block leading-snug">{asset.filename}</span>
                              <div className="flex items-center gap-2 mt-1 select-none">
                                <span className="font-sans text-[8px] font-bold text-zinc-400 uppercase tracking-wide">Category:</span>
                                <select
                                  value={asset.category}
                                  onChange={(e) => handleUpdateAssetCategory(idx, e.target.value)}
                                  className="font-sans text-[9px] font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md py-0.5 px-2 cursor-pointer focus:outline-hidden"
                                >
                                  {(editingDeck.categories || []).map((cat, cIdx) => (
                                    <option key={cIdx} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Sorting action controls */}
                          <div className="flex items-center gap-1 select-none shrink-0">
                            <button
                              type="button"
                              onClick={() => moveAssetOrder(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-900 transition-all cursor-pointer disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveAssetOrder(idx, "down")}
                              disabled={idx === deckAssets.length - 1}
                              className="p-1 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-900 transition-all cursor-pointer disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset(idx)}
                              className="p-1 hover:bg-red-50 rounded-md text-zinc-400 hover:text-red-600 transition-all cursor-pointer ml-1"
                              title="Remove Asset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end border-t border-zinc-100 pt-6 mt-6 gap-3 select-none">
              <button
                type="button"
                onClick={() => setShowDeckModal(false)}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer border border-zinc-200 shadow-3xs"
              >
                Cancel Configuration
              </button>
              <button
                type="button"
                onClick={handleSaveDeck}
                disabled={loading}
                className="px-6 py-2.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingDeck.created_at ? "Update Presentation" : "Publish Presentation"}</span>
              </button>
            </div>

          </div>
          </div>
        </div>
      )}

    </div>
  );
}
