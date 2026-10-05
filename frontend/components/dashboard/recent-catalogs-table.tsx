"use client";

import React from "react";
import Link from "next/link";
import { CatalogUpload } from "@/types/catalog";
import { formatDate, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ArrowRight, Play } from "lucide-react";

interface RecentCatalogsTableProps {
  catalogs: CatalogUpload[];
  validationScores?: Record<number, number | null>;
  onValidate?: (uploadId: number) => void;
  validatingId?: number | null;
}

export function RecentCatalogsTable({
  catalogs,
  validationScores = {},
  onValidate,
  validatingId,
}: RecentCatalogsTableProps) {
  if (catalogs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No catalogs uploaded yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50/80 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2.5">Catalog</th>
            <th className="px-4 py-2.5">Format</th>
            <th className="px-4 py-2.5">Products</th>
            <th className="px-4 py-2.5">Health Score</th>
            <th className="px-4 py-2.5">Uploaded</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {catalogs.slice(0, 5).map((cat) => {
            const score = validationScores[cat.upload_id];
            const isValidating = validatingId === cat.upload_id;

            return (
              <tr
                key={cat.upload_id}
                className="hover:bg-slate-50/70 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950 truncate max-w-[220px]">
                        {cat.filename}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{cat.upload_id}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {cat.file_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-medium text-slate-900">
                  {formatNumber(cat.total_products)}
                </td>
                <td className="px-4 py-3">
                  {typeof score === "number" ? (
                    <span
                      className={`font-semibold font-mono text-[11px] px-2 py-0.5 rounded border ${
                        score >= 80
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : score >= 50
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {score}%
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Pending run
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                  {formatDate(cat.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onValidate && (
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={isValidating}
                        onClick={() => onValidate(cat.upload_id)}
                        title="Run validation engine"
                        className="h-7 text-xs px-2"
                      >
                        <Play className="w-3 h-3 mr-1 text-blue-600 fill-blue-600" />
                        Validate
                      </Button>
                    )}
                    <Link href={`/uploads?selected=${cat.upload_id}`}>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-slate-600">
                        Details
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
