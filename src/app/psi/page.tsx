"use client";

import { PsiDashboard } from "@/components/PsiDashboard";
import { LineChart } from "lucide-react";

export default function PsiPage() {
  return (
    <div className="w-full max-w-full bg-slate-50 px-2 py-4 sm:px-3">
      <header className="mb-4">
        <div className="flex items-center gap-2 text-[#396bea]">
          <LineChart size={22} />
          <h1 className="text-2xl font-bold text-slate-900">SCM / PSI Planning</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Demantra demand forecast, schedule receipts, and months-of-supply —
          prototype dashboard (mock data)
        </p>
      </header>
      <PsiDashboard />
    </div>
  );
}
