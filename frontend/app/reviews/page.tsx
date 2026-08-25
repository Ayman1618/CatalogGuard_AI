"use client";

import React, { useEffect, useState } from "react";
import { getReviewQueue } from "@/lib/api";
import { ReviewItem } from "@/types/catalog";
import { ReviewQueueTable } from "@/components/reviews/review-queue-table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { ListFilter, RefreshCw, AlertCircle, AlertTriangle } from "lucide-react";

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

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operations Review Queue
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Human-in-the-loop triage for products flagged with automated validation errors or warnings.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviewQueue}
          isLoading={isLoading}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Queue
        </Button>
      </div>

      {/* Queue Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Total in Queue
            </span>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1 dark:text-white">
              {reviews.length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <ListFilter className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between dark:border-rose-950 dark:bg-rose-950/20">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase">
              Blocking Errors (Invalid)
            </span>
            <p className="text-2xl font-bold font-mono text-rose-800 mt-1 dark:text-rose-300">
              {invalidCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center justify-between dark:border-amber-950 dark:bg-amber-950/20">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase">
              Quality Warnings
            </span>
            <p className="text-2xl font-bold font-mono text-amber-800 mt-1 dark:text-amber-300">
              {warningCount}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Review Queue Card */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-indigo-600" />
            Products Requiring Action
          </CardTitle>
          <CardDescription>
            Select any item to inspect attributes, review deterministic issues, and approve or reject.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {isLoading ? (
            <div className="p-6">
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
