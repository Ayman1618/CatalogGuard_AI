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
  FileCode2,
  ArrowRight,
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
      console.warn("Validation result not found for catalog", uploadId, err);
      setToastMessage({
        type: "info",
        message: `Catalog #${uploadId} has not been validated yet. Click "Validate" to execute quality checks.`,
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
        message: `Catalog #${uploadId} validated successfully. Health score: ${result.health_score}%.`,
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
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Catalog Ingestion
            </h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              PIPELINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload and validate seller catalog data.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchCatalogs}
          isLoading={isLoading}
          className="h-8 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Refresh History
        </Button>
      </div>

      {/* Operations Workflow Step Indicator */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
        <div className="flex items-center gap-2 px-2 py-1 text-slate-700">
          <span className="h-5 w-5 rounded-full bg-blue-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
            1
          </span>
          <div className="min-w-0">
            <span className="font-semibold block text-slate-900 leading-tight">UPLOAD</span>
            <span className="text-[10px] text-slate-400">CSV or XLSX seller catalog</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300 ml-auto hidden sm:block" />
        </div>

        <div className="flex items-center gap-2 px-2 py-1 text-slate-700">
          <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
            2
          </span>
          <div className="min-w-0">
            <span className="font-semibold block text-slate-900 leading-tight">VALIDATE</span>
            <span className="text-[10px] text-slate-400">Automated deterministic rules</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-300 ml-auto hidden sm:block" />
        </div>

        <div className="flex items-center gap-2 px-2 py-1 text-slate-700">
          <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
            3
          </span>
          <div className="min-w-0">
            <span className="font-semibold block text-slate-900 leading-tight">REVIEW RESULTS</span>
            <span className="text-[10px] text-slate-400">Triage errors in Review Queue</span>
          </div>
        </div>
      </div>

      {/* Upload Ingestion & Schema Specification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upload Card */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FolderUp className="w-3.5 h-3.5 text-blue-600" />
                Ingest Catalog File
              </CardTitle>
              <CardDescription>
                Files are parsed, validated for encoding, and stored transactionally into the catalog database.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <UploadDropzone onUploadSuccess={handleUploadSuccess} />
            </CardContent>
          </Card>
        </div>

        {/* Operational Schema Checklist Specification */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
                  Schema Specification
                </CardTitle>
                <CardDescription>
                  Column requirements for catalog parser.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div className="border border-slate-200 rounded overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-2.5 py-1.5">Column</th>
                        <th className="px-2.5 py-1.5">Req</th>
                        <th className="px-2.5 py-1.5">Type & Rules</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-900">sku</td>
                        <td className="px-2.5 py-1.5"><span className="text-red-700 font-bold">Yes</span></td>
                        <td className="px-2.5 py-1.5 text-slate-500">Unique alphanumeric ID</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-900">name</td>
                        <td className="px-2.5 py-1.5"><span className="text-red-700 font-bold">Yes</span></td>
                        <td className="px-2.5 py-1.5 text-slate-500">Non-empty title</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-900">category</td>
                        <td className="px-2.5 py-1.5"><span className="text-red-700 font-bold">Yes</span></td>
                        <td className="px-2.5 py-1.5 text-slate-500">Category name</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-900">price</td>
                        <td className="px-2.5 py-1.5"><span className="text-red-700 font-bold">Yes</span></td>
                        <td className="px-2.5 py-1.5 text-slate-500">Numeric positive value</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-900">inventory</td>
                        <td className="px-2.5 py-1.5"><span className="text-red-700 font-bold">Yes</span></td>
                        <td className="px-2.5 py-1.5 text-slate-500">Integer &ge; 0</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1.5 font-mono text-slate-600">brand</td>
                        <td className="px-2.5 py-1.5 text-slate-400">Opt</td>
                        <td className="px-2.5 py-1.5 text-slate-500">Warning if missing</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1.5 font-mono text-slate-600">currency</td>
                        <td className="px-2.5 py-1.5 text-slate-400">Opt</td>
                        <td className="px-2.5 py-1.5 text-slate-500">Defaults to INR</td>
                      </tr>
                      <tr>
                        <td className="px-2.5 py-1.5 font-mono text-slate-600">image_url</td>
                        <td className="px-2.5 py-1.5 text-slate-400">Opt</td>
                        <td className="px-2.5 py-1.5 text-slate-500">Warning if missing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </div>

            <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500 rounded-b-lg">
              Missing optional fields trigger non-blocking quality warnings.
            </div>
          </Card>
        </div>
      </div>

      {/* Validation Result Inspection Panel */}
      {activeValidationResult && (
        <ValidationResultCard
          result={activeValidationResult}
          onClose={() => setActiveValidationResult(null)}
        />
      )}

      {/* Upload History Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              Ingestion Audit Ledger & Validation Actions
            </CardTitle>
            <CardDescription>
              Complete history of seller catalog files. Run validation or view inspection reports.
            </CardDescription>
          </div>
          {catalogs.length > 0 && (
            <span className="text-[11px] font-mono text-slate-500">
              {catalogs.length} file{catalogs.length === 1 ? "" : "s"} logged
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={5} cols={7} />
            </div>
          ) : catalogs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={UploadCloud}
                title="No catalog history"
                description="Upload your first catalog file above to start tracking ingestion and validation runs."
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
        <div className="p-6 space-y-4">
          <TableSkeleton rows={6} cols={6} />
        </div>
      }
    >
      <UploadsContent />
    </Suspense>
  );
}
