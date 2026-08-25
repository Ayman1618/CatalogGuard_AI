import React from "react";
import { ValidationIssue } from "@/types/catalog";
import { SeverityBadge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface IssuesListProps {
  issues: ValidationIssue[];
}

export function IssuesList({ issues }: IssuesListProps) {
  if (!issues || issues.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-xs">
          <p className="font-semibold">No Validation Issues</p>
          <p className="text-emerald-700 mt-0.5 dark:text-emerald-400">
            This product satisfies all deterministic catalog validation rules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map((issue, idx) => {
        const isError = (issue.severity || "").toLowerCase() === "error";
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              isError
                ? "bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900"
                : "bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
            }`}
          >
            {isError ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={issue.severity} />
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {issue.field}
                </span>
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded dark:bg-slate-800 dark:text-slate-400">
                  {issue.code}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {issue.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
