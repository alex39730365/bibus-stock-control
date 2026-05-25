"use client";

import { formatNumber } from "@/lib/format";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 text-sm">
      <span className="text-gray-500">
        Page {page} of {totalPages} · {formatNumber(total)} items
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
