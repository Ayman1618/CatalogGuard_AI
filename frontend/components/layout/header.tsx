"use client";

import React from "react";
import { Menu, ShieldCheck } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

export function Header({
  title = "Overview",
  subtitle,
  onMenuClick,
  actions,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-5 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-1.5 -ml-1.5 rounded-md text-slate-500 hover:bg-slate-100 md:hidden focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-slate-950 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <>
              <span className="text-slate-300 text-xs hidden sm:inline">/</span>
              <p className="text-xs text-slate-500 hidden sm:block font-normal">
                {subtitle}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {actions}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-[11px] text-slate-600 border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium">Rule Engine</span>
          <span className="text-slate-400">·</span>
          <span className="text-emerald-700 font-mono font-semibold">Active</span>
        </div>
      </div>
    </header>
  );
}
