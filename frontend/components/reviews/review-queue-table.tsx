"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ReviewItem } from "@/types/catalog";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ValidationBadge, ReviewBadge, SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Search, Filter } from "lucide-react";

interface ReviewQueueTableProps {
  items: ReviewItem[];
}

export function ReviewQueueTable({ items }: ReviewQueueTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [valFilter, setValFilter] = useState<string>("ALL");
  const [revFilter, setRevFilter] = useState<string>("ALL");

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVal =
      valFilter === "ALL" ||
      (item.validation_status || "").toLowerCase() === valFilter.toLowerCase();

    const matchesRev =
      revFilter === "ALL" ||
      (item.review_status || "").toLowerCase() === revFilter.toLowerCase();

    return matchesSearch && matchesVal && matchesRev;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU, product, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Validation:</span>
            <select
              value={valFilter}
              onChange={(e) => setValFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none dark:bg-slate-900 dark:border-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="invalid">Invalid</option>
              <option value="warning">Warning</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Review:</span>
            <select
              value={revFilter}
              onChange={(e) => setRevFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none dark:bg-slate-900 dark:border-slate-800"
            >
              <option value="ALL">All Decisions</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm">
          {items.length === 0 ? (
            <div className="max-w-sm mx-auto space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-semibold text-slate-900 dark:text-white">
                All clear
              </h4>
              <p className="text-xs text-slate-500">
                No products currently require review. All products in the catalog are valid.
              </p>
            </div>
          ) : (
            <p>No products match the selected search or filter criteria.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">SKU / Product</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Price & Stock</th>
                <th className="px-6 py-3.5">Validation</th>
                <th className="px-6 py-3.5">Review Decision</th>
                <th className="px-6 py-3.5">Issues</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => (
                <tr
                  key={item.product_id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {item.name || "Untitled Product"}
                      </p>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {item.sku}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">
                    <div className="text-slate-900 font-semibold dark:text-white">
                      {formatCurrency(item.price)}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Stock: {formatNumber(item.inventory)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ValidationBadge status={item.validation_status} />
                  </td>
                  <td className="px-6 py-4">
                    <ReviewBadge status={item.review_status} />
                  </td>
                  <td className="px-6 py-4">
                    {item.issues && item.issues.length > 0 ? (
                      <div className="flex flex-col gap-1 max-w-xs">
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {item.issues.length} issue{item.issues.length > 1 ? "s" : ""}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {item.issues.slice(0, 2).map((iss, idx) => (
                            <SeverityBadge
                              key={idx}
                              severity={iss.severity}
                              className="text-[9px] py-0 px-1.5"
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link href={`/reviews/${item.product_id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Inspect
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
