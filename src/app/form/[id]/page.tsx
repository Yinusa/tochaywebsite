"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  File, 
  Loader2,
  FileCheck,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "file";
  placeholder?: string;
  required: boolean;
  options?: string[];
  maxSizeMb?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

interface CustomForm {
  id: string;
  title: string;
  description: string;
  success_message: string;
  slug: string;
  fields: FormField[];
  is_active: boolean;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  publicUrl: string;
  fileObject: File;
}

export default function PublicFormPage() {
  const params = useParams();
  const formParam = params?.id as string;

  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // User input states
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // File upload state per field ID
  const [fieldFiles, setFieldFiles] = useState<Record<string, UploadedFile[]>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Submit flow states
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (formParam) {
      loadForm();
    }
  }, [formParam]);

  const loadForm = async () => {
    try {
      setLoading(true);
      setErrorAlert(null);

      // Check if parameter is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formParam);
      let query = supabase.from("custom_forms").select("*");

      if (isUuid) {
        query = query.or(`id.eq.${formParam},slug.eq.${formParam}`);
      } else {
        query = query.eq("slug", formParam);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        throw new Error("Form not found or has been removed.");
      }

      if (!data.is_active) {
        throw new Error("This form is currently inactive.");
      }

      setForm(data);

      // Initialize answers structure
      const initialAnswers: Record<string, any> = {};
      data.fields.forEach((field: FormField) => {
        if (field.type === "checkbox") {
          initialAnswers[field.id] = [];
        } else {
          initialAnswers[field.id] = "";
        }
      });
      setAnswers(initialAnswers);
    } catch (err: any) {
      console.error(err);
      setErrorAlert(err.message || "Failed to retrieve form details.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, val: any) => {
    setAnswers({
      ...answers,
      [fieldId]: val
    });
    // Clear field specific error
    if (clientErrors[fieldId]) {
      setClientErrors({
        ...clientErrors,
        [fieldId]: ""
      });
    }
  };

  const handleCheckboxToggle = (fieldId: string, optionValue: string) => {
    const current = (answers[fieldId] as string[]) || [];
    const updated = current.includes(optionValue)
      ? current.filter((x) => x !== optionValue)
      : [...current, optionValue];

    handleInputChange(fieldId, updated);
  };

  // Upload attachment file handler
  const handleFileUpload = async (fieldId: string, filesList: FileList | null, fieldConfig: FormField) => {
    if (!filesList || filesList.length === 0) return;

    setErrorAlert(null);
    const existing = fieldFiles[fieldId] || [];
    const maxFiles = fieldConfig.maxFiles || 5;

    if (existing.length + filesList.length > maxFiles) {
      setErrorAlert(`Maximum files upload limit reached. You can upload up to ${maxFiles} files.`);
      return;
    }

    const filesToUpload: File[] = [];
    const allowedExtensions = fieldConfig.allowedTypes || [".png", ".jpg", ".svg", ".pdf", ".zip"];
    const maxBytes = (fieldConfig.maxSizeMb || 10) * 1024 * 1024;

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      // Check extensions (allowing JPG and JPEG interchangeably)
      let isAllowed = allowedExtensions.includes(ext);
      if (!isAllowed) {
        if (ext === ".jpeg" && allowedExtensions.includes(".jpg")) {
          isAllowed = true;
        } else if (ext === ".jpg" && allowedExtensions.includes(".jpeg")) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        setErrorAlert(`Invalid file format "${file.name}". Allowed types: ${allowedExtensions.join(", ")}`);
        return;
      }

      // Check file size
      if (file.size > maxBytes) {
        setErrorAlert(`File "${file.name}" exceeds the maximum size limit of ${fieldConfig.maxSizeMb}MB.`);
        return;
      }

      filesToUpload.push(file);
    }

    // Process files and upload to Supabase Storage
    try {
      setUploadingField(fieldId);
      setUploadProgress(10);

      const uploadedResults: UploadedFile[] = [...existing];
      const totalSteps = filesToUpload.length;

      for (let index = 0; index < filesToUpload.length; index++) {
        const file = filesToUpload[index];
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const filePath = `form-uploads/${form?.slug || "general"}/${uniqueName}`;

        setUploadProgress(Math.round(((index + 0.3) / totalSteps) * 90));

        const { data, error } = await supabase.storage
          .from("showcase")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("showcase")
          .getPublicUrl(filePath);

        setUploadProgress(Math.round(((index + 1) / totalSteps) * 100));

        uploadedResults.push({
          name: file.name,
          size: file.size,
          type: file.type,
          publicUrl: publicUrlData.publicUrl,
          fileObject: file
        });
      }

      setFieldFiles({
        ...fieldFiles,
        [fieldId]: uploadedResults
      });
    } catch (err: any) {
      console.error("Storage upload error:", err);
      setErrorAlert(err.message || "Failed to upload attachments to storage.");
    } finally {
      setUploadingField(null);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = (fieldId: string, index: number) => {
    const current = fieldFiles[fieldId] || [];
    const updated = current.filter((_, idx) => idx !== index);
    setFieldFiles({
      ...fieldFiles,
      [fieldId]: updated
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, fieldId: string, fieldConfig: FormField) => {
    e.preventDefault();
    handleFileUpload(fieldId, e.dataTransfer.files, fieldConfig);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || submitting) return;

    setErrorAlert(null);
    setClientErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    form.fields.forEach((field) => {
      if (field.required) {
        if (field.type === "file") {
          const files = fieldFiles[field.id] || [];
          if (files.length === 0) {
            errors[field.id] = `${field.label} is required. Please upload at least one asset.`;
          }
        } else if (field.type === "checkbox") {
          const vals = answers[field.id] || [];
          if (vals.length === 0) {
            errors[field.id] = `Please select at least one option.`;
          }
        } else {
          if (!answers[field.id] || !answers[field.id].toString().trim()) {
            errors[field.id] = `${field.label} is required.`;
          }
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      setErrorAlert("Please complete all required fields before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      // Package assets paths mapping
      const submissionAssets = Object.entries(fieldFiles).flatMap(([fieldId, files]) => {
        return files.map((file) => ({
          field_id: fieldId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.publicUrl
        }));
      });

      const { error: submitError } = await supabase
        .from("form_submissions")
        .insert([
          {
            form_id: form.id,
            answers: answers,
            assets: submissionAssets
          }
        ]);

      if (submitError) throw submitError;

      setSubmitted(true);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setErrorAlert(err.message || "Failed to submit answers. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f7] flex items-center justify-center py-20 px-6 font-sans">
        <div className="flex flex-col items-center select-none text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mb-3" />
          <span className="text-xs font-semibold">Loading portal form...</span>
        </div>
      </main>
    );
  }

  if (errorAlert && !form) {
    return (
      <main className="w-full min-h-screen bg-[#f8f8f7] flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center py-32 px-6">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="font-sans font-bold text-lg text-zinc-950">Portal Connection Alert</h2>
            <p className="font-sans font-normal text-zinc-500 text-xs mt-2 leading-relaxed">
              {errorAlert}
            </p>
            <a
              href="/"
              className="mt-6 px-6 py-2.5 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs transition-colors cursor-pointer"
            >
              Return to Studio
            </a>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!form) return null;

  return (
    <main className="w-full min-h-screen bg-[#f8f8f7] flex flex-col justify-between font-sans relative overflow-x-hidden">
      {/* Dynamic Navigation Header */}
      <Navbar />

      {/* Main Core View Area */}
      <div className="w-full max-w-3xl mx-auto px-6 sm:px-8 md:px-12 pt-36 pb-20 flex-grow flex flex-col justify-center">
        {submitted ? (
          /* SUCCESS SUBMISSION PANEL */
          <div className="w-full bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 shadow-2xl text-center flex flex-col items-center justify-center animate-fade-in select-none">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            
            <h2 className="font-sans font-bold text-2xl sm:text-3xl text-zinc-950 tracking-tight leading-none">
              Submission Received
            </h2>
            
            <p className="font-sans font-normal text-zinc-500 text-sm mt-4 max-w-md leading-relaxed">
              {form.success_message || "Your workspace assets have been compiled and sent to our design studio successfully."}
            </p>

            <div className="mt-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-2 max-w-sm">
              <ShieldCheck className="w-4.5 h-4.5 text-zinc-400" />
              <span className="font-sans text-[10px] text-zinc-500 font-semibold text-left">
                Security encryption enabled.
              </span>
            </div>

            <a
              href="/"
              className="mt-10 px-8 py-3 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 text-white rounded-full font-sans font-semibold text-xs tracking-wide transition-colors duration-300 cursor-pointer shadow-xs flex items-center gap-2"
            >
              <span>Back to Home</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          /* PUBLIC SUBMISSION FORM */
          <div className="w-full flex flex-col gap-10">

            {/* Header Metadata */}
            <div className="flex flex-col gap-3 select-none">
              <h1 className="font-sans font-bold text-4xl sm:text-5xl text-zinc-950 tracking-tight leading-none">
                {form.title}
              </h1>
              {form.description && (
                <p className="font-sans font-normal text-zinc-400 text-sm sm:text-base mt-2 leading-relaxed whitespace-pre-line max-w-2xl">
                  {form.description}
                </p>
              )}
            </div>

            {/* Error Notification Alert */}
            {errorAlert && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans font-bold text-xs text-red-950 select-none">Submission Warning</span>
                  <p className="font-sans font-normal text-red-800 text-[11px] leading-relaxed">{errorAlert}</p>
                </div>
              </div>
            )}

            {/* Form Fields Body */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-8">
              {form.fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-2.5">

                  {/* Label title */}
                  <label className="font-sans font-semibold text-[10px] sm:text-xs text-zinc-950 uppercase tracking-wider pl-0.5 flex items-center select-none">
                    <span>{field.label}</span>
                    {field.required && <span className="text-[#ffd230] ml-1 font-bold">*</span>}
                  </label>

                  {/* RENDER FIELD CONDITIONALS */}
                  {field.type === "text" && (
                    <input
                      type="text"
                      placeholder={field.placeholder || "Your reply..."}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="bg-transparent border-b border-zinc-200 focus:border-zinc-950 focus:outline-hidden py-3.5 text-zinc-950 text-base sm:text-lg transition-colors duration-300 w-full font-sans placeholder:text-zinc-300 font-semibold"
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder || "Type your detailed answer here..."}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="bg-transparent border-b border-zinc-200 focus:border-zinc-950 focus:outline-hidden py-3.5 text-zinc-950 text-base sm:text-lg transition-colors duration-300 w-full font-sans placeholder:text-zinc-300 font-normal resize-none"
                    />
                  )}

                  {field.type === "radio" && (
                    <div className="flex flex-col gap-2.5 pl-0.5 mt-1 select-none">
                      {field.options?.map((opt, oIdx) => {
                        const checked = answers[field.id] === opt;
                        return (
                          <label key={oIdx} className="flex items-center gap-3 font-sans font-semibold text-sm sm:text-base text-zinc-700 cursor-pointer">
                            <input
                              type="radio"
                              name={field.id}
                              checked={checked}
                              onChange={() => handleInputChange(field.id, opt)}
                              className="w-5 h-5 border-zinc-300 text-zinc-950 focus:ring-0 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === "checkbox" && (
                    <div className="flex flex-col gap-2.5 pl-0.5 mt-1 select-none">
                      {field.options?.map((opt, oIdx) => {
                        const checked = (answers[field.id] as string[])?.includes(opt) || false;
                        return (
                          <label key={oIdx} className="flex items-center gap-3 font-sans font-semibold text-sm sm:text-base text-zinc-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleCheckboxToggle(field.id, opt)}
                              className="w-5 h-5 border-zinc-300 rounded-sm text-zinc-950 focus:ring-0 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === "file" && (
                    <div className="flex flex-col gap-3 mt-1">
                      {/* Drag & Drop File Container */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, field.id, field)}
                        onClick={() => fileInputRefs.current[field.id]?.click()}
                        className={`w-full border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${uploadingField === field.id
                            ? "bg-zinc-100/50 border-zinc-400"
                            : "bg-white/40 border-zinc-200 hover:border-zinc-500 hover:bg-white/80"
                          }`}
                      >
                        <input
                          type="file"
                          multiple
                          ref={(el) => { fileInputRefs.current[field.id] = el; }}
                          onChange={(e) => handleFileUpload(field.id, e.target.files, field)}
                          className="hidden"
                          accept={field.allowedTypes?.join(",")}
                        />
                        
                        {uploadingField === field.id ? (
                          /* UPLOADER PROCESS MODE */
                          <div className="flex flex-col items-center gap-3 w-full max-w-xs select-none">
                            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                            <span className="font-sans font-bold text-xs text-zinc-950">Uploading deliverables...</span>
                            
                            {/* Progressive progress bar indicator */}
                            <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#ffd230] h-full transition-all duration-300 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <span className="font-mono text-[9px] text-zinc-400">{uploadProgress}% complete</span>
                          </div>
                        ) : (
                          /* UPLOAD IDLE DROP ZONE */
                          <div className="flex flex-col items-center select-none">
                            <Upload className="w-8 h-8 text-zinc-300 mb-3" />
                            <span className="font-sans font-bold text-xs text-zinc-950">
                              Drag and drop or browse files
                            </span>
                            <span className="font-sans font-normal text-[10px] text-zinc-400 mt-1 leading-normal max-w-xs">
                              Max {field.maxFiles || 5} files. Allowed formats: {field.allowedTypes?.join(", ") || "PNG, JPG, PDF, ZIP"}. Max size {field.maxSizeMb || 10}MB.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Display Selected/Uploaded Previews */}
                      {(fieldFiles[field.id] || []).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 select-none">
                          {(fieldFiles[field.id] || []).map((file, fIdx) => {
                            const isImg = file.type.startsWith("image/");
                            return (
                              <div
                                key={fIdx}
                                className="border border-zinc-200 bg-white rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs animate-fade-in group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {isImg ? (
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-50 shrink-0 border border-zinc-100">
                                      <img src={file.publicUrl} alt={file.name} className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-100 select-none">
                                      <File className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-sans font-semibold text-xs text-zinc-950 truncate leading-snug max-w-[130px] sm:max-w-[180px]" title={file.name}>
                                      {file.name}
                                    </span>
                                    <span className="font-mono text-[9px] text-zinc-400 mt-0.5">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(field.id, fIdx)}
                                  className="text-zinc-350 hover:text-red-600 transition-colors shrink-0 p-1 rounded-md cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render Field Errors */}
                  {clientErrors[field.id] && (
                    <span className="font-sans text-[10px] text-red-500 font-bold pl-0.5 mt-0.5 flex items-center gap-1 select-none">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{clientErrors[field.id]}</span>
                    </span>
                  )}

                </div>
              ))}

              {/* Submit Trigger Action */}
              <div className="mt-8 pt-6 border-t border-zinc-200 select-none">
                <button
                  type="submit"
                  disabled={submitting || !!uploadingField}
                  className="w-full py-4 bg-zinc-950 hover:bg-[#ffd230] hover:text-zinc-950 disabled:opacity-50 text-white rounded-xl font-sans font-bold text-sm tracking-wide transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                      <span>Transmitting responses...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Submit Form Details</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>

      {/* Footer Branding Header */}
      <Footer />
    </main>
  );
}
