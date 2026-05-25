"use client";

import { useCallback, useState } from "react";
import { importExcel } from "@/lib/api-client";
import type { ImportResult } from "@/lib/types";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onSuccess?: () => void;
}

export function ExcelUploader({ onSuccess }: Props) {
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.xlsx?$/i)) {
        setError("Only .xlsx or .xls files are supported.");
        return;
      }
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await importExcel(file, mode);
        if (!res.success) {
          setError(res.error ?? "Import failed");
          if (res.data) setResult(res.data);
        } else {
          setResult(res.data ?? null);
          onSuccess?.();
        }
      } catch {
        setError("A network error occurred.");
      } finally {
        setLoading(false);
      }
    },
    [mode, onSuccess]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "merge"}
            onChange={() => setMode("merge")}
            className="accent-[#396bea]"
          />
          <span className="text-sm">
            <strong>Merge</strong> — update existing article numbers, add new ones
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === "replace"}
            onChange={() => setMode("replace")}
            className="accent-[#396bea]"
          />
          <span className="text-sm">
            <strong>Replace all</strong> — delete existing data and import fresh
          </span>
        </label>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
          dragging
            ? "border-[#396bea] bg-blue-50"
            : "border-gray-300 bg-white"
        }`}
      >
        <FileSpreadsheet
          className="mb-3 text-[#396bea]"
          size={40}
          strokeWidth={1.5}
        />
        <p className="mb-1 text-sm font-medium text-gray-700">
          Drag and drop an Excel file, or choose one
        </p>
        <p className="mb-4 text-xs text-gray-400">
          .xlsx · articleNo column required
        </p>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#396bea] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a52b8]">
          <Upload size={16} />
          {loading ? "Processing…" : "Choose file"}
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Import complete</p>
            <p>
              {result.imported} new · {result.updated} updated · {result.skipped}{" "}
              skipped
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-disc pl-4 text-xs text-amber-700">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>…and {result.errors.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
