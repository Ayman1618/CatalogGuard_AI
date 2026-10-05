import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "brand" | "indigo";
  dominant?: boolean;
  className?: string;
  badge?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  dominant = false,
  badge,
  className,
}: KpiCardProps) {
  const iconVariants = {
    default: "bg-slate-100 text-slate-600",
    brand: "bg-blue-50 text-blue-700",
    indigo: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  };

  const borderVariants = {
    default: "border-slate-200",
    brand: "border-blue-200/80 bg-blue-50/20",
    indigo: "border-blue-200/80 bg-blue-50/20",
    success: "border-emerald-200/80 bg-emerald-50/20",
    warning: "border-amber-200/80 bg-amber-50/20",
    danger: "border-red-200/80 bg-red-50/20",
  };

  return (
    <div
      className={cn(
        "flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border bg-white shadow-xs transition-colors",
        dominant ? borderVariants[variant] : "border-slate-200",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {badge}
            </span>
          )}
          <div className={cn("p-1.5 rounded-md", iconVariants[variant])}>
            <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
        </div>
      </div>
      <div className="mt-2.5">
        <div
          className={cn(
            "font-mono font-bold tracking-tight text-slate-950",
            dominant ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
          )}
        >
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-[11px] text-slate-500 leading-tight">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
