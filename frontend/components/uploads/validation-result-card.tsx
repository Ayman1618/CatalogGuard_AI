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
  AlertCircle,
  ListFilter,
  ShieldCheck,
  ArrowRight,
  X,
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
    if (score >= 80) return "text-emerald-800 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-800 bg-amber-50 border-amber-200";
    return "text-red-800 bg-red-50 border-red-200";
  };

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 stroke-[2.2]" />
            <h3 className="text-sm font-bold text-slate-950">
              Validation Report · Catalog #{result.upload_id}
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase font-semibold">
              COMPLETED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic rule engine evaluated {formatNumber(result.total_products)} products.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/reviews">
            <Button size="sm" className="h-8 text-xs">
              <ListFilter className="w-3.5 h-3.5 mr-1" />
              Triage Review Queue
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Health Score */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-2.5 rounded border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Health Score</span>
          <div className="mt-1">
            <span className={`text-xl font-bold font-mono px-2 py-0.5 rounded border ${getHealthBadgeClass(result.health_score)}`}>
              {result.health_score}%
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="p-2.5 rounded border border-slate-200 bg-white">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Products</span>
          <p className="text-lg font-bold font-mono text-slate-950 mt-1">
            {formatNumber(result.total_products)}
          </p>
        </div>

        {/* Valid Products */}
        <div className="p-2.5 rounded border border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
            <span>Valid</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          </div>
          <p className="text-lg font-bold font-mono text-emerald-900 mt-1">
            {formatNumber(result.valid_products)}
          </p>
        </div>

        {/* Warning Products */}
        <div className="p-2.5 rounded border border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
            <span>Warnings</span>
            <AlertTriangle className="w-3 h-3 text-amber-600" />
          </div>
          <p className="text-lg font-bold font-mono text-amber-900 mt-1">
            {formatNumber(result.warning_products)}
          </p>
        </div>

        {/* Invalid Products */}
        <div className="p-2.5 rounded border border-red-200 bg-red-50/30">
          <div className="flex items-center justify-between text-[10px] font-semibold text-red-800 uppercase tracking-wider">
            <span>Invalid</span>
            <AlertCircle className="w-3 h-3 text-red-600" />
          </div>
          <p className="text-lg font-bold font-mono text-red-900 mt-1">
            {formatNumber(result.invalid_products)}
          </p>
        </div>

        {/* Total Errors */}
        <div className="p-2.5 rounded border border-slate-200 bg-white">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Errors Found</span>
          <p className="text-lg font-bold font-mono text-red-700 mt-1">
            {formatNumber(result.total_errors)}
          </p>
        </div>

        {/* Total Warnings */}
        <div className="p-2.5 rounded border border-slate-200 bg-white">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Warnings Found</span>
          <p className="text-lg font-bold font-mono text-amber-700 mt-1">
            {formatNumber(result.total_warnings)}
          </p>
        </div>
      </div>

      {/* Product Results Sample Preview */}
      {result.results && result.results.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Product Validation Highlights (Sample)
          </h4>
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2">SKU</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2">Rule Violations</th>
                  <th className="px-3.5 py-2 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.results.slice(0, 5).map((prod, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-3.5 py-2 font-mono font-medium text-slate-900">
                      {prod.sku || "N/A"}
                    </td>
                    <td className="px-3.5 py-2">
                      <ValidationBadge status={prod.status} />
                    </td>
                    <td className="px-3.5 py-2 text-slate-600">
                      {prod.issues && prod.issues.length > 0 ? (
                        <div className="space-y-0.5">
                          {prod.issues.slice(0, 2).map((iss, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-mono font-semibold text-slate-700">
                                {iss.field}:
                              </span>
                              <span className="text-slate-600">{iss.message}</span>
                            </div>
                          ))}
                          {prod.issues.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              +{prod.issues.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No defects</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      {prod.product_id ? (
                        <Link href={`/reviews/${prod.product_id}`}>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            Inspect →
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/reviews">
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            Queue →
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
