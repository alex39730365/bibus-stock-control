"use client";

import { useRouter } from "next/navigation";
import { LogOut, Shield } from "lucide-react";

export function AdminHeader({ username }: { username: string }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Shield size={16} className="text-[#396bea]" />
        <span>Administrator console</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Signed in as <strong className="text-gray-900">{username}</strong>
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
