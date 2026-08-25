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
  Settings,
  Circle,
  X,
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
    },
    {
      title: "Uploads",
      href: "/uploads",
      icon: FolderUp,
      active: pathname.startsWith("/uploads"),
    },
    {
      title: "Review Queue",
      href: "/reviews",
      icon: ListFilter,
      active: pathname.startsWith("/reviews"),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out md:translate-x-0 dark:border-slate-800 dark:bg-slate-950",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-slate-900 tracking-tight dark:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-none">CatalogGuard</span>
              <span className="text-[10px] text-slate-500 font-normal mt-0.5">Operations Hub</span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Operations
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    item.active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      item.active
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400"
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}

            {/* Settings Placeholder */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed opacity-60"
              title="Settings (Read only / placeholder)"
            >
              <Settings className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Settings</span>
              <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                SOON
              </span>
            </div>
          </nav>
        </div>

        {/* Footer / Status */}
        <div className="border-t border-slate-200/80 p-4 space-y-3 dark:border-slate-800">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Circle
                className={cn(
                  "h-2.5 w-2.5 fill-current",
                  apiStatus === "online"
                    ? "text-emerald-500"
                    : apiStatus === "offline"
                    ? "text-rose-500"
                    : "text-amber-500"
                )}
              />
              <span>API Backend</span>
            </div>
            <span className="font-mono text-[11px] font-medium capitalize">
              {apiStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
              OP
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Operations Lead
              </span>
              <span className="text-[11px] text-slate-500">catalog@guard.internal</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
