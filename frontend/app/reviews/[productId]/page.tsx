"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
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
  Ban,
  Check,
} from "lucide-react";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default function ProductReviewDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = Number(resolvedParams.productId);

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
        message: `Product (SKU: ${details?.sku || productId}) approved successfully.`,
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
        message: `Product (SKU: ${details?.sku || productId}) rejected.`,
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
      <div className="space-y-6">
        <Link href="/reviews">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Review Queue
          </Button>
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="Invalid Product ID"
          description="The requested product ID is not valid."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reviews">
            <Button variant="outline" size="sm" className="h-9">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Queue
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Product Review Inspection
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Product ID #{productId}
            </span>
          </div>
        </div>

        {/* Action Decision Buttons */}
        {details && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              isLoading={isRejecting}
              disabled={isApproving || details.review_status === "rejected"}
              className="text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
            >
              <Ban className="w-4 h-4 mr-1.5 text-rose-600" />
              Reject Product
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              isLoading={isApproving}
              disabled={isRejecting || details.review_status === "approved"}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Approve Product
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-3/4" />
            <div className="grid grid-cols-4 gap-4 pt-4">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>
          <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      ) : !details ? (
        <EmptyState
          icon={AlertTriangle}
          title="Product not found"
          description="Could not locate the requested product review record in the catalog database."
          action={
            <Link href="/reviews">
              <Button size="sm">Return to Review Queue</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Product Overview Card */}
          <ProductDetailCard details={details} />

          {/* Validation Issues Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Deterministic Validation Issues
                </span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {details.issues?.length || 0} issue
                  {details.issues?.length === 1 ? "" : "s"}
                </span>
              </CardTitle>
              <CardDescription>
                Detailed errors and warnings produced by catalog rule evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IssuesList issues={details.issues || []} productId={details.product_id} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
