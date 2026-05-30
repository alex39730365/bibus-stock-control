"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  FileUp,
  Database,
  LineChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const STORAGE_KEY = "bibus-sidebar-collapsed";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Stock Items", icon: Package },
  { href: "/movements", label: "Stock Movements", icon: ArrowLeftRight },
  { href: "/psi", label: "SCM / PSI", icon: LineChart },
  { href: "/import", label: "Data Import", icon: FileUp },
];

function readCollapsedPreference(pathname: string): boolean {
  if (typeof window === "undefined") return pathname.startsWith("/psi");
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) return saved === "true";
  return pathname.startsWith("/psi");
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsedPreference(pathname));
  }, [pathname]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <aside
      className={clsx(
        "relative flex shrink-0 flex-col border-r border-gray-200 bg-[#1a1a2e] text-white transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-52"
      )}
    >
      <button
        type="button"
        onClick={toggle}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div
        className={clsx(
          "border-b border-white/10",
          collapsed ? "px-2 py-4" : "px-4 py-4"
        )}
      >
        <div
          className={clsx(
            "flex items-center",
            collapsed ? "justify-center" : "gap-2.5"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#396bea] text-sm font-bold">
            B
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">BIBUS</p>
              <p className="text-xs text-blue-200/80">Stock Control</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <p className="mt-3 rounded-md bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-blue-200/70">
            Admin Program
          </p>
        )}
      </div>

      <nav
        className={clsx(
          "flex flex-1 flex-col gap-0.5 p-2",
          collapsed && "items-center"
        )}
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                collapsed
                  ? "h-10 w-10 justify-center"
                  : "gap-2.5 px-3 py-2.5",
                active
                  ? "bg-[#396bea] text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div
        className={clsx(
          "border-t border-white/10 p-2",
          collapsed ? "flex justify-center" : "p-3"
        )}
      >
        {collapsed ? (
          <span title="Local JSON · API ready">
            <Database size={16} className="text-gray-500" />
          </span>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Database size={14} className="shrink-0" />
            <span className="truncate">Local JSON · API ready</span>
          </div>
        )}
      </div>
    </aside>
  );
}
