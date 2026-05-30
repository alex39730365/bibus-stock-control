"use client";

import { ExcelUploader } from "@/components/ExcelUploader";
import { getTemplateUrl } from "@/lib/api-client";
import { Download, Info } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bulk upload — centralization (BMAG/BMCN), BMKR Ordering Status, or
          standard Excel template
        </p>
      </header>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <Info className="mt-0.5 shrink-0 text-[#396bea]" size={18} />
        <div>
          <p className="font-medium">Supported columns</p>
          <p className="mt-1 text-blue-700">
            articleNo* (required), material, alloy, productForm, dimensions,
            quantity, unit, location, minStock, supplier, notes
          </p>
          <a
            href={getTemplateUrl()}
            className="mt-3 inline-flex items-center gap-1.5 font-medium text-[#396bea] hover:underline"
          >
            <Download size={14} />
            Download sample template (.xlsx)
          </a>
        </div>
      </div>

      <ExcelUploader />
    </div>
  );
}
