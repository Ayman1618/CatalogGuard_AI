"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCatalogs,
  getValidationResult,
  validateCatalog,
} from "@/lib/api";
import {
  CatalogUpload,
  CatalogValidationResponse,
  UploadCatalogResponse,
} from "@/types/catalog";
import { UploadDropzone } from "@/components/uploads/upload-dropzone";
import { CatalogHistoryTable } from "@/components/uploads/catalog-history-table";
import { ValidationResultCard } from "@/components/uploads/validation-result-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Toast, EmptyState } from "@/components/ui/toast";
import {
  UploadCloud,
  FolderUp,
  FileCheck2,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

function UploadsContent() {
  const searchParams = useSearchParams();
  const initialSelectedId = searchParams.get("selected")
    ? Number(searchParams.get("selected"))
    : null;

  const [catalogs, setCatalogs] = useState<CatalogUpload[]>([]);
  const [validationScores, setValidationScores] = useState<Record<number, number | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [activeValidationResult, setActiveValidationResult] =
    useState<CatalogValidationResponse | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(initialSelectedId);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fetchCatalogs = async () => {
    setIsLoading(true);
    try {
      const data = await getCatalogs();
      setCatalogs(data || []);

      const scores: Record<number, number | null> = {};
      if (data && data.length > 0) {
        await Promise.all(
          data.map(async (cat) => {
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
      const message = err instanceof Error ? err.message : "Failed to load catalog upload history.";
      setToastMessage({
        type: "error",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResult = async (uploadId: number) => {
    setSelectedUploadId(uploadId);
    try {
      const result = await getValidationResult(uploadId);
      setActiveValidationResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Could not fetch validation result for #${uploadId}.`;
      setToastMessage({
        type: "info",
        message: `Catalog #${uploadId} has not been validated yet or result is unavailable. Click "Validate" to run checks.`,
      });
    }
  };

  const handleValidate = async (uploadId: number) => {
    setValidatingId(uploadId);
    setSelectedUploadId(uploadId);
    try {
      const result = await validateCatalog(uploadId);
      setActiveValidationResult(result);
      setValidationScores((prev) => ({
        ...prev,
        [uploadId]: result.health_score,
      }));
      setToastMessage({
        type: "success",
        message: `Catalog #${uploadId} validated! Health score: ${result.health_score}%.`,
      });
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

  useEffect(() => {
    fetchCatalogs();
    if (initialSelectedId) {
      handleViewResult(initialSelectedId);
    }
  }, [initialSelectedId]);

  const handleUploadSuccess = (response: UploadCatalogResponse) => {
    setToastMessage({
      type: "success",
      message: `Catalog "${response.filename}" successfully ingested (${response.total_products} products, ID #${response.upload_id}).`,
    });
    fetchCatalogs();
    setSelectedUploadId(response.upload_id);
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
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
            Catalog Ingestion & Validation
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload CSV or Excel catalogs and run automated deterministic validation checks.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCatalogs}
          isLoading={isLoading}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh History
        </Button>
      </div>

      {/* Upload & Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Card */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderUp className="w-4 h-4 text-indigo-600" />
                Upload Catalog File
              </CardTitle>
              <CardDescription>
                Files are parsed and stored atomically into the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDropzone onUploadSuccess={handleUploadSuccess} />
            </CardContent>
          </Card>
        </div>

        {/* Catalog Requirements Card */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                Schema Checklist
              </CardTitle>
              <CardDescription>
                Catalog columns expected by ingestion parser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 block mb-1 dark:text-white">
                    Required Columns:
                  </span>
                  <code className="text-indigo-600 font-mono text-[11px] dark:text-indigo-400">
                    sku, name, category, price, inventory
                  </code>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 block mb-1 dark:text-white">
                    Optional Enrichment:
                  </span>
                  <code className="text-slate-600 font-mono text-[11px] dark:text-slate-400">
                    description, brand, currency, image_url
                  </code>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-[11px] dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-300">
                  <p className="font-medium">Default Behavior:</p>
                  <p className="text-indigo-700 mt-0.5 dark:text-indigo-400">
                    Missing currency defaults to INR. Empty fields trigger deterministic validation warnings or errors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Validation Result Modal / Banner Area */}
      {activeValidationResult && (
        <ValidationResultCard
          result={activeValidationResult}
          onClose={() => setActiveValidationResult(null)}
        />
      )}

      {/* Upload History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            Upload History & Validation Actions
          </CardTitle>
          <CardDescription>
            Audit log of all catalog uploads. Select any catalog to run validation or view results.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : catalogs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UploadCloud}
                title="No catalog history"
                description="Upload your first catalog file above to start tracking uploads."
              />
            </div>
          ) : (
            <CatalogHistoryTable
              catalogs={catalogs}
              validationScores={validationScores}
              onValidate={handleValidate}
              onViewResult={handleViewResult}
              validatingId={validatingId}
              selectedUploadId={selectedUploadId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UploadsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-6">
          <TableSkeleton rows={6} cols={6} />
        </div>
      }
    >
      <UploadsContent />
    </Suspense>
  );
}
