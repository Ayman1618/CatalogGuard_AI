"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCatalogs,
  getReviewQueue,
  getValidationResult,
  validateCatalog,
} from "@/lib/api";
import { CatalogUpload, ReviewItem } from "@/types/catalog";
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
} from "lucide-react";

export default function DashboardPage() {
  const [catalogs, setCatalogs] = useState<CatalogUpload[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [validationScores, setValidationScores] = useState<Record<number, number | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [catalogsData, reviewsData] = await Promise.all([
        getCatalogs(),
        getReviewQueue().catch(() => [] as ReviewItem[]),
      ]);

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
      const message = err instanceof Error ? err.message : "Failed to load dashboard data from backend.";
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
      const updatedReviews = await getReviewQueue().catch(() => []);
      setReviews(updatedReviews);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to validate catalog #${uploadId}.`;
      setToastMessage({
        type: "error",
        message,
      });
    } finally {
      setValidatingId(null);
    }
  };

  const totalProductsIngested = catalogs.reduce(
    (acc, cat) => acc + (cat.total_products || 0),
    0
  );

  const scoredValues = Object.values(validationScores).filter(
    (s): s is number => typeof s === "number"
  );
  const avgHealthScore =
    scoredValues.length > 0
      ? Math.round(
          scoredValues.reduce((acc, s) => acc + s, 0) / scoredValues.length
        )
      : null;

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
            Real-time catalog quality metrics, ingestion history, and review workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              fetchDashboardData();
            }}
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
            value={totalProductsIngested}
            subtitle={
              catalogs.length > 0
                ? `Across ${catalogs.length} ingested catalog file${
                    catalogs.length > 1 ? "s" : ""
                  }`
                : "No catalogs uploaded yet"
            }
            icon={Package}
            variant="indigo"
          />

          <KpiCard
            title="Requiring Review"
            value={reviews.length}
            subtitle={
              reviews.length > 0
                ? "Flagged with errors or warnings"
                : "All products verified"
            }
            icon={AlertTriangle}
            variant={reviews.length > 0 ? "warning" : "success"}
          />

          <KpiCard
            title="Processed Catalogs"
            value={catalogs.length}
            subtitle="Successfully parsed into database"
            icon={FileSpreadsheet}
            variant="default"
          />

          <KpiCard
            title="Catalog Health Score"
            value={avgHealthScore !== null ? `${avgHealthScore}%` : "N/A"}
            subtitle={
              avgHealthScore !== null
                ? "Calculated quality score"
                : "Run validation on catalogs"
            }
            icon={Activity}
            variant={
              avgHealthScore !== null
                ? avgHealthScore >= 80
                  ? "success"
                  : avgHealthScore >= 50
                  ? "warning"
                  : "default"
                : "default"
            }
          />
        </div>
      )}

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
