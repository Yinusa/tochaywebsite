"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  CheckCircle2, 
  Eye, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  PlusCircle, 
  Settings2,
  X,
  Loader2,
  GripVertical,
  ArrowLeft,
  Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "file";
  placeholder?: string;
  required: boolean;
  options?: string[]; // for radio, checkbox
  maxSizeMb?: number; // for file
  allowedTypes?: string[]; // for file (e.g. ['.png', '.jpg', '.pdf'])
  maxFiles?: number; // for file
}

interface CustomForm {
  id: string;
  created_at: string;
  title: string;
  description: string;
  success_message: string;
  slug: string;
  fields: FormField[];
  is_active: boolean;
  submission_count?: number;
}

export default function FormBuilderTab() {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Editor State
  const [editingForm, setEditingForm] = useState<Partial<CustomForm> | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      // Fetch forms
      const { data: formData, error: formError } = await supabase
        .from("custom_forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (formError) throw formError;

      // Fetch submissions count per form
      const { data: subData, error: subError } = await supabase
        .from("form_submissions")
        .select("form_id");

      if (subError) throw subError;

      const counts: Record<string, number> = {};
      subData?.forEach((sub) => {
        counts[sub.form_id] = (counts[sub.form_id] || 0) + 1;
      });

      const mappedForms = (formData || []).map((form) => ({
        ...form,
        submission_count: counts[form.id] || 0
      }));

      setForms(mappedForms);
    } catch (err) {
      console.error("Failed to load custom forms:", err);
      setAlert({ type: "error", message: "Failed to load custom forms." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewForm = () => {
    const randomSlug = "form-" + Math.random().toString(36).substring(2, 8);
    setEditingForm({
      title: "",
      description: "",
      success_message: "Thank you! Your submission has been received successfully.",
      slug: randomSlug,
      is_active: true
    });
    setFormFields([
      {
        id: "field-1",
        label: "Your Full Name",
        type: "text",
        placeholder: "e.g. John Doe",
        required: true
      }
    ]);
    setShowModal(true);
  };

  const handleEditForm = (form: CustomForm) => {
    setEditingForm(form);
    setFormFields(form.fields);
    setShowModal(true);
  };

  const handleAddField = () => {
    const newField: FormField = {
      id: "field-" + Date.now(),
      label: "New Question Label",
      type: "text",
      placeholder: "Type here...",
      required: false
    };
    setFormFields([...formFields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFormFields(formFields.filter((f) => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFormFields(
      formFields.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, ...updates };
        // Clean options or limit properties if type changed
        if (updates.type) {
          if (updates.type !== "radio" && updates.type !== "checkbox") {
            delete updated.options;
          } else {
            updated.options = updated.options || ["Option 1", "Option 2"];
          }
          if (updates.type !== "file") {
            delete updated.maxSizeMb;
            delete updated.allowedTypes;
            delete updated.maxFiles;
          } else {
            updated.maxSizeMb = 10;
            updated.allowedTypes = [".png", ".jpg", ".svg", ".pdf", ".zip"];
            updated.maxFiles = 5;
          }
        }
        return updated;
      })
    );
  };

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const list = [...formFields];
    const draggedItem = list[draggedIdx];
    list.splice(draggedIdx, 1);
    list.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setFormFields(list);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === formFields.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const list = [...formFields];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setFormFields(list);
  };

  const handleAddOption = (fieldId: string) => {
    setFormFields(
      formFields.map((f) => {
        if (f.id === fieldId) {
          const currentOptions = f.options || [];
          return {
            ...f,
            options: [...currentOptions, `Option ${currentOptions.length + 1}`]
          };
        }
        return f;
      })
    );
  };

  const handleRemoveOption = (fieldId: string, optionIndex: number) => {
    setFormFields(
      formFields.map((f) => {
        if (f.id === fieldId && f.options) {
          return {
            ...f,
            options: f.options.filter((_, idx) => idx !== optionIndex)
          };
        }
        return f;
      })
    );
  };

  const handleOptionChange = (fieldId: string, optionIndex: number, value: string) => {
    setFormFields(
      formFields.map((f) => {
        if (f.id === fieldId && f.options) {
          const newOpts = [...f.options];
          newOpts[optionIndex] = value;
          return { ...f, options: newOpts };
        }
        return f;
      })
    );
  };

  const handleToggleAllowedType = (fieldId: string, ext: string) => {
    setFormFields(
      formFields.map((f) => {
        if (f.id === fieldId) {
          const current = f.allowedTypes || [];
          const updated = current.includes(ext)
            ? current.filter((x) => x !== ext)
            : [...current, ext];
          return { ...f, allowedTypes: updated };
        }
        return f;
      })
    );
  };

  const handleCopyLink = (slug: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/form/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm || !editingForm.title || !editingForm.slug) {
      setAlert({ type: "error", message: "Form title and custom slug are required." });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: editingForm.title,
        description: editingForm.description || "",
        success_message: editingForm.success_message || "Thank you! Your submission has been received.",
        slug: editingForm.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ""),
        fields: formFields,
        is_active: editingForm.is_active ?? true
      };

      if (editingForm.id) {
        // Update
        const { error } = await supabase
          .from("custom_forms")
          .update(payload)
          .eq("id", editingForm.id);

        if (error) throw error;
        setAlert({ type: "success", message: "Form updated successfully!" });
      } else {
        // Create
        const { error } = await supabase
          .from("custom_forms")
          .insert([payload]);

        if (error) throw error;
        setAlert({ type: "success", message: "Form created successfully!" });
      }

      setShowModal(false);
      fetchForms();
    } catch (err: any) {
      console.error("Failed to save custom form:", err);
      setAlert({ type: "error", message: err.message || "Failed to save form details." });
    } finally {
      setSaving(false);
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

  const handleDeleteForm = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom form and all its responses?")) return;

    try {
      // 1. Fetch all submissions to extract their file attachments paths
      const { data: submissionsData } = await supabase
        .from("form_submissions")
        .select("assets")
        .eq("form_id", id);

      if (submissionsData && submissionsData.length > 0) {
        const filePaths = submissionsData
          .flatMap((sub) => (sub.assets || []).map((asset: any) => getFilePathFromUrl(asset.url)))
          .filter(Boolean) as string[];

        if (filePaths.length > 0) {
          // Delete files in batch
          await supabase.storage.from("showcase").remove(filePaths);
        }
      }

      // 2. Delete the custom form (foreign key cascade deletes form_submissions rows)
      const { error } = await supabase
        .from("custom_forms")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setAlert({ type: "success", message: "Form deleted successfully." });
      fetchForms();
    } catch (err) {
      console.error("Failed to delete form:", err);
      setAlert({ type: "error", message: "Failed to delete form." });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* Alert Notification Toast */}
      {alert && (
        <div className={`fixed top-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 px-5 py-3.5 rounded-2xl border flex items-center gap-3 shadow-xl leading-normal break-words ${
          alert.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span className="font-sans font-semibold text-xs text-left leading-normal">{alert.message}</span>
          <button onClick={() => setAlert(null)} className="ml-auto text-zinc-400 hover:text-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none pb-4 border-b border-zinc-150">
        <div className="flex flex-col">
          <h2 className="font-sans font-bold text-xl text-zinc-950">Custom Form Client Builders</h2>
          <p className="font-sans font-normal text-zinc-400 text-xs mt-0.5">
            Design dynamic request forms, questionnaires, and onboarding templates to gather files & asset details from clients.
          </p>
        </div>
        <button
          onClick={handleCreateNewForm}
          className="px-4 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Build Custom Form</span>
        </button>
      </div>

      {/* Forms List Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400 select-none">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mb-2" />
          <span className="font-sans text-xs">Loading custom form configurations...</span>
        </div>
      ) : forms.length === 0 ? (
        <div className="w-full border border-dashed border-zinc-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center select-none bg-white/50">
          <FileText className="w-10 h-10 text-zinc-200 mb-3" />
          <span className="font-sans font-bold text-zinc-400 text-sm">No Custom Forms Available</span>
          <p className="font-sans font-normal text-zinc-400 text-xs max-w-xs mt-1 leading-normal">
            Get started by building a dynamic file request form to send to your clients.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between gap-5 bg-white hover:shadow-xs transition-shadow"
            >
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-between select-none">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400 font-bold">
                    {form.fields.length} Configured Fields
                  </span>
                  <span className={`font-sans font-bold text-[9px] uppercase px-2 py-0.5 rounded-md ${
                    form.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-105" : "bg-zinc-105 text-zinc-500"
                  }`}>
                    {form.is_active ? "Active Link" : "Paused"}
                  </span>
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <h3 className="font-sans font-bold text-base text-zinc-950 tracking-tight leading-snug">
                    {form.title}
                  </h3>
                  <p className="font-sans font-normal text-zinc-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                    {form.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex items-center justify-end select-none mt-2 gap-2.5 pt-3 border-t border-zinc-100">
                {/* Responses counter button */}
                <a
                  href={`/admin/forms/${form.id}/responses`}
                  className="text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer mr-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Submissions ({form.submission_count || 0})</span>
                </a>

                {/* Copy link button */}
                <button
                  onClick={() => handleCopyLink(form.slug, form.id)}
                  className={`px-2.5 py-1.5 rounded-full font-sans font-bold text-[10px] flex items-center gap-1 transition-all duration-300 cursor-pointer ${
                    copiedId === form.id 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : "text-zinc-500 hover:text-zinc-950"
                  }`}
                >
                  {copiedId === form.id ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                {/* Edit Form */}
                <button
                  onClick={() => handleEditForm(form)}
                  className="text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>

                {/* Delete Form */}
                <button
                  onClick={() => handleDeleteForm(form.id)}
                  className="text-zinc-400 hover:text-red-600 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL PAGE FORM BUILDER OVERLAY */}
      {showModal && editingForm && (
        <div className="fixed inset-0 z-[70] bg-[#f8f8f7] text-[#09090b] flex flex-col font-sans overflow-y-auto animate-fade-in select-none" data-lenis-prevent>
          {/* Full Page Sticky Header */}
          <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 font-sans font-bold text-xs text-zinc-700 transition-colors cursor-pointer shrink-0"
                title="Back to forms"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Forms</span>
              </button>
              <div className="h-4 w-px bg-zinc-200 hidden sm:block shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-sans font-bold text-sm sm:text-base text-zinc-950 truncate">
                  {editingForm.id ? "Edit Custom Form Builder" : "Design Custom Form Builder"}
                </span>
                <span className="font-sans text-[11px] text-zinc-400 truncate">
                  {editingForm.title || "Untitled Form"} • {formFields.length} Questions
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </header>

          {/* Full Page Body */}
          <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
            <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xs">
              <form onSubmit={handleSaveForm} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                {/* Left Column: Form Metadata Settings */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <span className="font-sans font-bold text-[10px] text-zinc-400 uppercase tracking-widest pl-0.5 select-none">
                    Form Settings
                  </span>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">Form Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Design Assets Intake Form"
                      value={editingForm.title || ""}
                      onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">Description Instructions</label>
                    <textarea
                      rows={3}
                      placeholder="Provide specific guidelines to the client when completing this form..."
                      value={editingForm.description || ""}
                      onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-normal outline-hidden text-zinc-950 resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">Custom Success Message</label>
                    <textarea
                      rows={2}
                      placeholder="Success! Your response has been recorded."
                      value={editingForm.success_message || ""}
                      onChange={(e) => setEditingForm({ ...editingForm, success_message: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-500 focus:bg-white rounded-xl py-2.5 px-4 text-xs font-sans font-normal outline-hidden text-zinc-950 resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-sans font-semibold text-[10px] text-zinc-400 uppercase tracking-wider pl-0.5">Custom URL Slug</label>
                    <div className="flex items-center bg-zinc-50 border border-zinc-200 focus-within:border-zinc-500 rounded-xl px-4 py-2.5">
                      <span className="text-zinc-300 font-mono text-xs select-none pr-1">/form/</span>
                      <input
                        type="text"
                        required
                        placeholder="branding-assets"
                        value={editingForm.slug || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, slug: e.target.value })}
                        className="bg-transparent border-none outline-hidden text-xs font-mono font-bold text-zinc-950 w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 mt-2 pl-0.5 select-none">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingForm.is_active ?? true}
                      onChange={(e) => setEditingForm({ ...editingForm, is_active: e.target.checked })}
                      className="w-4 h-4 border-zinc-300 rounded-sm text-zinc-950 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="is_active" className="font-sans font-semibold text-xs text-zinc-700 cursor-pointer">
                      Enable Public Link Submissions
                    </label>
                  </div>
                </div>

                {/* Right Column: Fields Custom Dynamic Form Editor */}
                <div className="lg:col-span-7 flex flex-col gap-5 border-t lg:border-t-0 lg:border-l border-zinc-100 pt-6 lg:pt-0 lg:pl-8">
                  <div className="flex items-center justify-between select-none">
                    <span className="font-sans font-bold text-[10px] text-zinc-400 uppercase tracking-widest pl-0.5">
                      Form Questions & Inputs
                    </span>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="font-sans font-bold text-[10px] text-zinc-500 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Question Field</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {formFields.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl select-none">
                        <span className="font-sans text-xs text-zinc-400 italic">No input fields added. Click 'Add Question Field' above.</span>
                      </div>
                    ) : (
                      formFields.map((field, idx) => (
                        <div 
                          key={field.id} 
                          draggable={true}
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`border rounded-2xl p-4 flex flex-col gap-3 relative group/field transition-all duration-200 ${
                            draggedIdx === idx 
                              ? "opacity-40 border-dashed border-zinc-400 bg-zinc-100" 
                              : "border-zinc-200 bg-zinc-50/20 hover:border-zinc-300"
                          }`}
                        >
                          {/* Upper Controls Row */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 select-none cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="font-sans font-bold text-xs text-zinc-400">#{idx + 1} Question</span>
                            </div>
                            
                            {/* Reordering and deleting buttons */}
                            <div className="flex items-center gap-2 select-none">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveField(idx, "up")}
                                className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formFields.length - 1}
                                onClick={() => moveField(idx, "down")}
                                className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveField(field.id)}
                                className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Delete Question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Field Configuration Inputs */}
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Question Title / Label</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. What is your brand name?"
                                value={field.label}
                                onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2 px-3 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="flex flex-col gap-1 w-full sm:w-1/2">
                                <label className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Answer Input Type</label>
                                <select
                                  value={field.type}
                                  onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                                  className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2 px-3 text-xs font-sans font-semibold outline-hidden text-zinc-950"
                                >
                                  <option value="text">Text Input (Short)</option>
                                  <option value="textarea">Paragraph Box (Long)</option>
                                  <option value="radio">Multiple Choice (Single Option)</option>
                                  <option value="checkbox">Checkboxes (Multiple Options)</option>
                                  <option value="file">File Upload / Attachment Dropzone</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2 pt-0 sm:pt-4 select-none">
                                <input
                                  type="checkbox"
                                  id={`req-${field.id}`}
                                  checked={field.required}
                                  onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                                  className="w-4 h-4 border-zinc-300 rounded-sm text-zinc-950 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                />
                                <label htmlFor={`req-${field.id}`} className="font-sans font-semibold text-xs text-zinc-700 cursor-pointer">
                                  Required Question
                                </label>
                              </div>
                            </div>

                            {/* Conditional Placeholder for text/textarea */}
                            {(field.type === "text" || field.type === "textarea") && (
                              <div className="flex flex-col gap-1">
                                <label className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Placeholder Guide</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Type your answer here..."
                                  value={field.placeholder || ""}
                                  onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                                  className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-xl py-2 px-3 text-xs font-sans font-normal outline-hidden text-zinc-950"
                                />
                              </div>
                            )}

                            {/* File Upload Configuration Options */}
                            {field.type === "file" && (
                              <div className="mt-2 p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col gap-3 select-none">
                                <span className="font-sans font-bold text-[9px] text-zinc-500 uppercase tracking-wider">
                                  File Upload Restrictions
                                </span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="font-sans text-[10px] text-zinc-600">Max File Size (MB)</label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={50}
                                      value={field.maxSizeMb || 10}
                                      onChange={(e) => handleUpdateField(field.id, { maxSizeMb: parseInt(e.target.value) || 10 })}
                                      className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-sans text-zinc-900 outline-none focus:border-zinc-950"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="font-sans text-[10px] text-zinc-600">Max Files Count</label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={10}
                                      value={field.maxFiles || 5}
                                      onChange={(e) => handleUpdateField(field.id, { maxFiles: parseInt(e.target.value) || 5 })}
                                      className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-sans text-zinc-900 outline-none focus:border-zinc-950"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <label className="font-sans text-[10px] text-zinc-600">Allowed Formats</label>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { label: "Images (PNG, JPG, SVG, WebP)", exts: [".png", ".jpg", ".jpeg", ".svg", ".webp"] },
                                      { label: "Documents (PDF, AI, PSD, EPS)", exts: [".pdf", ".ai", ".psd", ".eps"] },
                                      { label: "Archives (ZIP, RAR)", exts: [".zip", ".rar"] }
                                    ].map((preset) => {
                                      const currentAllowed = field.allowedTypes || [".png", ".jpg", ".jpeg", ".pdf", ".zip"];
                                      const isAllSelected = preset.exts.every(ext => currentAllowed.includes(ext));

                                      return (
                                        <button
                                          key={preset.label}
                                          type="button"
                                          onClick={() => {
                                            if (isAllSelected) {
                                              handleUpdateField(field.id, {
                                                allowedTypes: currentAllowed.filter(ext => !preset.exts.includes(ext))
                                              });
                                            } else {
                                              const set = new Set([...currentAllowed, ...preset.exts]);
                                              handleUpdateField(field.id, {
                                                allowedTypes: Array.from(set)
                                              });
                                            }
                                          }}
                                          className={`px-2 py-1 rounded-md text-[10px] font-sans font-semibold border transition-all cursor-pointer ${
                                            isAllSelected 
                                              ? "bg-zinc-950 text-white border-zinc-950" 
                                              : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                                          }`}
                                        >
                                          {preset.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Conditional Options Editor for radio / checkbox */}
                            {(field.type === "radio" || field.type === "checkbox") && (
                              <div className="flex flex-col gap-2 pt-2 border-t border-zinc-150/70 select-none">
                                <label className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Selectable Options</label>
                                <div className="flex flex-col gap-2">
                                  {(field.options || ["Option 1", "Option 2"]).map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-zinc-300">•</span>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const nextOptions = [...(field.options || ["Option 1", "Option 2"])];
                                          nextOptions[optIdx] = e.target.value;
                                          handleUpdateField(field.id, { options: nextOptions });
                                        }}
                                        className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-lg py-1 px-2.5 text-xs font-sans text-zinc-950 outline-hidden"
                                      />
                                      {(field.options || []).length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const nextOptions = (field.options || []).filter((_, i) => i !== optIdx);
                                            handleUpdateField(field.id, { options: nextOptions });
                                          }}
                                          className="text-zinc-300 hover:text-red-600 cursor-pointer p-1"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextOptions = [...(field.options || ["Option 1", "Option 2"]), `Option ${(field.options || []).length + 1}`];
                                    handleUpdateField(field.id, { options: nextOptions });
                                  }}
                                  className="text-zinc-500 hover:text-zinc-950 font-sans font-bold text-[10px] flex items-center gap-1 cursor-pointer self-start mt-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Another Option</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {formFields.length > 0 && (
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="w-full py-4 border border-dashed border-zinc-200 hover:border-zinc-500 rounded-2xl flex items-center justify-center gap-2 font-sans font-bold text-xs text-zinc-505 hover:text-zinc-950 transition-colors select-none cursor-pointer bg-zinc-50/10 hover:bg-zinc-50/30 mt-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Question Field</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer Bar */}
                <div className="lg:col-span-12 pt-6 mt-2 border-t border-zinc-100 flex items-center justify-end gap-3 select-none">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl font-sans font-semibold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveForm}
                    disabled={saving}
                    className="px-7 py-2.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 disabled:opacity-50 text-white rounded-xl font-sans font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                        <span>Saving Form...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Form Link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
