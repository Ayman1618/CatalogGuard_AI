"use client";

import React, { useState } from "react";
import { AISuggestion, ValidationIssue } from "@/types/catalog";
import { SeverityBadge, ConfidenceBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAISuggestion } from "@/lib/api";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

interface IssuesListProps {
  issues: ValidationIssue[];
  productId?: number;
}

export function IssuesList({ issues, productId }: IssuesListProps) {
  const [suggestions, setSuggestions] = useState<Record<string, AISuggestion>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>({});

  const handleGetSuggestion = async (issueCode: string) => {
    if (!productId) return;

    setLoadingStates((prev) => ({ ...prev, [issueCode]: true }));
    setErrorStates((prev) => ({ ...prev, [issueCode]: null }));

    try {
      const suggestionData = await getAISuggestion(productId, issueCode);
      setSuggestions((prev) => ({ ...prev, [issueCode]: suggestionData }));
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "AI suggestion service is currently unavailable.";
      setErrorStates((prev) => ({ ...prev, [issueCode]: errorMsg }));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [issueCode]: false }));
    }
  };

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
    <div className="space-y-4">
      {issues.map((issue, idx) => {
        const isError = (issue.severity || "").toLowerCase() === "error";
        const issueCode = issue.code;
        const suggestion = suggestions[issueCode];
        const isLoading = !!loadingStates[issueCode];
        const errorMsg = errorStates[issueCode];

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border space-y-3 transition-colors ${
              isError
                ? "bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900"
                : "bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
            }`}
          >
            {/* Deterministic Issue Header & Message */}
            <div className="flex items-start gap-3">
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

            {/* AI Suggestion Trigger / Card Area */}
            {productId && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                {!suggestion ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetSuggestion(issueCode)}
                      isLoading={isLoading}
                      disabled={isLoading}
                      className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                      {isLoading ? "Generating suggestion..." : "Get AI Suggestion"}
                    </Button>

                    {errorMsg && (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errorMsg}
                      </span>
                    )}
                  </div>
                ) : (
                  /* AI Assistance Section */
                  <div className="mt-2 p-3.5 rounded-lg border border-indigo-200/80 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-indigo-950 dark:text-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        AI Assistance
                      </div>
                      <ConfidenceBadge confidence={suggestion.confidence} />
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-800 dark:text-slate-200">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 text-[11px]">
                          <HelpCircle className="w-3 h-3 text-indigo-500" />
                          Explanation
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {suggestion.explanation}
                        </p>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 text-[11px]">
                          <Lightbulb className="w-3 h-3 text-amber-500" />
                          Suggested action
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {suggestion.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
