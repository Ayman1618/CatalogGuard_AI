"use client";

import React from "react";
import { Menu, ShieldAlert } from "lucide-react";

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-500 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
          <span>Catalog Quality Engine v0.1</span>
        </div>
      </div>
    </header>
  );
}
