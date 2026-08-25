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
    <div className="space-y-6">
      {/* Status Highlights Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Automated Validation Status
          </span>
          <div className="flex items-center gap-2 pt-1">
            <ValidationBadge status={details.validation_status} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Rule-based engine assessment from catalog ingestion.
          </p>
        </div>

        <div className="space-y-1.5 sm:pl-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Human Review Decision
          </span>
          <div className="flex items-center gap-2 pt-1">
            <ReviewBadge status={details.review_status} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Manual operational decision; independent of validation outcome.
          </p>
        </div>
      </div>

      {/* Main Attribute Grid */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              {details.sku}
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {details.name || "Untitled Product"}
            </h3>
            {details.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
                {details.description}
              </p>
            )}
          </div>

          {/* Image Thumbnail if available */}
          {details.image_url ? (
            <div className="shrink-0 w-24 h-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center dark:border-slate-800 dark:bg-slate-950">
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
            <div className="shrink-0 w-24 h-24 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 dark:border-slate-800">
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-[10px]">No image</span>
            </div>
          )}
        </div>

        {/* Product Properties */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Category</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {details.category || "N/A"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Brand</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {details.brand || "N/A"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Price</span>
            <span className="font-semibold font-mono text-slate-900 text-sm dark:text-white">
              {formatCurrency(details.price, details.currency)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
            <span className="text-slate-400 block mb-1">Inventory</span>
            <span className="font-semibold font-mono text-slate-900 text-sm dark:text-white">
              {formatNumber(details.inventory)} units
            </span>
          </div>
        </div>

        {/* Latest Validation Run Meta */}
        {details.latest_validation_run && (
          <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>
                Validation Run #{details.latest_validation_run.id} • Score:{" "}
                <strong className="text-slate-900 dark:text-white">
                  {details.latest_validation_run.health_score}%
                </strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {formatDate(details.latest_validation_run.created_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
