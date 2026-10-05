"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAnalyticsSummary,
  getCatalogs,
  getHealthHistory,
  getReviewQueue,
  getValidationResult,
  validateCatalog,
} from "@/lib/api";
import {
  AnalyticsSummary,
  CatalogUpload,
  HealthHistoryItem,
  ReviewItem,
} from "@/types/catalog";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentCatalogsTable } from "@/components/dashboard/recent-catalogs-table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState, Toast } from "@/components/ui/toast";
import {
  UploadCloud,
  ListFilter,
  ShieldCheck,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  RefreshCw,
  ArrowRight,
  BarChart2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const ISSUE_CODE_LABELS: Record<string, string> = {
  MISSING_IMAGE_URL: "Missing Image URL",
  MISSING_BRAND: "Missing Brand",
  INVALID_PRICE: "Invalid Price",
  DUPLICATE_SKU: "Duplicate SKU",
  DUPLICATE_PRODUCT_NAME: "Duplicate Product Name",
  NEGATIVE_INVENTORY: "Negative Inventory",
  INVALID_CURRENCY: "Invalid Currency",
  MISSING_REQUIRED_FIELD: "Missing Required Field",
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthHistoryItem[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogUpload[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [validationScores, setValidationScores] = useState<Record<number, number | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setAnalyticsError(null);

    try {
      const [analyticsData, historyData, catalogsData, reviewsData] =
        await Promise.all([
          getAnalyticsSummary().catch((err) => {
            console.error("Analytics error:", err);
            setAnalyticsError("Unable to load analytics.");
            return null;
          }),
          getHealthHistory()
            .then((res) => res.history || [])
            .catch(() => []),
          getCatalogs().catch(() => []),
          getReviewQueue().catch(() => []),
        ]);

      setAnalytics(analyticsData);
      setHealthHistory(historyData);
      setCatalogs(catalogsData || []);
      setReviews(reviewsData || []);

      const scores: Record<number, number | null> = {};
      if (catalogsData && catalogsData.length > 0) {
        await Promise.all(
          catalogsData.slice(0, 5).map(async (cat) => {
            try {
              const res = await getValidationResult(cat.upload_id);
              scores[cat.upload_id] = res.health_score;
            } catch {
              scores[cat.upload_id] = null;
            }
          })
        );
      }
      setValidationScores(scores);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard data from backend.";
      setToastMessage({
        type: "error",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleValidate = async (uploadId: number) => {
    setValidatingId(uploadId);
    try {
      const result = await validateCatalog(uploadId);
      setValidationScores((prev) => ({
        ...prev,
        [uploadId]: result.health_score,
      }));
      setToastMessage({
        type: "success",
        message: `Catalog #${uploadId} validated successfully. Health score: ${result.health_score}%.`,
      });
      fetchDashboardData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : `Failed to validate catalog #${uploadId}.`;
      setToastMessage({
        type: "error",
        message,
      });
    } finally {
      setValidatingId(null);
    }
  };

  const totalProductsCount = analytics?.total_products ?? 0;
  const requiringReviewCount = analytics?.products_requiring_review ?? reviews.length;
  const catalogCount = analytics?.total_catalogs ?? catalogs.length;
  const latestHealthScore = analytics?.latest_health_score ?? null;

  const totalBreakdownProducts =
    (analytics?.status_breakdown.valid || 0) +
    (analytics?.status_breakdown.warning || 0) +
    (analytics?.status_breakdown.invalid || 0);

  const validPct =
    totalBreakdownProducts > 0
      ? Math.round(((analytics?.status_breakdown.valid || 0) / totalBreakdownProducts) * 100)
      : 0;
  const warningPct =
    totalBreakdownProducts > 0
      ? Math.round(((analytics?.status_breakdown.warning || 0) / totalBreakdownProducts) * 100)
      : 0;
  const invalidPct =
    totalBreakdownProducts > 0
      ? Math.max(0, 100 - validPct - warningPct)
      : 0;

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
              Operations Console
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              MONITORING
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time catalog health telemetry, deterministic rule evaluation, and review triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={isLoading}
            className="h-8"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Link href="/uploads">
            <Button size="sm" className="h-8">
              <UploadCloud className="w-3.5 h-3.5 mr-1" />
              Ingest Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Error Notification */}
      {analyticsError && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{analyticsError}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={fetchDashboardData} className="h-6 text-xs text-red-700 hover:bg-red-100">
            Retry
          </Button>
        </div>
      )}

      {/* Attention Banner if Review Queue has items */}
      {!isLoading && requiringReviewCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-amber-950">
                Action Required: {requiringReviewCount} product{requiringReviewCount > 1 ? "s" : ""} flagged for human review.
              </span>
              <span className="text-amber-800 ml-1 hidden md:inline">
                Resolve deterministic validation failures to unblock catalog sync.
              </span>
            </div>
          </div>
          <Link href="/reviews">
            <Button size="sm" variant="secondary" className="h-7 text-xs whitespace-nowrap bg-white text-amber-900 hover:bg-amber-100/50 border-amber-300">
              Open Review Queue
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Primary Operational Metrics Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Dominant Metric: Catalog Health Score */}
          <KpiCard
            title="Catalog Health"
            value={latestHealthScore !== null ? `${latestHealthScore}%` : "—"}
            subtitle={
              latestHealthScore !== null
                ? latestHealthScore >= 80
                  ? "Quality passing standard"
                  : latestHealthScore >= 50
                  ? "Degraded · Action required"
                  : "Critical failures present"
                : "No validation run yet"
            }
            icon={Activity}
            variant={
              latestHealthScore !== null
                ? latestHealthScore >= 80
                  ? "success"
                  : latestHealthScore >= 50
                  ? "warning"
                  : "danger"
                : "default"
            }
            dominant={true}
            badge={
              latestHealthScore !== null
                ? latestHealthScore >= 80
                  ? "OPTIMAL"
                  : latestHealthScore >= 50
                  ? "WARNING"
                  : "CRITICAL"
                : "PENDING"
            }
          />

          <KpiCard
            title="Requiring Review"
            value={requiringReviewCount}
            subtitle={
              requiringReviewCount > 0
                ? "Flagged for manual review"
                : "All products verified"
            }
            icon={AlertTriangle}
            variant={requiringReviewCount > 0 ? "warning" : "success"}
          />

          <KpiCard
            title="Invalid Products"
            value={analytics?.status_breakdown.invalid ?? 0}
            subtitle="Blocking schema errors"
            icon={AlertCircle}
            variant={(analytics?.status_breakdown.invalid ?? 0) > 0 ? "danger" : "default"}
          />

          <KpiCard
            title="Warning Products"
            value={analytics?.status_breakdown.warning ?? 0}
            subtitle="Non-blocking quality defects"
            icon={AlertTriangle}
            variant={(analytics?.status_breakdown.warning ?? 0) > 0 ? "warning" : "default"}
          />

          <KpiCard
            title="Total Products"
            value={totalProductsCount}
            subtitle={`Across ${catalogCount} catalog file${catalogCount === 1 ? "" : "s"}`}
            icon={Package}
            variant="default"
          />
        </div>
      )}

      {/* Analytics Telemetry Section: Validation Distribution & Top Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Breakdown Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wider text-slate-700">
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                Validation Status Distribution
              </CardTitle>
              <CardDescription>
                Deterministic validation rule distribution across ingested inventory.
              </CardDescription>
            </div>
            {totalBreakdownProducts > 0 && (
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {totalBreakdownProducts} products evaluated
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3 py-2">
                <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-8 bg-slate-100 rounded animate-pulse w-full" />
              </div>
            ) : totalBreakdownProducts === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-100">
                {catalogCount === 0
                  ? "No catalogs uploaded yet."
                  : "Run validation on uploaded catalogs to view status distribution."}
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Horizontal Segmented Bar */}
                <div className="h-3 w-full bg-slate-100 rounded-sm overflow-hidden flex border border-slate-200/60">
                  <div
                    style={{ width: `${validPct}%` }}
                    className="bg-emerald-600 transition-all duration-300"
                    title={`Valid: ${analytics?.status_breakdown.valid} (${validPct}%)`}
                  />
                  <div
                    style={{ width: `${warningPct}%` }}
                    className="bg-amber-500 transition-all duration-300"
                    title={`Warning: ${analytics?.status_breakdown.warning} (${warningPct}%)`}
                  />
                  <div
                    style={{ width: `${invalidPct}%` }}
                    className="bg-red-600 transition-all duration-300"
                    title={`Invalid: ${analytics?.status_breakdown.invalid} (${invalidPct}%)`}
                  />
                </div>

                {/* Operations Metric Pills */}
                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded border border-emerald-200/80 bg-emerald-50/40 text-emerald-950">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                        Valid
                      </span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="text-base font-bold font-mono mt-1">
                      {analytics?.status_breakdown.valid || 0}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700">
                      {validPct}% of catalog
                    </span>
                  </div>

                  <div className="p-2.5 rounded border border-amber-200/80 bg-amber-50/40 text-amber-950">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                        Warning
                      </span>
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="text-base font-bold font-mono mt-1">
                      {analytics?.status_breakdown.warning || 0}
                    </div>
                    <span className="text-[10px] font-mono text-amber-700">
                      {warningPct}% of catalog
                    </span>
                  </div>

                  <div className="p-2.5 rounded border border-red-200/80 bg-red-50/40 text-red-950">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-red-800 uppercase tracking-wider">
                        Invalid
                      </span>
                      <AlertCircle className="w-3 h-3 text-red-600" />
                    </div>
                    <div className="text-base font-bold font-mono mt-1">
                      {analytics?.status_breakdown.invalid || 0}
                    </div>
                    <span className="text-[10px] font-mono text-red-700">
                      {invalidPct}% of catalog
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Validation Issues Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wider text-slate-700">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Top Validation Issues
              </CardTitle>
              <CardDescription>
                Most frequently triggered catalog data quality rule violations.
              </CardDescription>
            </div>
            {analytics?.top_issues && analytics.top_issues.length > 0 && (
              <span className="text-[11px] font-mono text-slate-500">
                {analytics.top_issues.length} active codes
              </span>
            )}
          </CardHeader>
          <CardContent className="pt-3">
            {isLoading ? (
              <div className="space-y-2">
                <TableSkeleton rows={3} cols={2} />
              </div>
            ) : !analytics?.top_issues || analytics.top_issues.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-100">
                No validation rule violations logged.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {analytics.top_issues.slice(0, 4).map((item) => (
                  <div
                    key={item.code}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {ISSUE_CODE_LABELS[item.code] || item.code}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.code}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                      {item.count} {item.count === 1 ? "occurrence" : "occurrences"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Catalog Health History Audit Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wider text-slate-700">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              Catalog Health History
            </CardTitle>
            <CardDescription>
              Chronological ledger of validation runs and health score evolution.
            </CardDescription>
          </div>
          {healthHistory.length > 0 && (
            <span className="text-[11px] font-mono text-slate-500">
              {healthHistory.length} recorded run{healthHistory.length === 1 ? "" : "s"}
            </span>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              <TableSkeleton rows={2} cols={4} />
            </div>
          ) : healthHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-100">
              No historical validation telemetry. Validate a catalog to generate health scores.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {healthHistory.slice(0, 4).map((item) => {
                const dateStr = item.created_at
                  ? new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(item.created_at))
                  : "Run #" + item.validation_run_id;

                const scoreColor =
                  item.health_score >= 80
                    ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                    : item.health_score >= 50
                    ? "text-amber-800 bg-amber-50 border-amber-200"
                    : "text-red-800 bg-red-50 border-red-200";

                return (
                  <div
                    key={item.validation_run_id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-xs text-slate-950 block">
                        Validation Run #{item.validation_run_id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        Upload #{item.upload_id} · {dateStr}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border shrink-0 ${scoreColor}`}
                    >
                      {item.health_score}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Operational Tables: Ingested Catalogs & Review Queue Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Catalogs Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  Recent Ingested Catalogs
                </CardTitle>
                <CardDescription>
                  Recently uploaded files and automated validation status.
                </CardDescription>
              </div>
              <Link href="/uploads">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-600">
                  Full History
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5">
                  <TableSkeleton rows={4} cols={5} />
                </div>
              ) : catalogs.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={UploadCloud}
                    title="No catalogs ingested yet"
                    description="Upload your first CSV or XLSX product catalog to evaluate quality."
                    action={
                      <Link href="/uploads">
                        <Button size="sm">
                          <UploadCloud className="w-3.5 h-3.5 mr-1" />
                          Ingest Catalog
                        </Button>
                      </Link>
                    }
                  />
                </div>
              ) : (
                <RecentCatalogsTable
                  catalogs={catalogs}
                  validationScores={validationScores}
                  onValidate={handleValidate}
                  validatingId={validatingId}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Queue Triage Preview */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ListFilter className="w-3.5 h-3.5 text-blue-600" />
                    Review Queue
                  </CardTitle>
                  <CardDescription>
                    Human-in-the-loop exception triage.
                  </CardDescription>
                </div>
                {reviews.length > 0 && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {reviews.length} PENDING
                  </span>
                )}
              </CardHeader>

              <CardContent className="pt-3">
                {isLoading ? (
                  <div className="space-y-2.5">
                    <TableSkeleton rows={3} cols={2} />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-200 p-4 text-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-emerald-950">
                      Queue is Clear
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      No products currently require human operations review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="divide-y divide-slate-100 text-xs">
                      {reviews.slice(0, 4).map((item) => (
                        <div key={item.product_id} className="py-2 flex items-center justify-between gap-2">
                          <div className="min-w-0 pr-2">
                            <p className="font-medium text-slate-900 truncate">
                              {item.name || "Untitled Product"}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              SKU: {item.sku}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase shrink-0 border ${
                              (item.validation_status || "").toLowerCase() === "invalid"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {item.validation_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/40 rounded-b-lg">
              <Link href="/reviews" className="w-full block">
                <Button variant="outline" className="w-full justify-between text-xs h-8">
                  <span>Open Operations Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
