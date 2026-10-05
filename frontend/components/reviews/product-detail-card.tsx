"use client";

import React from "react";
import { ReviewDetails } from "@/types/catalog";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { ValidationBadge, ReviewBadge } from "@/components/ui/badge";
import {
  ImageIcon,
  Activity,
} from "lucide-react";

interface ProductDetailCardProps {
  details: ReviewDetails;
}

export function ProductDetailCard({ details }: ProductDetailCardProps) {
  return (
    <div className="space-y-4">
      {/* Top Status & Audit Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Validation Outcome
          </span>
          <div className="pt-0.5">
            <ValidationBadge status={details.validation_status} />
          </div>
          <p className="text-[10px] text-slate-400">
            Deterministic rule check results
          </p>
        </div>

        <div className="space-y-1 sm:border-l sm:border-r border-slate-100 sm:px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Review Status
          </span>
          <div className="pt-0.5">
            <ReviewBadge status={details.review_status} />
          </div>
          <p className="text-[10px] text-slate-400">
            Operational human decision
          </p>
        </div>

        <div className="space-y-1 sm:pl-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Catalog Health Snapshot
          </span>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono font-bold text-xs text-slate-900">
              {details.latest_validation_run?.health_score !== undefined
                ? `${details.latest_validation_run.health_score}% Score`
                : "Run Attached"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {details.latest_validation_run?.created_at
              ? formatDate(details.latest_validation_run.created_at)
              : "Ingestion record"}
          </p>
        </div>
      </div>

      {/* Main Product Attributes Card */}
      <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-4">
        {/* Header with Name, SKU, and Thumbnail */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                SKU: {details.sku}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                DB ID #{details.product_id}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight">
              {details.name || "Untitled Product"}
            </h3>
            {details.description && (
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {details.description}
              </p>
            )}
          </div>

          {/* Image Thumbnail */}
          {details.image_url ? (
            <div className="shrink-0 w-20 h-20 rounded-md border border-slate-200 overflow-hidden bg-white p-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={details.image_url}
                alt={details.name || "Product Image"}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="shrink-0 w-20 h-20 rounded-md border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <ImageIcon className="w-5 h-5 mb-0.5 text-slate-400" />
              <span className="text-[9px]">No image URL</span>
            </div>
          )}
        </div>

        {/* Specifications Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Category
            </span>
            <span className="font-semibold text-slate-900 mt-1 block truncate">
              {details.category || "—"}
            </span>
          </div>

          <div className="p-2.5 rounded border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Brand
            </span>
            <span className="font-semibold text-slate-900 mt-1 block truncate">
              {details.brand || "—"}
            </span>
          </div>

          <div className="p-2.5 rounded border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Price
            </span>
            <span className="font-bold font-mono text-slate-950 mt-1 block text-sm">
              {formatCurrency(details.price, details.currency)}
            </span>
          </div>

          <div className="p-2.5 rounded border border-slate-200 bg-slate-50/40">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Inventory Stock
            </span>
            <span className="font-bold font-mono text-slate-950 mt-1 block text-sm">
              {formatNumber(details.inventory)} units
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
