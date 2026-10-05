"use client";

import React, { useState, useRef } from "react";
import { uploadCatalog } from "@/lib/api";
import { UploadCatalogResponse } from "@/types/catalog";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  UploadCloud,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onUploadSuccess: (res: UploadCatalogResponse) => void;
}

export function UploadDropzone({ onUploadSuccess }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      setError("Invalid file format. Please upload a .csv or .xlsx file.");
      return;
    }
    setFile(selectedFile);
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadCatalog(file);
      onUploadSuccess(response);
      handleClear();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to upload catalog file. Please check file format.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <Toast
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center",
            isDragging
              ? "border-blue-500 bg-blue-50/40"
              : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
          )}
        >
          <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 mb-2.5 shadow-xs">
            <UploadCloud className="w-5 h-5 stroke-[2.2]" />
          </div>
          <p className="text-xs font-semibold text-slate-900">
            Click to select or drag catalog file here
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            Accepts CSV (.csv) or Excel (.xlsx) containing seller product rows
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 uppercase font-semibold">.CSV</span>
            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 uppercase font-semibold">.XLSX</span>
            <span className="text-slate-400">· Max 20MB</span>
          </div>
        </div>
      ) : (
        <div className="p-4 border border-slate-200 rounded-lg bg-white space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-slate-950">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {formatFileSize(file.size)} · {file.name.split(".").pop()?.toUpperCase()} format
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              disabled={isUploading}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isUploading}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              isLoading={isUploading}
              className="h-8 text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              Ingest & Process Catalog
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
