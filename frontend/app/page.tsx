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
  BarChart3,
  TrendingUp,
  AlertCircle,
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
      // Refresh analytics & review queue
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
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operations Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time catalog quality metrics, validation insights, and review workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={isLoading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Link href="/uploads">
            <Button size="sm">
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              Upload Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Error Notification */}
      {analyticsError && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-800 text-xs flex items-center justify-between dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{analyticsError}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={fetchDashboardData} className="h-7 text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Products"
            value={totalProductsCount}
            subtitle={
              catalogCount > 0
                ? `Across ${catalogCount} ingested catalog file${catalogCount > 1 ? "s" : ""}`
                : "No catalogs uploaded yet"
            }
            icon={Package}
            variant="indigo"
          />

          <KpiCard
            title="Requiring Review"
            value={requiringReviewCount}
            subtitle={
              requiringReviewCount > 0
                ? "Flagged with errors or warnings"
                : "All products verified"
            }
            icon={AlertTriangle}
            variant={requiringReviewCount > 0 ? "warning" : "success"}
          />

          <KpiCard
            title="Processed Catalogs"
            value={catalogCount}
            subtitle="Successfully parsed into database"
            icon={FileSpreadsheet}
            variant="default"
          />

          <KpiCard
            title="Catalog Health Score"
            value={latestHealthScore !== null ? `${latestHealthScore}%` : "N/A"}
            subtitle={
              latestHealthScore !== null
                ? "Latest validation snapshot score"
                : "Run validation on catalogs"
            }
            icon={Activity}
            variant={
              latestHealthScore !== null
                ? latestHealthScore >= 80
                  ? "success"
                  : latestHealthScore >= 50
                  ? "warning"
                  : "default"
                : "default"
            }
          />
        </div>
      )}

      {/* Analytics Insights Section: Status Breakdown & Top Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Validation Status Breakdown Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Validation Status Breakdown
            </CardTitle>
            <CardDescription>
              Product distribution across valid, warning, and invalid states.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-3 py-2">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-10 bg-slate-100 rounded animate-pulse w-full" />
              </div>
            ) : totalBreakdownProducts === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg dark:bg-slate-900 dark:text-slate-400">
                {catalogCount === 0
                  ? "No catalogs uploaded yet."
                  : "Upload a catalog and run validation to see status breakdown."}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal Bar */}
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${validPct}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                    title={`Valid: ${analytics?.status_breakdown.valid} (${validPct}%)`}
                  />
                  <div
                    style={{ width: `${warningPct}%` }}
                    className="bg-amber-500 transition-all duration-500"
                    title={`Warning: ${analytics?.status_breakdown.warning} (${warningPct}%)`}
                  />
                  <div
                    style={{ width: `${invalidPct}%` }}
                    className="bg-rose-500 transition-all duration-500"
                    title={`Invalid: ${analytics?.status_breakdown.invalid} (${invalidPct}%)`}
                  />
                </div>

                {/* Legend Pills */}
                <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-medium">
                      Valid
                    </span>
                    <strong className="text-sm font-bold mt-0.5 block">
                      {analytics?.status_breakdown.valid || 0}
                    </strong>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      {validPct}% of total
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-amber-200/80 bg-amber-50/50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-medium">
                      Warning
                    </span>
                    <strong className="text-sm font-bold mt-0.5 block">
                      {analytics?.status_breakdown.warning || 0}
                    </strong>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                      {warningPct}% of total
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-rose-200/80 bg-rose-50/50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
                    <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-medium">
                      Invalid
                    </span>
                    <strong className="text-sm font-bold mt-0.5 block">
                      {analytics?.status_breakdown.invalid || 0}
                    </strong>
                    <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400">
                      {invalidPct}% of total
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Common Validation Issues Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Most Common Validation Issues
            </CardTitle>
            <CardDescription>
              Top rule violation occurrences aggregated across validation runs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <TableSkeleton rows={3} cols={2} />
              </div>
            ) : !analytics?.top_issues || analytics.top_issues.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg dark:bg-slate-900 dark:text-slate-400">
                No validation issues recorded.
              </div>
            ) : (
              <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800 text-xs">
                {analytics.top_issues.map((item) => (
                  <div
                    key={item.code}
                    className="p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {ISSUE_CODE_LABELS[item.code] || item.code}
                      </p>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {item.code}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full font-mono font-bold text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {item.count} occurrence{item.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Catalog Health History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Catalog Health History
          </CardTitle>
          <CardDescription>
            Chronological progression of catalog health scores across validation runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-2">
              <TableSkeleton rows={2} cols={3} />
            </div>
          ) : healthHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg dark:bg-slate-900 dark:text-slate-400">
              Upload a catalog and run validation to see health insights.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {healthHistory.map((item) => {
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
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                    : item.health_score >= 50
                    ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    : "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";

                return (
                  <div
                    key={item.validation_run_id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                        Run #{item.validation_run_id}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Upload #{item.upload_id} · {dateStr}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${scoreColor}`}
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

      {/* Main Grid: Recent Catalogs & Review Queue CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Catalogs Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Recent Catalogs</CardTitle>
                <CardDescription>
                  Recently uploaded files and their deterministic validation states.
                </CardDescription>
              </div>
              <Link href="/uploads">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6">
                  <TableSkeleton rows={4} cols={5} />
                </div>
              ) : catalogs.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={UploadCloud}
                    title="No catalogs ingested yet"
                    description="Upload your first CSV or XLSX product catalog to start validating quality."
                    action={
                      <Link href="/uploads">
                        <Button size="sm">
                          <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                          Upload Catalog
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

        {/* Review Queue Summary Card */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-indigo-600" />
                Review Queue
              </CardTitle>
              <CardDescription>
                Human-in-the-loop inspection for products flagged with data quality issues.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {isLoading ? (
                <div className="space-y-3">
                  <TableSkeleton rows={3} cols={2} />
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/80 p-5 text-center dark:bg-emerald-950/20 dark:border-emerald-900">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                    Queue is Clear
                  </p>
                  <p className="text-xs text-emerald-700 mt-1 dark:text-emerald-400">
                    No products currently require manual operations review.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900">
                    <div className="text-xs">
                      <span className="font-semibold text-amber-900 dark:text-amber-200">
                        {reviews.length} Products
                      </span>
                      <p className="text-amber-700 dark:text-amber-400">
                        Require human review decision
                      </p>
                    </div>
                    <Link href="/reviews">
                      <Button size="sm" variant="secondary" className="text-xs h-8">
                        Review Now
                      </Button>
                    </Link>
                  </div>

                  <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800 text-xs">
                    {reviews.slice(0, 3).map((item) => (
                      <div key={item.product_id} className="p-2.5 flex items-center justify-between">
                        <div className="truncate pr-2">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {item.sku}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          {item.validation_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 mt-4">
              <Link href="/reviews" className="w-full block">
                <Button variant="outline" className="w-full justify-between text-xs">
                  <span>Open Full Review Queue</span>
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
