import React from "react";
import { cn } from "@/lib/utils";
import { ReviewStatus, ValidationSeverity, ValidationStatus } from "@/types/catalog";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Check, Ban } from "lucide-react";

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
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          className
        )}
      >
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
        Valid
      </span>
    );
  }

  if (normalized === "warning") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          className
        )}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
        Warning
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        className
      )}
    >
      {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
      Invalid
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
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
          className
        )}
      >
        {showIcon && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
        Approved
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
          className
        )}
      >
        {showIcon && <Ban className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
        Rejected
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        className
      )}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
      Pending
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
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider",
        isError
          ? "bg-rose-100 text-rose-800 border border-rose-200"
          : "bg-amber-100 text-amber-800 border border-amber-200",
        className
      )}
    >
      {severity}
    </span>
  );
}
