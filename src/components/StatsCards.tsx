import { formatNumber } from "@/lib/format";
import type { InventoryStats } from "@/lib/types";
import { Package, AlertTriangle, XCircle, Layers } from "lucide-react";

export function StatsCards({ stats }: { stats: InventoryStats }) {
  const cards = [
    {
      label: "Total Items",
      value: stats.totalItems,
      icon: Package,
      color: "text-[#396bea]",
      bg: "bg-blue-50",
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Out of Stock",
      value: stats.outOfStockCount,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Product Forms",
      value: Object.keys(stats.byForm).length,
      icon: Layers,
      color: "text-gray-600",
      bg: "bg-gray-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className={`rounded-lg p-3 ${bg}`}>
            <Icon className={color} size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
