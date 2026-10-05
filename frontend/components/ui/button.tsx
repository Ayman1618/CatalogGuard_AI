import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer tracking-tight";

    const variantStyles = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 border border-blue-700/30 shadow-xs active:bg-blue-800 focus-visible:ring-blue-500",
      secondary:
        "bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-xs active:bg-slate-100 focus-visible:ring-slate-400",
      outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-xs active:bg-slate-100 focus-visible:ring-slate-400",
      ghost:
        "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus-visible:ring-slate-400",
      danger:
        "bg-red-600 text-white hover:bg-red-700 border border-red-700/30 shadow-xs active:bg-red-800 focus-visible:ring-red-500",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700/30 shadow-xs active:bg-emerald-800 focus-visible:ring-emerald-500",
      link: "text-blue-600 underline-offset-4 hover:underline p-0 h-auto font-normal",
    };

    const sizeStyles = {
      sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
      md: "h-8 px-3 text-xs font-medium gap-1.5 rounded-md",
      lg: "h-10 px-4 text-sm gap-2 rounded-lg",
      icon: "h-8 w-8 p-0 rounded-md",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
