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
      <div className="p-8 text-center text-slate-500 text-sm">
        No catalog uploads found. Upload a file above to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
        <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
          <tr>
            <th className="px-6 py-3.5">Filename</th>
            <th className="px-6 py-3.5">File Type</th>
            <th className="px-6 py-3.5">Product Count</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Health Score</th>
            <th className="px-6 py-3.5">Uploaded At</th>
            <th className="px-6 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {catalogs.map((cat) => {
            const score = validationScores[cat.upload_id];
            const isValidating = validatingId === cat.upload_id;
            const isSelected = selectedUploadId === cat.upload_id;

            return (
              <tr
                key={cat.upload_id}
                className={`hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors ${
                  isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {cat.filename}
                      </p>
                      <span className="text-xs text-slate-400 font-mono">
                        Upload #{cat.upload_id}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {cat.file_type}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                  {formatNumber(cat.total_products)}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                    {cat.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {typeof score === "number" ? (
                    <span
                      className={`font-semibold font-mono text-xs px-2 py-0.5 rounded border ${
                        score >= 80
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : score >= 50
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {score}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Not validated
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                  {formatDate(cat.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={isValidating}
                      onClick={() => onValidate(cat.upload_id)}
                      title="Run deterministic validation rules"
                      className="text-xs h-8"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Validate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewResult(cat.upload_id)}
                      className="text-xs h-8"
                      title="View latest validation results"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
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
