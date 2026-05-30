"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  FileUp,
  Database,
  LineChart,
} from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Stock Items", icon: Package },
  { href: "/movements", label: "Stock Movements", icon: ArrowLeftRight },
  { href: "/psi", label: "SCM / PSI", icon: LineChart },
  { href: "/import", label: "Data Import", icon: FileUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-[#1a1a2e] text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#396bea] text-sm font-bold">
            B
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">BIBUS</p>
            <p className="text-xs text-blue-200/80">Stock Control</p>
          </div>
        </div>
        <p className="mt-3 rounded-md bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-blue-200/70">
          Admin Program
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#396bea] text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Database size={14} />
          <span>Local JSON · API ready</span>
        </div>
      </div>
    </aside>
  );
}
