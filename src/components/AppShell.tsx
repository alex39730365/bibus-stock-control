"use client";

import { usePathname } from "next/navigation";
import { AdminLayout } from "./AdminLayout";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <>{children}</>;
  }
  return <AdminLayout>{children}</AdminLayout>;
}
