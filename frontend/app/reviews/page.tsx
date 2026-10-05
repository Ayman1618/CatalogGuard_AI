"use client";

import React, { useEffect, useState } from "react";
import { getReviewQueue } from "@/lib/api";
import { ReviewItem } from "@/types/catalog";
import { ReviewQueueTable } from "@/components/reviews/review-queue-table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { ListFilter, RefreshCw, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ReviewQueuePage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchReviewQueue = async () => {
    setIsLoading(true);
    try {
      const data = await getReviewQueue();
      setReviews(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load review queue.";
      setToastMessage({
        type: "error",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const invalidCount = reviews.filter(
    (r) => (r.validation_status || "").toLowerCase() === "invalid"
  ).length;

  const warningCount = reviews.filter(
    (r) => (r.validation_status || "").toLowerCase() === "warning"
  ).length;

  const pendingCount = reviews.filter(
    (r) => (r.review_status || "").toLowerCase() === "pending"
  ).length;

  const approvedCount = reviews.filter(
    (r) => (r.review_status || "").toLowerCase() === "approved"
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Operations Review Queue
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              TRIAGE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Human triage and resolution workflow for products flagged by deterministic catalog validation.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchReviewQueue}
          isLoading={isLoading}
          className="h-8 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Refresh Queue
        </Button>
      </div>

      {/* Queue Stat Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Total In Queue
            </span>
            <ListFilter className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-950 mt-1">
            {reviews.length}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            {pendingCount} awaiting decision
          </span>
        </div>

        <div className="p-3 rounded-lg border border-red-200 bg-red-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-red-800 uppercase tracking-wider">
              Blocking Errors (Invalid)
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <p className="text-xl font-bold font-mono text-red-900 mt-1">
            {invalidCount}
          </p>
          <span className="text-[10px] text-red-700 font-mono">
            Prevents catalog sync
          </span>
        </div>

        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
              Quality Warnings
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-900 mt-1">
            {warningCount}
          </p>
          <span className="text-[10px] text-amber-700 font-mono">
            Non-blocking defects
          </span>
        </div>

        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
              Approved Products
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-900 mt-1">
            {approvedCount}
          </p>
          <span className="text-[10px] text-emerald-700 font-mono">
            Human verified
          </span>
        </div>
      </div>

      {/* Main Review Queue Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ListFilter className="w-3.5 h-3.5 text-blue-600" />
              Products Requiring Action
            </CardTitle>
            <CardDescription>
              Select any item to inspect deterministic issues, consult AI suggestions, and record operational decisions.
            </CardDescription>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {reviews.length} total products
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : (
            <ReviewQueueTable items={reviews} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
