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
  Bot,
  ArrowRight,
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
      <div className="flex items-center gap-2.5 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 text-emerald-900 text-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-950">No Validation Issues</p>
          <p className="text-emerald-800 mt-0.5">
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
        const issueCode = issue.code;
        const suggestion = suggestions[issueCode];
        const isLoading = !!loadingStates[issueCode];
        const errorMsg = errorStates[issueCode];

        return (
          <div
            key={idx}
            className={`p-3.5 rounded-lg border transition-colors ${
              isError
                ? "bg-red-50/30 border-red-200/90"
                : "bg-amber-50/30 border-amber-200/90"
            }`}
          >
            {/* Deterministic Issue Header & Message */}
            <div className="flex items-start gap-2.5">
              {isError ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={issue.severity} />
                  <span className="font-mono text-xs font-bold text-slate-950">
                    {issue.field}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                    {issue.code}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {issue.message}
                </p>
              </div>
            </div>

            {/* AI Suggestion Trigger / Contextual Area */}
            {productId && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                {!suggestion ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetSuggestion(issueCode)}
                      isLoading={isLoading}
                      disabled={isLoading}
                      className="h-7 text-xs border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-white"
                    >
                      <Bot className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {isLoading ? "Fetching suggestion..." : "Get AI Suggestion"}
                    </Button>

                    {errorMsg && (
                      <span className="text-[11px] text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errorMsg}
                      </span>
                    )}
                  </div>
                ) : (
                  /* Compact Contextual AI Suggestion */
                  <div className="p-3 rounded border border-slate-200 bg-white text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
                        <Bot className="w-3.5 h-3.5 text-blue-600" />
                        <span>AI Suggestion</span>
                      </div>
                      <ConfidenceBadge confidence={suggestion.confidence} />
                    </div>

                    <div className="space-y-1.5 text-slate-700">
                      {suggestion.explanation && (
                        <div>
                          <span className="font-semibold text-slate-900 text-[11px] block">
                            Context:
                          </span>
                          <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
                            {suggestion.explanation}
                          </p>
                        </div>
                      )}

                      {suggestion.suggestion && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-200">
                          <span className="font-semibold text-slate-900 text-[11px] flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-blue-600" />
                            Suggested Remediation:
                          </span>
                          <p className="text-slate-800 mt-0.5 font-medium text-[11px] leading-relaxed">
                            {suggestion.suggestion}
                          </p>
                        </div>
                      )}
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
