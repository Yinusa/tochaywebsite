"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  FolderArchive, 
  Loader2, 
  Mail, 
  Calendar,
  AlertCircle,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  File,
  LayoutGrid,
  Table as TableIcon,
  Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import JSZip from "jszip";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "file";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface CustomForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

interface SubmissionAsset {
  field_id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface FormSubmission {
  id: string;
  created_at: string;
  answers: Record<string, any>;
  assets: SubmissionAsset[];
}

export default function FormResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params?.id as string;

  const [form, setForm] = useState<CustomForm | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [zippingId, setZippingId] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Detailed modal sliding view state
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  // Lightbox gallery state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  useEffect(() => {
    if (formId) {
      loadFormData();
    }
  }, [formId]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      setErrorAlert(null);

      // Fetch Form Metadata
      const { data: formData, error: formError } = await supabase
        .from("custom_forms")
        .select("id, title, description, fields")
        .eq("id", formId)
        .single();

      if (formError || !formData) {
        throw new Error("Form template not found.");
      }

      setForm(formData);

      // Fetch Submissions List
      const { data: subData, error: subError } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false });

      if (subError) throw subError;

      setSubmissions(subData || []);
    } catch (err: any) {
      console.error(err);
      setErrorAlert(err.message || "Failed to load responses.");
    } finally {
      setLoading(false);
    }
  };

  const getFilePathFromUrl = (url: string, bucketName = "showcase") => {
    const marker = `/public/${bucketName}/`;
    const index = url.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(url.substring(index + marker.length));
    }
    return null;
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission and all its uploaded files? This cannot be undone.")) return;

    try {
      const sub = submissions.find(s => s.id === id);
      if (sub && sub.assets.length > 0) {
        const filePaths = sub.assets
          .map((asset) => getFilePathFromUrl(asset.url))
          .filter(Boolean) as string[];

        if (filePaths.length > 0) {
          // Delete storage files in batch
          await supabase.storage.from("showcase").remove(filePaths);
        }
      }

      // Delete database row
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => s.id !== id));
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Failed to delete submission:", err);
      alert("Failed to delete submission responses.");
    }
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = localUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      console.warn("Direct download failed, falling back to opening in a new tab", err);
      window.open(url, "_blank");
    }
  };

  const handleDownloadAllAssets = async (submission: FormSubmission) => {
    if (submission.assets.length === 0) return;

    try {
      setZippingId(submission.id);
      const zip = new JSZip();

      // Fetch all assets and pack them
      const fetchPromises = submission.assets.map(async (asset) => {
        try {
          const res = await fetch(asset.url);
          if (!res.ok) throw new Error("CORS fetch failed");
          const blob = await res.blob();
          zip.file(asset.name, blob);
        } catch (e) {
          console.warn(`Could not pack ${asset.name} via fetch blob. Generating reference shortcut file.`, e);
          // CORS fallback: Add a text file containing the URL shortcut instead of throwing error
          zip.file(`${asset.name}_link.txt`, `Direct URL: ${asset.url}`);
        }
      });

      await Promise.all(fetchPromises);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${form?.title.replace(/[^a-zA-Z0-9]/g, "_")}_${submission.id.substring(0, 6)}_assets.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Zipping error:", err);
      alert("Failed to pack attachments. You can still download individual files.");
    } finally {
      setZippingId(null);
    }
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const handleLightboxNav = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
    } else {
      setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <main className="w-full min-h-screen bg-zinc-50 py-10 px-6 sm:px-8 md:px-12 font-sans text-zinc-900 select-text">
      
      {/* Upper Navigation Back Button */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between mb-8 select-none">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 text-xs font-sans font-bold text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio Dashboard</span>
        </button>

        {/* View Mode Switches */}
        <div className="flex items-center gap-1 bg-zinc-150 p-1 rounded-lg border border-zinc-200">
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              viewMode === "table" ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              viewMode === "card" ? "bg-white text-zinc-950 shadow-xs" : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Form Title Header */}
        <div className="pb-6 border-b border-zinc-200">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#ffd230] font-bold select-none">
            Intake Responses Dashboard
          </span>
          <h1 className="font-sans font-bold text-3xl sm:text-4xl text-zinc-950 mt-1 select-none">
            {form?.title || "Intake Responses"}
          </h1>
          {form?.description && (
            <p className="font-sans font-normal text-zinc-400 text-xs sm:text-sm mt-1 select-none">
              {form.description}
            </p>
          )}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-400 select-none">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mb-2" />
            <span className="text-xs font-semibold">Retrieving submissions datasets...</span>
          </div>
        ) : errorAlert ? (
          /* Error Callout */
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-sans font-bold text-xs text-red-950">Intake Module Warning</span>
              <p className="font-sans font-normal text-red-800 text-xs leading-relaxed">{errorAlert}</p>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          /* Empty Workspace */
          <div className="w-full border border-dashed border-zinc-200 rounded-3xl py-24 flex flex-col items-center justify-center text-center select-none bg-white">
            <Mail className="w-10 h-10 text-zinc-200 mb-3" />
            <span className="font-sans font-bold text-zinc-400 text-sm">No Client Submissions Indexed</span>
            <p className="font-sans font-normal text-zinc-400 text-xs max-w-xs mt-1 leading-normal">
              Once clients fill out this form template, their answers and attachments will render here in real-time.
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW MODE */
          <div className="w-full bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-150 font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider select-none">
                    <th className="py-4 px-6">Timestamp Date</th>
                    <th className="py-4 px-6">Client Response preview</th>
                    <th className="py-4 px-6">Uploaded Assets</th>
                    <th className="py-4 px-6 text-right">Action controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 font-sans text-xs text-zinc-950">
                  {submissions.map((sub) => {
                    // Try to guess a representative answer for a name
                    const firstTextId = form?.fields.find(f => f.type === "text")?.id || "";
                    const previewText = sub.answers[firstTextId] || "Submision Reference";
                    const isZipping = zippingId === sub.id;

                    return (
                      <tr 
                        key={sub.id}
                        className="hover:bg-zinc-50/40 transition-colors"
                      >
                        <td className="py-4 px-6 select-none font-medium text-zinc-500 whitespace-nowrap">
                          {new Date(sub.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-semibold truncate max-w-[200px]">
                          {previewText}
                        </td>
                        <td className="py-4 px-6 select-none font-medium text-zinc-400">
                          {sub.assets.length === 0 ? (
                            <span className="italic text-zinc-300">No attachments</span>
                          ) : (
                            <span className="text-zinc-600 font-semibold">{sub.assets.length} items</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right select-none whitespace-nowrap">
                          <div className="flex items-center justify-end gap-3">
                            {sub.assets.length > 0 && (
                              <button
                                disabled={isZipping}
                                onClick={() => handleDownloadAllAssets(sub)}
                                className="p-2 border border-zinc-200 hover:border-zinc-500 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer disabled:opacity-40"
                                title="Download All (.zip)"
                              >
                                {isZipping ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <FolderArchive className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedSubmission(sub)}
                              className="px-3.5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-lg font-sans font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              Open Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARD GRID VIEW MODE */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((sub) => {
              const firstTextId = form?.fields.find(f => f.type === "text")?.id || "";
              const previewText = sub.answers[firstTextId] || "Submision Reference";
              const isZipping = zippingId === sub.id;

              return (
                <div 
                  key={sub.id}
                  className="border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between gap-5 bg-white shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between select-none">
                      <span className="font-mono text-[9px] font-bold text-zinc-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-mono text-[9px] text-[#ffd230] font-bold">
                        {sub.assets.length} ASSETS
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      <h4 className="font-sans font-bold text-base text-zinc-950 truncate">
                        {previewText}
                      </h4>
                      <p className="font-mono text-[9px] text-zinc-300 select-all truncate mt-0.5">
                        ID: {sub.id}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-end select-none mt-2 gap-2 pt-3 border-t border-zinc-100">
                    {sub.assets.length > 0 && (
                      <button
                        disabled={isZipping}
                        onClick={() => handleDownloadAllAssets(sub)}
                        className="px-2.5 py-1.5 border border-zinc-200 hover:border-zinc-500 rounded-xl text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        {isZipping ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FolderArchive className="w-3.5 h-3.5" />
                        )}
                        <span>Zip All</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="px-3.5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-xl font-sans font-bold text-[10px] cursor-pointer"
                    >
                      Open Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* DETAILED SUBMISSION SLIDEOVER DRAWER PANEL */}
      {selectedSubmission && form && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs select-none" 
            onClick={() => setSelectedSubmission(null)} 
          />

          {/* Drawer Body Container */}
          <div className="relative w-full max-w-xl bg-white border-l border-zinc-200 h-full shadow-2xl flex flex-col z-10 animate-slide-in" data-lenis-prevent>
            <header className="px-6 py-5 border-b border-zinc-150 flex items-center justify-between select-none shrink-0">
              <div className="flex flex-col">
                <span className="font-sans font-bold text-sm text-zinc-950">Detailed Responses View</span>
                <span className="font-mono text-[9px] text-zinc-400 block mt-0.5">Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}</span>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-zinc-400 hover:text-zinc-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Scrollable responses details */}
            <div className="flex-grow overflow-y-auto p-6 sm:p-8 flex flex-col gap-6">
              
              {/* QA Pairs list */}
              <div className="flex flex-col gap-5">
                <span className="font-sans font-bold text-[10px] text-zinc-400 uppercase tracking-widest select-none pl-0.5">Client Answers</span>
                <div className="flex flex-col gap-4 divide-y divide-zinc-100">
                  {form.fields.map((field) => {
                    const ans = selectedSubmission.answers[field.id];
                    
                    if (field.type === "file") {
                      const fieldAssets = selectedSubmission.assets.filter(a => a.field_id === field.id);
                      return (
                        <div key={field.id} className="flex flex-col gap-2 pt-4 first:pt-0 first:border-t-0">
                          <span className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5 select-none">{field.label}</span>
                          {fieldAssets.length === 0 ? (
                            <span className="font-sans text-xs text-zinc-400 italic pl-0.5">No files uploaded.</span>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                              {fieldAssets.map((asset, aIdx) => {
                                const isImg = asset.type.startsWith("image/");
                                return (
                                  <div 
                                    key={aIdx} 
                                    className="border border-zinc-200 bg-zinc-50/20 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs hover:border-zinc-300 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {isImg ? (
                                        <div 
                                          className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-50 shrink-0 border border-zinc-100 cursor-pointer relative group"
                                          onClick={() => {
                                            const imgUrls = fieldAssets.filter(a => a.type.startsWith("image/")).map(a => a.url);
                                            const idx = imgUrls.indexOf(asset.url);
                                            openLightbox(imgUrls, idx);
                                          }}
                                        >
                                          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Maximize2 className="w-3 h-3 text-white" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-100 select-none">
                                          <File className="w-5 h-5" />
                                        </div>
                                      )}
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-sans font-semibold text-xs text-zinc-950 truncate leading-snug max-w-[120px]" title={asset.name}>
                                          {asset.name}
                                        </span>
                                        <span className="font-mono text-[9px] text-zinc-400 mt-0.5">
                                          {formatSize(asset.size)}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadFile(asset.url, asset.name)}
                                      className="text-zinc-400 hover:text-zinc-950 transition-colors shrink-0 p-1 rounded-md border border-transparent hover:border-zinc-200 select-none bg-white/50 cursor-pointer"
                                      title="Download Link"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Standard text/selection question rendering
                    let formattedAnswer = "";
                    if (ans === undefined || ans === null || ans === "") {
                      formattedAnswer = "No response provided.";
                    } else if (Array.isArray(ans)) {
                      formattedAnswer = ans.join(", ");
                    } else {
                      formattedAnswer = ans.toString();
                    }

                    return (
                      <div key={field.id} className="flex flex-col gap-1.5 pt-4 first:pt-0 first:border-t-0">
                        <span className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5 select-none">{field.label}</span>
                        <p className="font-sans font-semibold text-xs sm:text-sm text-zinc-950 leading-relaxed whitespace-pre-wrap">
                          {formattedAnswer}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Drawer Footer with Actions */}
            <footer className="px-6 py-4 border-t border-zinc-150 flex items-center justify-between bg-zinc-50/50 shrink-0 select-none">
              <span className="font-mono text-[9px] text-zinc-400">
                Ref: {selectedSubmission.id.substring(0, 8)}...
              </span>
              
              <div className="flex items-center gap-3">
                {selectedSubmission.assets.length > 0 && (
                  <button
                    type="button"
                    disabled={zippingId === selectedSubmission.id}
                    onClick={() => handleDownloadAllAssets(selectedSubmission)}
                    className="px-4 py-2 border border-zinc-200 hover:border-zinc-500 rounded-full font-sans font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1.5 bg-white shadow-xs disabled:opacity-40"
                  >
                    {zippingId === selectedSubmission.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FolderArchive className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                    <span>Zip All ({selectedSubmission.assets.length})</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => handleDeleteSubmission(selectedSubmission.id)}
                  className="px-4 py-2 border border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 rounded-full font-sans font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Response</span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* FULL SCREEN LIGHTBOX IMAGES GALLERY */}
      {lightboxIndex >= 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-fade-in">
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(-1)}
            className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors cursor-pointer bg-zinc-900/60 p-2 rounded-full border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation Controls */}
          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={() => handleLightboxNav("prev")}
                className="absolute left-6 text-zinc-400 hover:text-white transition-colors cursor-pointer bg-zinc-900/60 p-3 rounded-full border border-zinc-800"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleLightboxNav("next")}
                className="absolute right-6 text-zinc-400 hover:text-white transition-colors cursor-pointer bg-zinc-900/60 p-3 rounded-full border border-zinc-800"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Gallery image display */}
          <div className="max-w-[85vw] max-h-[85vh] flex flex-col items-center gap-3">
            <img 
              src={lightboxImages[lightboxIndex]} 
              alt="High resolution gallery preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-zinc-900"
            />
            {lightboxImages.length > 1 && (
              <span className="font-sans text-[10px] text-zinc-400 uppercase tracking-widest font-semibold bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800/40">
                Image {lightboxIndex + 1} of {lightboxImages.length}
              </span>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
