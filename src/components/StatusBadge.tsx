import type { StockStatus } from "@/lib/types";
import clsx from "clsx";

const config: Record<StockStatus, { label: string; className: string }> = {
  ok: { label: "OK", className: "bg-green-100 text-green-800" },
  low: { label: "Low", className: "bg-amber-100 text-amber-800" },
  out: { label: "Out", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status }: { status: StockStatus }) {
  const { label, className } = config[status];
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
