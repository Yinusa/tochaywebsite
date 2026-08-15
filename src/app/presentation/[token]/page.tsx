"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { 
  Check, 
  X, 
  Clock, 
  Lock, 
  Download, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Loader2, 
  Send,
  Sparkles,
  FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

interface PresentationDeck {
  id: string;
  client_name: string;
  title: string;
  token: string;
  categories: string[];
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
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
  id: string;
  presentation_asset_id: string;
  author_name: string;
  comment: string;
  created_at: string;
}

export default function ClientShowcasePage() {
  const params = useParams();
  const token = params?.token as string;

  // Deck & assets states
  const [deck, setDeck] = useState<PresentationDeck | null>(null);
  const [assets, setAssets] = useState<PresentationAsset[]>([]);
  const [comments, setComments] = useState<Record<string, AssetComment[]>>({});
  
  const [loading, setLoading] = useState(true);
  const [errorScreen, setErrorScreen] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Lightbox Proofing state
  const [activeAssetIdx, setActiveAssetIdx] = useState<number | null>(null);
  const [isFullscreenMedia, setIsFullscreenMedia] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  
  // Feedback comment box state
  const [authorName, setAuthorName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [showAuthorInput, setShowAuthorInput] = useState(false);

  // Initialize client author from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("clientAuthorName");
      if (savedName) {
        setAuthorName(savedName);
      } else {
        setShowAuthorInput(true);
      }
    }
  }, []);

  // Fetch Presentation data on load
  useEffect(() => {
    if (token) {
      loadPresentationPortal();
    }
  }, [token]);

  const loadPresentationPortal = async () => {
    try {
      setLoading(true);
      setErrorScreen(null);

      // 1. Fetch Deck
      let deckData: PresentationDeck | null = null;
      let assetsList: PresentationAsset[] = [];

      try {
        const { data: deckRes, error: deckError } = await supabase
          .from("presentations")
          .select("*")
          .eq("token", token)
          .single();

        if (deckError || !deckRes) throw new Error("Deck not found.");
        deckData = deckRes;

        // Check expiration limits
        if (deckData!.expires_at && new Date(deckData!.expires_at) < new Date()) {
          deckData!.is_expired = true;
        }

        // Fetch Assets
        const { data: assetsRes, error: assetsError } = await supabase
          .from("presentation_assets")
          .select("*")
          .eq("presentation_id", deckData!.id)
          .order("sort_order", { ascending: true });

        if (assetsError) throw assetsError;
        assetsList = assetsRes || [];
      } catch (dbErr) {
        console.warn("DB client query failed, matching offline cache...", dbErr);
        // Fallback local storage checker
        const cachedDecksStr = localStorage.getItem("tochay_offline_presentations");
        if (cachedDecksStr) {
          const localDecks: PresentationDeck[] = JSON.parse(cachedDecksStr);
          const found = localDecks.find(d => d.token === token);
          if (found) {
            deckData = found;
            const cachedAssets = localStorage.getItem(`tochay_offline_assets_${deckData.id}`);
            if (cachedAssets) {
              assetsList = JSON.parse(cachedAssets);
            }
          }
        }
      }

      if (!deckData) {
        setErrorScreen("Access Denied. Presentation link does not exist or has been removed.");
        setLoading(false);
        return;
      }

      setDeck(deckData);
      setAssets(assetsList);

      if (deckData.is_expired) {
        setLoading(false);
        return;
      }

      // 2. Increment view counter in background
      try {
        await supabase.from("presentation_views").insert([{ presentation_id: deckData.id }]);
      } catch (err) {
        console.warn("Failed to write analytics view counts", err);
      }

      // 3. Load comments
      await loadAllComments(assetsList);

    } catch (err: any) {
      setErrorScreen("Unable to load presentation. Please verify link.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllComments = async (assetsList: PresentationAsset[]) => {
    const commentsMap: Record<string, AssetComment[]> = {};
    
    for (const asset of assetsList) {
      try {
        const { data, error } = await supabase
          .from("presentation_comments")
          .select("*")
          .eq("presentation_asset_id", asset.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        commentsMap[asset.id] = data || [];
      } catch (err) {
        // local comments cache
        const localComments = localStorage.getItem(`tochay_offline_comments_${asset.id}`);
        commentsMap[asset.id] = localComments ? JSON.parse(localComments) : [];
      }
    }
    setComments(commentsMap);
  };

  const handleUpdateAssetStatus = async (assetId: string, clickedStatus: "Approved" | "Rejected") => {
    const currentAsset = assets.find(a => a.id === assetId);
    const nextStatus = (currentAsset?.status === clickedStatus ? "Review" : clickedStatus) as "Review" | "Approved" | "Rejected";

    // 1. Local UI update
    const updatedAssets = assets.map(asset => {
      if (asset.id === assetId) {
        return { ...asset, status: nextStatus };
      }
      return asset;
    });
    setAssets(updatedAssets);

    // 2. Sync to Database / fallback Local Storage
    try {
      const { error } = await supabase
        .from("presentation_assets")
        .update({ status: nextStatus })
        .eq("id", assetId);

      if (error) throw error;
    } catch (err) {
      console.warn("Offline status sync saved to fallback browser cache.");
      if (deck) {
        localStorage.setItem(`tochay_offline_assets_${deck.id}`, JSON.stringify(updatedAssets));
      }
    }

    // 3. Trigger real-time email notification when deliverable status changes (Approved or Request Changes)
    if ((nextStatus === "Approved" || nextStatus === "Rejected") && currentAsset && deck) {
      const currentApprovedCount = updatedAssets.filter(a => a.status === "Approved").length;
      fetch("/api/presentation-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          deckId: deck.id,
          deckTitle: deck.title,
          clientName: deck.client_name,
          assetId: currentAsset.id,
          filename: currentAsset.filename,
          category: currentAsset.category,
          fileUrl: currentAsset.file_url,
          reviewerName: authorName.trim() || "Client Reviewer",
          approvedCount: currentApprovedCount,
          totalCount: updatedAssets.length,
          token: deck.token,
        }),
      }).catch(err => {
        console.warn("Presentation status email notification notice:", err);
      });
    }
  };

  const handlePostComment = async (assetId: string) => {
    if (!newComment.trim()) return;

    let reviewer = authorName.trim();
    if (!reviewer) {
      reviewer = "Anonymous Client Reviewer";
    }

    // Save reviewer name in localStorage for future posts
    localStorage.setItem("clientAuthorName", reviewer);
    setAuthorName(reviewer);
    setShowAuthorInput(false);

    const freshComment: Partial<AssetComment> = {
      presentation_asset_id: assetId,
      author_name: reviewer,
      comment: newComment.trim(),
      created_at: new Date().toISOString()
    };

    // Append to local state list immediately
    const assetComments = comments[assetId] || [];
    const updatedList = [...assetComments, freshComment as AssetComment];
    setComments({
      ...comments,
      [assetId]: updatedList
    });

    setNewComment("");

    // Sync comment to DB / fallback LS
    try {
      const cleanComment = { ...freshComment };
      delete cleanComment.id; // DB auto-generates
      const { error } = await supabase.from("presentation_comments").insert([cleanComment]);
      if (error) throw error;
    } catch (err) {
      console.warn("Offline comment cached locally.");
      localStorage.setItem(`tochay_offline_comments_${assetId}`, JSON.stringify(updatedList));
    }

    // Trigger real-time comment notification email
    const targetAsset = assets.find(a => a.id === assetId);
    if (targetAsset && deck) {
      fetch("/api/presentation-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Comment",
          deckId: deck.id,
          deckTitle: deck.title,
          clientName: deck.client_name,
          assetId: targetAsset.id,
          filename: targetAsset.filename,
          category: targetAsset.category,
          fileUrl: targetAsset.file_url,
          reviewerName: reviewer,
          comment: freshComment.comment,
          token: deck.token,
        }),
      }).catch(err => {
        console.warn("Comment notification email notice:", err);
      });
    }
  };

  const handleSaveAuthorName = (e: React.FormEvent) => {
    e.preventDefault();
    if (authorName.trim()) {
      localStorage.setItem("clientAuthorName", authorName.trim());
      setShowAuthorInput(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 mb-3" />
        <span className="font-sans font-bold text-xs tracking-tight uppercase">Loading presentation showcase...</span>
      </main>
    );
  }

  if (errorScreen) {
    return (
      <main className="min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col justify-center items-center p-6 font-sans select-none">
        <div className="w-full max-w-md bg-white/70 border border-zinc-200/50 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center gap-4">
          <X className="w-12 h-12 text-red-500 bg-red-50 rounded-full p-2.5" />
          <h1 className="font-sans font-black text-lg tracking-tight uppercase mt-1">Presentation Access Locked</h1>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed max-w-xs">{errorScreen}</p>
        </div>
      </main>
    );
  }

  if (deck?.is_expired) {
    return (
      <main className="min-h-screen bg-[#f8f8f7] text-[#09090b] flex flex-col justify-center items-center p-6 font-sans select-none">
        <div className="w-full max-w-md bg-white/70 border border-zinc-200/50 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center gap-4">
          <Lock className="w-12 h-12 text-amber-500 bg-amber-50 rounded-full p-2.5" />
          <h1 className="font-sans font-black text-lg tracking-tight uppercase mt-1">Link Access Expired</h1>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed max-w-xs">
            This presentation deck link has expired. Please contact the designer to request extended access.
          </p>
        </div>
      </main>
    );
  }

  // Filter showcase assets by category
  const filteredAssets = selectedCategory === "All"
    ? assets
    : assets.filter(a => a.category === selectedCategory);

  // Approval progress math
  const totalAssetsCount = assets.length;
  const approvedAssetsCount = assets.filter(a => a.status === "Approved").length;
  const approvalPercent = totalAssetsCount > 0 
    ? Math.round((approvedAssetsCount / totalAssetsCount) * 100) 
    : 0;

  // Next/prev lightbox actions
  const handlePrevAsset = () => {
    if (activeAssetIdx !== null && activeAssetIdx > 0) {
      setActiveAssetIdx(activeAssetIdx - 1);
      setZoomScale(1);
      setRotationDegrees(0);
      setPdfPage(1);
    }
  };

  const handleNextAsset = () => {
    if (activeAssetIdx !== null && activeAssetIdx < filteredAssets.length - 1) {
      setActiveAssetIdx(activeAssetIdx + 1);
      setZoomScale(1);
      setRotationDegrees(0);
      setPdfPage(1);
    }
  };

  const activeAsset = activeAssetIdx !== null ? filteredAssets[activeAssetIdx] : null;

  return (
    <main className="w-full min-h-screen bg-[#f8f8f7] flex flex-col justify-between font-sans relative overflow-hidden">
      
      {/* Dynamic graphic client background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(9,9,11,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(9,9,11,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] select-none pointer-events-none z-0" />

      {/* Dynamic Navigation Header */}
      <Navbar />

      {/* Main Core View Area */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 pt-36 pb-20 flex-grow flex flex-col gap-8 z-10">
        
        {/* Page Title & Client Metadata */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200/80 pb-8 gap-6 select-none">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-bold bg-zinc-150/40 px-3 py-1 rounded-md self-start">
              {deck?.client_name}
            </span>
            <h1 className="font-sans font-bold text-3xl sm:text-4xl text-zinc-950 tracking-tight leading-none mt-1">
              {deck?.title}
            </h1>
          </div>

          {/* Approval progress */}
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider">Approval Status</span>
            <div className="flex items-center gap-3">
              <div className="flex-grow bg-zinc-200/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${approvalPercent}%` }}
                />
              </div>
              <span className="font-sans font-bold text-xs text-zinc-950 shrink-0">{approvalPercent}% Approved</span>
            </div>
          </div>
        </div>
        
        {/* Category Pills filtering tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-full font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
              selectedCategory === "All"
                ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                : "bg-white text-zinc-500 border-zinc-200/50 hover:bg-white/90 hover:text-zinc-900"
            }`}
          >
            All Deliverables
          </button>
          
          {(deck?.categories || []).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-sans font-semibold text-xs tracking-tight transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                  : "bg-white text-zinc-500 border-zinc-200/50 hover:bg-white/90 hover:text-zinc-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Deliverables asset grid */}
        {filteredAssets.length === 0 ? (
          <div className="w-full border border-dashed border-zinc-200 rounded-3xl py-24 flex flex-col items-center justify-center text-center select-none bg-white/40">
            <X className="w-10 h-10 text-zinc-300 mb-3" />
            <span className="font-sans font-black text-sm text-zinc-400 uppercase tracking-tight">No Deliverables in tag</span>
            <p className="font-sans text-[10px] text-zinc-400 mt-1">Select a different tab filter to review deliverables files.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAssets.map((asset, index) => (
              <div 
                key={asset.id}
                onClick={() => {
                  setActiveAssetIdx(index);
                  setIsFullscreenMedia(true);
                  setZoomScale(1);
                  setRotationDegrees(0);
                  setPdfPage(1);
                }}
                className="bg-white/60 backdrop-blur-xs border border-zinc-200/60 rounded-2xl overflow-hidden hover:shadow-lg hover:border-zinc-300/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Media Preview viewport */}
                <div className="relative w-full aspect-4/3 bg-zinc-50 flex items-center justify-center overflow-hidden select-none border-b border-zinc-200">
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
                      asset.status === "Approved" 
                        ? "bg-emerald-500 text-white" 
                        : asset.status === "Rejected"
                        ? "bg-red-500 text-white"
                        : "bg-zinc-800 text-white"
                    }`}>
                      {asset.status === "Approved" ? "Approved" : asset.status === "Rejected" ? "Revision Required" : "Reviewing"}
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
                      <span>{comments[asset.id]?.length || 0}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Interactive Proofing Lightbox modal workspace */}
      {activeAsset && activeAssetIdx !== null && (
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

            {/* Floating exit fullscreen button */}
            {isFullscreenMedia && (
              <button
                onClick={() => setIsFullscreenMedia(false)}
                className="absolute top-6 right-6 p-3 bg-zinc-900/80 border border-zinc-800 text-white rounded-full hover:bg-zinc-800 hover:scale-105 transition-all cursor-pointer z-50 shadow-2xl"
                title="Exit fullscreen review"
              >
                <X className="w-5 h-5" />
              </button>
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
              {!isFullscreenMedia && activeAssetIdx < filteredAssets.length - 1 && (
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
                    onClick={() => handleUpdateAssetStatus(activeAsset.id, "Approved")}
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
                    onClick={() => handleUpdateAssetStatus(activeAsset.id, "Rejected")}
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
                
                {(!comments[activeAsset.id] || comments[activeAsset.id].length === 0) ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 rounded-2xl select-none bg-zinc-100/40">
                    <MessageSquare className="w-6 h-6 text-zinc-300 mb-2" />
                    <span className="font-sans font-bold text-zinc-400 text-[10px]">No Comments Yet</span>
                    <p className="font-sans text-[9px] text-zinc-450 mt-0.5 leading-normal max-w-[180px]">Type feedback below to note revision requests.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {comments[activeAsset.id].map((comment, cIdx) => {
                      const isMe = comment.author_name === authorName;
                      const initials = comment.author_name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() || "CR";
                      return (
                        <div 
                          key={comment.id || cIdx} 
                          className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {/* Round initials avatar */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-sans font-bold border shrink-0 select-none ${
                            isMe 
                              ? "bg-[#ffd230] border-[#ffd230] text-zinc-950" 
                              : "bg-zinc-950 border-zinc-900 text-white"
                          }`}>
                            {initials}
                          </div>

                          <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-1.5 select-none">
                              <span className="font-sans font-bold text-[8px] text-zinc-450 tracking-wide uppercase">
                                {comment.author_name}
                              </span>
                              <span className="font-mono text-[7px] text-zinc-400">
                                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`px-4 py-2.5 rounded-[1.2rem] text-xs font-sans leading-normal break-words shadow-2xs ${
                              isMe 
                                ? "bg-zinc-950 text-white rounded-tr-none font-medium" 
                                : "bg-white border border-zinc-200 text-zinc-950 rounded-tl-none"
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

              {/* Footer: Input box editor */}
              <div className="p-4 border-t border-zinc-200 flex flex-col gap-2 bg-white">
                {showAuthorInput ? (
                  <div className="flex flex-col gap-1.5 select-none bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <span className="font-sans font-bold text-[8px] text-zinc-400 uppercase tracking-wider pl-0.5">Author Identity</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter name to post comment"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="flex-grow bg-white border border-zinc-200 rounded-lg py-1.5 px-3 text-xs font-sans font-semibold text-zinc-950 outline-none focus:outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => { if (authorName.trim()) setShowAuthorInput(false); }}
                        className="px-3 py-1.5 bg-zinc-950 text-white hover:bg-[#ffd230] hover:text-zinc-950 rounded-lg font-sans font-bold text-[10px] cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Comment as ${authorName}...`}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePostComment(activeAsset.id); } }}
                      className="flex-grow bg-zinc-50 border border-zinc-200 focus:border-zinc-400 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans text-zinc-950 outline-none focus:outline-none focus:ring-0 placeholder:text-zinc-400"
                    />
                    <button
                      onClick={() => handlePostComment(activeAsset.id)}
                      className="p-2.5 bg-zinc-950 hover:bg-[#ffd230] text-white hover:text-zinc-950 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs active:scale-95"
                      title="Send Feedback"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Name Request input prompt modal (first load) */}
      {showAuthorInput && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-xs" />
          <div className="relative w-full max-w-md bg-white border border-zinc-200/50 rounded-3xl p-8 shadow-2xl flex flex-col gap-5 z-10 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center text-white font-sans font-black text-xs">
                CLIENT
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm text-zinc-950">Reviewer Verification</span>
                <span className="font-sans text-[10px] text-zinc-400 font-semibold tracking-wide uppercase mt-0.5">Please introduce yourself</span>
              </div>
            </div>

            <form onSubmit={handleSaveAuthorName} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">Enter Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins (Acme Studio)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-3 px-4 text-xs font-sans font-semibold outline-none focus:outline-none focus:ring-0 text-zinc-950 shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs tracking-tight transition-all duration-300 cursor-pointer shadow-sm"
              >
                Enter Review Portal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <Footer />
    </main>
  );
}
