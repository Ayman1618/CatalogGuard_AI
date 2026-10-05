"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getReviewDetails,
  approveProduct,
  rejectProduct,
} from "@/lib/api";
import { ReviewDetails } from "@/types/catalog";
import { ProductDetailCard } from "@/components/reviews/product-detail-card";
import { IssuesList } from "@/components/reviews/issues-list";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast, EmptyState } from "@/components/ui/toast";
import {
  ArrowLeft,
  AlertTriangle,
  X,
  Check,
  ShieldAlert,
} from "lucide-react";

export default function ProductReviewDetailPage() {
  const params = useParams();
  const productId = params?.productId ? Number(params.productId) : NaN;

  const [details, setDetails] = useState<ReviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const data = await getReviewDetails(productId);
        if (isMounted) {
          setDetails(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to load product review details.";
          setToastMessage({
            type: "error",
            message,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleApprove = async () => {
    if (!productId) return;
    setIsApproving(true);
    try {
      const res = await approveProduct(productId);
      setDetails((prev) =>
        prev ? { ...prev, review_status: res.review_status } : null
      );
      setToastMessage({
        type: "success",
        message: `Product (SKU: ${details?.sku || productId}) approved. Status updated to APPROVED.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve product.";
      setToastMessage({
        type: "error",
        message,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!productId) return;
    setIsRejecting(true);
    try {
      const res = await rejectProduct(productId);
      setDetails((prev) =>
        prev ? { ...prev, review_status: res.review_status } : null
      );
      setToastMessage({
        type: "success",
        message: `Product (SKU: ${details?.sku || productId}) rejected. Status updated to REJECTED.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reject product.";
      setToastMessage({
        type: "error",
        message,
      });
    } finally {
      setIsRejecting(false);
    }
  };

  if (isNaN(productId)) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Link href="/reviews">
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Review Queue
          </Button>
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="Invalid Product Identifier"
          description="The requested product review record could not be parsed."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Top Header & Triage Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/reviews">
            <Button variant="secondary" size="sm" className="h-8 text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Queue
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-950 tracking-tight">
                Product Review Investigation
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                #{productId}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Deterministic rule inspection and operator resolution
            </p>
          </div>
        </div>

        {/* Action Decision Buttons */}
        {details && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              isLoading={isRejecting}
              disabled={isApproving || details.review_status === "rejected"}
              className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              <X className="w-3.5 h-3.5 mr-1 text-red-600 stroke-[2.5]" />
              Reject Product
            </Button>

            <Button
              variant="success"
              size="sm"
              onClick={handleApprove}
              isLoading={isApproving}
              disabled={isRejecting || details.review_status === "approved"}
              className="h-8 text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
              Approve Product
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-6 w-3/4" />
            <div className="grid grid-cols-4 gap-3 pt-2">
              <Skeleton className="h-12 rounded" />
              <Skeleton className="h-12 rounded" />
              <Skeleton className="h-12 rounded" />
              <Skeleton className="h-12 rounded" />
            </div>
          </div>
          <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-16 w-full rounded" />
          </div>
        </div>
      ) : !details ? (
        <EmptyState
          icon={AlertTriangle}
          title="Product record not found"
          description="Could not locate the requested product review record in the database."
          action={
            <Link href="/reviews">
              <Button size="sm">Return to Review Queue</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* 1. PRODUCT INFORMATION & 2. VALIDATION STATUS */}
          <ProductDetailCard details={details} />

          {/* 3. ISSUES FOUND & 4. AI ASSISTANCE */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  Deterministic Validation Issues
                </CardTitle>
                <CardDescription>
                  Rule violations evaluated during automated catalog ingestion.
                </CardDescription>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {details.issues?.length || 0} issue{details.issues?.length === 1 ? "" : "s"}
              </span>
            </CardHeader>
            <CardContent className="pt-3">
              <IssuesList issues={details.issues || []} productId={details.product_id} />
            </CardContent>
          </Card>

          {/* 5. REVIEW DECISION (Bottom sticky / persistent bar for fast triage) */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Final Review Decision
              </span>
              <span className="text-[11px] text-slate-500">
                Current State: <strong className="uppercase font-mono text-slate-700">{details.review_status}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                isLoading={isRejecting}
                disabled={isApproving || details.review_status === "rejected"}
                className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
              >
                <X className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                Reject
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleApprove}
                isLoading={isApproving}
                disabled={isRejecting || details.review_status === "approved"}
                className="h-8 text-xs font-semibold"
              >
                <Check className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
