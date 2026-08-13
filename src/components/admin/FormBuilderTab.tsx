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
  Loader2
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
      placeholder: "",
      required: false
    };
    setFormFields([...formFields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFormFields(formFields.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id: string, updates: Partial<FormField>) => {
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
    const url = `${origin}/f/${slug}`;
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

      {/* BUILDER MODAL OVERLAY */}
      {showModal && editingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in z-10" data-lenis-prevent>
            <header className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-zinc-500" />
                <span className="font-sans font-bold text-sm text-zinc-950">
                  {editingForm.id ? "Edit Custom Form Builder" : "Design Custom Form Builder"}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-950 transition-colors focus:outline-hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSaveForm} className="flex-grow overflow-y-auto p-6 sm:p-8 flex flex-col md:flex-row gap-8">
              {/* Left Column: Form Metadata Settings */}
              <div className="w-full md:w-5/12 flex flex-col gap-5">
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
                    <span className="text-zinc-300 font-mono text-xs select-none pr-1">/f/</span>
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
              <div className="w-full md:w-7/12 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-6">
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
                      <div key={field.id} className="border border-zinc-200 rounded-2xl p-4 flex flex-col gap-3 bg-zinc-50/20 relative group/field">
                        {/* Upper Controls Row */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-sans font-bold text-xs text-zinc-400 select-none">#{idx + 1} Question</span>
                          
                          {/* Reordering and deleting buttons */}
                          <div className="flex items-center gap-2 select-none">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveField(idx, "up")}
                              className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === formFields.length - 1}
                              onClick={() => moveField(idx, "down")}
                              className="p-1 rounded-md text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveField(field.id)}
                              className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50/50 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Input configurations fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Question Title / Label</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Upload your vector logos"
                              value={field.label}
                              onChange={(e) => handleFieldChange(field.id, { label: e.target.value })}
                              className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-lg p-2 text-xs font-sans font-semibold text-zinc-950"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Answer Input Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => handleFieldChange(field.id, { type: e.target.value as any })}
                              className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-lg p-2 text-xs font-sans font-semibold text-zinc-950 focus:outline-hidden"
                            >
                              <option value="text">Text Input (Short)</option>
                              <option value="textarea">Textarea (Long Text)</option>
                              <option value="radio">Single-Select Options (Radio)</option>
                              <option value="checkbox">Multi-Select Options (Checkboxes)</option>
                              <option value="file">File / Asset Upload</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2.5 sm:mt-6 pl-0.5 select-none">
                            <input
                              type="checkbox"
                              id={`req-${field.id}`}
                              checked={field.required}
                              onChange={(e) => handleFieldChange(field.id, { required: e.target.checked })}
                              className="w-4 h-4 border-zinc-300 rounded-sm text-zinc-950 focus:ring-0 cursor-pointer"
                            />
                            <label htmlFor={`req-${field.id}`} className="font-sans font-semibold text-xs text-zinc-600 cursor-pointer">Required Question</label>
                          </div>
                        </div>

                        {/* Conditional Placeholder rendering */}
                        {(field.type === "text" || field.type === "textarea") && (
                          <div className="flex flex-col gap-1 mt-1">
                            <label className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Placeholder Guide</label>
                            <input
                              type="text"
                              placeholder="e.g. Type your company tagline here..."
                              value={field.placeholder || ""}
                              onChange={(e) => handleFieldChange(field.id, { placeholder: e.target.value })}
                              className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-lg p-2 text-xs font-sans font-normal text-zinc-950"
                            />
                          </div>
                        )}

                        {/* Conditional Options rendering (checkboxes or radio buttons) */}
                        {(field.type === "radio" || field.type === "checkbox") && (
                          <div className="flex flex-col gap-2 mt-1">
                            <div className="flex items-center justify-between select-none">
                              <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Multiple Choice Options</span>
                              <button
                                type="button"
                                onClick={() => handleAddOption(field.id)}
                                className="font-sans font-bold text-[9px] text-zinc-500 hover:text-zinc-950 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Choice</span>
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {field.options?.map((option, oIdx) => (
                                <div key={oIdx} className="flex items-center bg-white border border-zinc-200 rounded-lg pl-3 pr-1 py-1 gap-1">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(field.id, oIdx, e.target.value)}
                                    className="bg-transparent border-none outline-hidden text-xs font-sans text-zinc-950 w-24 p-0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(field.id, oIdx)}
                                    className="p-1 rounded-md text-zinc-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Conditional File Upload Settings */}
                        {field.type === "file" && (
                          <div className="border-t border-zinc-100 pt-3 flex flex-col gap-3">
                            <span className="font-sans font-bold text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5 select-none">File Upload Limits</span>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Max File Size (MB)</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={field.maxSizeMb || 10}
                                  onChange={(e) => handleFieldChange(field.id, { maxSizeMb: Number(e.target.value) })}
                                  className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-lg p-2 text-xs font-sans font-bold text-zinc-950"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Max File Counts</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={field.maxFiles || 5}
                                  onChange={(e) => handleFieldChange(field.id, { maxFiles: Number(e.target.value) })}
                                  className="w-full bg-white border border-zinc-200 focus:border-zinc-500 rounded-lg p-2 text-xs font-sans font-bold text-zinc-950"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 mt-1 select-none">
                              <label className="font-sans text-[9px] text-zinc-400 uppercase tracking-wider pl-0.5">Allowed File Formats</label>
                              <div className="flex flex-wrap gap-3 mt-1 pl-0.5">
                                {[".png", ".jpg", ".svg", ".pdf", ".zip"].map((ext) => {
                                  const checked = field.allowedTypes?.includes(ext) ?? false;
                                  return (
                                    <label key={ext} className="flex items-center gap-1.5 font-sans font-semibold text-xs text-zinc-600 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleToggleAllowedType(field.id, ext)}
                                        className="w-3.5 h-3.5 border-zinc-300 rounded-xs text-zinc-950 focus:ring-0 cursor-pointer"
                                      />
                                      <span>{ext.toUpperCase().replace(".", "")}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
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
            </form>

            <footer className="px-6 py-4 border-t border-zinc-150 flex items-center justify-end select-none gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-full font-sans font-semibold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                disabled={saving}
                className="px-5 py-2 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 disabled:opacity-50 text-white rounded-full font-sans font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                    <span>Saving Form...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Save Form Link</span>
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
