"use client";

import clsx from "clsx";
import { hasFutureEndingShortage } from "@/lib/psi-mock-data";

const VIEW_W = 80;
const VIEW_H = 20;
const PAD = 2;

export function EndingInventorySparkline({
  values,
  fromMonthIndex,
  className,
}: {
  values: number[];
  fromMonthIndex: number;
  className?: string;
}) {
  const series = values.slice(fromMonthIndex);
  const shortageRisk = hasFutureEndingShortage(values, fromMonthIndex);

  if (series.length < 2) {
    return null;
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  const polyline = series
    .map((v, i) => {
      const x = PAD + (i / (series.length - 1)) * (VIEW_W - PAD * 2);
      const y = PAD + (1 - (v - min) / range) * (VIEW_H - PAD * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div
      className={clsx("h-5 w-20 shrink-0 overflow-hidden", className)}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
        role="img"
        aria-label={
          shortageRisk
            ? "Ending inventory trend — shortage risk"
            : "Ending inventory trend — stable"
        }
      >
        <polyline
          fill="none"
          points={polyline}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={shortageRisk ? "stroke-red-500" : "stroke-blue-600"}
        />
      </svg>
    </div>
  );
}
