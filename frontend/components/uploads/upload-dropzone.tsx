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
            "flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-center",
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
              : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 dark:bg-indigo-950/50 dark:text-indigo-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Click to upload or drag & drop catalog file
          </p>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            Supports CSV (.csv) and Excel (.xlsx) with columns: sku, name, category, price, inventory
          </p>
          <span className="mt-4 inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Browse files from computer →
          </span>
        </div>
      ) : (
        <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatFileSize(file.size)} • {file.name.split(".").pop()?.toUpperCase()} file
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              disabled={isUploading}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              aria-label="Remove selected file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              isLoading={isUploading}
            >
              <UploadCloud className="w-4 h-4 mr-1.5" />
              Process & Ingest Catalog
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
