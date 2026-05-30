"use client";

import { PsiDashboard } from "@/components/PsiDashboard";
import { LineChart } from "lucide-react";

export default function PsiPage() {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-[#396bea]">
          <LineChart size={22} />
          <h1 className="text-2xl font-bold text-gray-900">SCM / PSI Planning</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Demantra demand forecast, schedule receipts, and months-of-supply —
          prototype dashboard (mock data)
        </p>
      </header>
      <PsiDashboard />
    </div>
  );
}
