"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { AdminHeader } from "./AdminHeader";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.username) setUsername(res.data.username);
      })
      .catch(() => setUsername("admin"));
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader username={username ?? "…"} />
        <main className="flex-1 w-full max-w-full overflow-auto bg-[#f5f6f8]">
          {children}
        </main>
      </div>
    </div>
  );
}
