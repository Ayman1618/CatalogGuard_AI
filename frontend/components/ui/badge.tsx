import React from "react";
import { cn } from "@/lib/utils";
import { ReviewStatus, ValidationSeverity, ValidationStatus } from "@/types/catalog";
import { Check, AlertTriangle, AlertCircle, Clock, X } from "lucide-react";

interface ValidationBadgeProps {
  status: ValidationStatus;
  className?: string;
  showIcon?: boolean;
}

export function ValidationBadge({
  status,
  className,
  showIcon = true,
}: ValidationBadgeProps) {
  const normalized = (status || "").toLowerCase() as ValidationStatus;

  if (normalized === "valid") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight bg-emerald-50 text-emerald-800 border border-emerald-200/90",
          className
        )}
      >
        {showIcon && <Check className="w-3 h-3 text-emerald-700 shrink-0 stroke-[2.5]" />}
        <span>Valid</span>
      </span>
    );
  }

  if (normalized === "warning") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight bg-amber-50 text-amber-800 border border-amber-200/90",
          className
        )}
      >
        {showIcon && <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0 stroke-[2.5]" />}
        <span>Warning</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight bg-red-50 text-red-800 border border-red-200/90",
        className
      )}
    >
      {showIcon && <AlertCircle className="w-3 h-3 text-red-700 shrink-0 stroke-[2.5]" />}
      <span>Invalid</span>
    </span>
  );
}

interface ReviewBadgeProps {
  status: ReviewStatus;
  className?: string;
  showIcon?: boolean;
}

export function ReviewBadge({
  status,
  className,
  showIcon = true,
}: ReviewBadgeProps) {
  const normalized = (status || "").toLowerCase() as ReviewStatus;

  if (normalized === "approved") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight bg-emerald-50 text-emerald-800 border border-emerald-200/90",
          className
        )}
      >
        {showIcon && <Check className="w-3 h-3 text-emerald-700 shrink-0 stroke-[2.5]" />}
        <span>Approved</span>
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight bg-red-50 text-red-800 border border-red-200/90",
          className
        )}
      >
        {showIcon && <X className="w-3 h-3 text-red-700 shrink-0 stroke-[2.5]" />}
        <span>Rejected</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-tight bg-slate-100 text-slate-700 border border-slate-200",
        className
      )}
    >
      {showIcon && <Clock className="w-3 h-3 text-slate-500 shrink-0" />}
      <span>Pending</span>
    </span>
  );
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: ValidationSeverity;
  className?: string;
}) {
  const isError = (severity || "").toLowerCase() === "error";

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider",
        isError
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-amber-50 text-amber-700 border border-amber-200",
        className
      )}
    >
      {severity}
    </span>
  );
}

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: "low" | "medium" | "high";
  className?: string;
}) {
  const norm = (confidence || "").toLowerCase();
  const colorClass =
    norm === "high"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : norm === "medium"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border uppercase tracking-wider",
        colorClass,
        className
      )}
    >
      Confidence: {confidence}
    </span>
  );
}
