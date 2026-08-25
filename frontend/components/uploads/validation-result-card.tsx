"use client";

import React from "react";
import Link from "next/link";
import { CatalogValidationResponse } from "@/types/catalog";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ValidationBadge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ListFilter,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface ValidationResultCardProps {
  result: CatalogValidationResponse;
  onClose?: () => void;
}

export function ValidationResultCard({
  result,
  onClose,
}: ValidationResultCardProps) {
  const getHealthBadgeClass = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  return (
    <div className="p-6 rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs space-y-6 dark:border-indigo-950 dark:from-indigo-950/20 dark:to-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Validation Summary for Catalog #{result.upload_id}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic rule engine execution finished for {formatNumber(result.total_products)} products.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/reviews">
            <Button size="sm">
              <ListFilter className="w-4 h-4 mr-1.5" />
              View Review Queue
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Dismiss
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Health Score */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3.5 rounded-lg border bg-white flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Health Score</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-2xl font-extrabold font-mono px-2 py-0.5 rounded border ${getHealthBadgeClass(result.health_score)}`}>
              {result.health_score}%
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Products</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-2 dark:text-slate-100">
            {formatNumber(result.total_products)}
          </p>
        </div>

        {/* Valid Products */}
        <div className="p-3.5 rounded-lg border border-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 uppercase">
            <span>Valid</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-800 mt-2 dark:text-emerald-300">
            {formatNumber(result.valid_products)}
          </p>
        </div>

        {/* Warning Products */}
        <div className="p-3.5 rounded-lg border border-amber-100 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900">
          <div className="flex items-center justify-between text-[11px] font-semibold text-amber-700 uppercase">
            <span>Warnings</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-800 mt-2 dark:text-amber-300">
            {formatNumber(result.warning_products)}
          </p>
        </div>

        {/* Invalid Products */}
        <div className="p-3.5 rounded-lg border border-rose-100 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900">
          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-700 uppercase">
            <span>Invalid</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-800 mt-2 dark:text-rose-300">
            {formatNumber(result.invalid_products)}
          </p>
        </div>

        {/* Total Errors */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Errors</span>
          <p className="text-xl font-bold font-mono text-rose-600 mt-2">
            {formatNumber(result.total_errors)}
          </p>
        </div>

        {/* Total Warnings */}
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Warnings</span>
          <p className="text-xl font-bold font-mono text-amber-600 mt-2">
            {formatNumber(result.total_warnings)}
          </p>
        </div>
      </div>

      {/* Product Results Sample Preview if available */}
      {result.results && result.results.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sample Product Validation Highlights
          </h4>
          <div className="border border-slate-200 rounded-lg overflow-hidden dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5">Validation Status</th>
                  <th className="px-4 py-2.5">Issues Found</th>
                  <th className="px-4 py-2.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.results.slice(0, 5).map((prod, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {prod.sku || "N/A"}
                    </td>
                    <td className="px-4 py-2.5">
                      <ValidationBadge status={prod.status} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {prod.issues && prod.issues.length > 0 ? (
                        <div className="space-y-1">
                          {prod.issues.slice(0, 2).map((iss, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                {iss.field}:
                              </span>
                              <span>{iss.message}</span>
                            </div>
                          ))}
                          {prod.issues.length > 2 && (
                            <span className="text-[10px] text-slate-400">
                              +{prod.issues.length - 2} more issues
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No issues</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {prod.product_id ? (
                        <Link href={`/reviews/${prod.product_id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            Inspect
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/reviews">
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            Queue
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
