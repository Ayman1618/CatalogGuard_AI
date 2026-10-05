"use client";

import React from "react";
import { CatalogUpload } from "@/types/catalog";
import { formatDate, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Play, Eye } from "lucide-react";

interface CatalogHistoryTableProps {
  catalogs: CatalogUpload[];
  validationScores: Record<number, number | null>;
  onValidate: (uploadId: number) => void;
  onViewResult: (uploadId: number) => void;
  validatingId: number | null;
  selectedUploadId: number | null;
}

export function CatalogHistoryTable({
  catalogs,
  validationScores,
  onValidate,
  onViewResult,
  validatingId,
  selectedUploadId,
}: CatalogHistoryTableProps) {
  if (catalogs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No catalog uploads found. Ingest a file above to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50/80 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-4 py-2.5">Filename</th>
            <th className="px-4 py-2.5">Format</th>
            <th className="px-4 py-2.5">Product Count</th>
            <th className="px-4 py-2.5">Ingestion Status</th>
            <th className="px-4 py-2.5">Health Score</th>
            <th className="px-4 py-2.5">Uploaded</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {catalogs.map((cat) => {
            const score = validationScores[cat.upload_id];
            const isValidating = validatingId === cat.upload_id;
            const isSelected = selectedUploadId === cat.upload_id;

            return (
              <tr
                key={cat.upload_id}
                className={`hover:bg-slate-50/70 transition-colors ${
                  isSelected ? "bg-blue-50/40" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950 truncate max-w-[200px] sm:max-w-none">
                        {cat.filename}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Upload ID #{cat.upload_id}
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                    {cat.status}
                  </span>
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
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={isValidating}
                      onClick={() => onValidate(cat.upload_id)}
                      title="Run deterministic validation rules"
                      className="h-7 text-xs px-2.5"
                    >
                      <Play className="w-3 h-3 mr-1 fill-white" />
                      Validate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewResult(cat.upload_id)}
                      className="h-7 text-xs px-2.5 text-slate-700"
                      title="View latest validation results"
                    >
                      <Eye className="w-3 h-3 mr-1 text-slate-500" />
                      Results
                    </Button>
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
