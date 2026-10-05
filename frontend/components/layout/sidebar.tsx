"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderUp,
  ListFilter,
  ShieldCheck,
  X,
  FileText,
} from "lucide-react";
import { getHealth } from "@/lib/api";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let isMounted = true;
    async function checkApi() {
      try {
        const res = await getHealth();
        if (isMounted) {
          setApiStatus(res.status === "ok" ? "online" : "offline");
        }
      } catch {
        if (isMounted) {
          setApiStatus("offline");
        }
      }
    }
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
      badge: null,
    },
    {
      title: "Catalog Ingestion",
      href: "/uploads",
      icon: FolderUp,
      active: pathname.startsWith("/uploads"),
      badge: null,
    },
    {
      title: "Review Queue",
      href: "/reviews",
      icon: ListFilter,
      active: pathname.startsWith("/reviews"),
      badge: "LIVE",
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-slate-200 bg-slate-50/50">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-slate-900 tracking-tight"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="h-4 w-4 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-950">CatalogGuard</span>
              <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Operations</span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
              Workflows
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                      item.active
                        ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 rounded-l-none"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          item.active
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
              Operational Specs
            </div>
            <div className="space-y-0.5">
              <Link
                href="/uploads"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-slate-500 hover:bg-slate-100/70 hover:text-slate-900 transition-colors"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span>Ingestion Schema</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer / Status */}
        <div className="border-t border-slate-200 p-3 space-y-2 bg-slate-50/40">
          <div className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-xs text-slate-600 border border-slate-200">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  apiStatus === "online"
                    ? "bg-emerald-500 ring-2 ring-emerald-100"
                    : apiStatus === "offline"
                    ? "bg-red-500 ring-2 ring-red-100"
                    : "bg-amber-500 ring-2 ring-amber-100"
                )}
              />
              <span className="text-[11px] font-medium text-slate-700">Service API</span>
            </div>
            <span className="font-mono text-[10px] uppercase font-semibold text-slate-500">
              {apiStatus}
            </span>
          </div>

          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] border border-slate-200">
              OP
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 truncate">
                Operations Console
              </span>
              <span className="text-[10px] text-slate-400 truncate">catalog.internal</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
