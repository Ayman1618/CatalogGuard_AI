"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ReviewItem } from "@/types/catalog";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ValidationBadge, ReviewBadge, SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewQueueTableProps {
  items: ReviewItem[];
}

type QuickFilterType = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "INVALID" | "WARNING";

export function ReviewQueueTable({ items }: ReviewQueueTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<QuickFilterType>("ALL");

  const counts = {
    all: items.length,
    pending: items.filter((i) => (i.review_status || "").toLowerCase() === "pending").length,
    approved: items.filter((i) => (i.review_status || "").toLowerCase() === "approved").length,
    rejected: items.filter((i) => (i.review_status || "").toLowerCase() === "rejected").length,
    invalid: items.filter((i) => (i.validation_status || "").toLowerCase() === "invalid").length,
    warning: items.filter((i) => (i.validation_status || "").toLowerCase() === "warning").length,
  };

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.sku || "").toLowerCase().includes(q) ||
      (item.name || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const valStatus = (item.validation_status || "").toLowerCase();
    const revStatus = (item.review_status || "").toLowerCase();

    switch (activeFilter) {
      case "PENDING":
        return revStatus === "pending";
      case "APPROVED":
        return revStatus === "approved";
      case "REJECTED":
        return revStatus === "rejected";
      case "INVALID":
        return valStatus === "invalid";
      case "WARNING":
        return valStatus === "warning";
      case "ALL":
      default:
        return true;
    }
  });

  const filterTabs: Array<{ id: QuickFilterType; label: string; count: number }> = [
    { id: "ALL", label: "All Items", count: counts.all },
    { id: "PENDING", label: "Pending", count: counts.pending },
    { id: "APPROVED", label: "Approved", count: counts.approved },
    { id: "REJECTED", label: "Rejected", count: counts.rejected },
    { id: "INVALID", label: "Invalid (Errors)", count: counts.invalid },
    { id: "WARNING", label: "Warnings", count: counts.warning },
  ];

  return (
    <div className="space-y-0">
      {/* Filter Tabs & Search Controls Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Quick Filter Segmented Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer",
                  isActive
                    ? "bg-white text-blue-700 border-slate-300 shadow-xs font-semibold"
                    : "bg-transparent text-slate-600 border-transparent hover:bg-slate-200/60 hover:text-slate-900"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU, name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table Results */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          {items.length === 0 ? (
            <div className="max-w-sm mx-auto space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-semibold text-slate-900 text-sm">
                Queue Clear
              </h4>
              <p className="text-slate-500 text-xs">
                No products currently require review. All products in the catalog are valid.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p>No products match the selected criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("ALL");
                }}
                className="h-7 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Product & SKU</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Price & Stock</th>
                <th className="px-4 py-2.5">Validation</th>
                <th className="px-4 py-2.5">Review Status</th>
                <th className="px-4 py-2.5">Issues</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr
                  key={item.product_id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="px-4 py-2.5 max-w-[260px]">
                    <div>
                      <p className="font-semibold text-slate-950 truncate">
                        {item.name || "Untitled Product"}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.sku}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200">
                      {item.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    <div className="font-semibold text-slate-950">
                      {formatCurrency(item.price)}
                    </div>
                    <span className="text-slate-400 text-[10px]">
                      Qty: {formatNumber(item.inventory)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <ValidationBadge status={item.validation_status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ReviewBadge status={item.review_status} />
                  </td>
                  <td className="px-4 py-2.5">
                    {item.issues && item.issues.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {item.issues.length}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.issues.slice(0, 2).map((iss, idx) => (
                            <SeverityBadge
                              key={idx}
                              severity={iss.severity}
                              className="text-[9px] py-0 px-1"
                            />
                          ))}
                          {item.issues.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              +{item.issues.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Clean</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Link href={`/reviews/${item.product_id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 text-slate-700 hover:text-blue-700 hover:border-blue-300">
                        Inspect
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
