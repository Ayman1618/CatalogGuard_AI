import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  type: ToastType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Toast({
  type,
  title,
  message,
  onClose,
  className,
}: ToastProps) {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
  };

  const styleMap = {
    success: "bg-emerald-50/90 border-emerald-200 text-emerald-900",
    error: "bg-red-50/90 border-red-200 text-red-900",
    warning: "bg-amber-50/90 border-amber-200 text-amber-900",
    info: "bg-blue-50/90 border-blue-200 text-blue-900",
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 p-3 rounded-lg border shadow-xs transition-all text-xs",
        styleMap[type],
        className
      )}
    >
      {icons[type]}
      <div className="flex-1">
        {title && <p className="font-semibold text-xs tracking-tight">{title}</p>}
        <p className={cn(title ? "mt-0.5 text-xs opacity-90" : "font-medium leading-relaxed")}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss message"
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/60",
        className
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 mb-3">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
        {title}
      </h4>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
