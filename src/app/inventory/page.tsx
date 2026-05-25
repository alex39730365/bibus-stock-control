"use client";

import { useCallback, useEffect, useState } from "react";
import { InventoryTable } from "@/components/InventoryTable";
import { ItemFormModal } from "@/components/ItemFormModal";
import { StockAdjustModal } from "@/components/StockAdjustModal";
import { Pagination } from "@/components/Pagination";
import {
  RegionFilter,
  type RegionFilterValue,
} from "@/components/RegionFilter";
import {
  createItem,
  deleteItem,
  fetchInventory,
  fetchStats,
  getExportUrl,
  updateItem,
} from "@/lib/api-client";
import type { InventoryFilter, InventoryItem, Region } from "@/lib/types";
import { PRODUCT_FORMS } from "@/lib/types";
import { REGION_META } from "@/lib/regions";
import { Plus, Search, Download } from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<InventoryFilter>({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [regionCounts, setRegionCounts] = useState<Partial<Record<Region, number>>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilter((f) => ({ ...f, search: searchInput }));
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, statsRes] = await Promise.all([
      fetchInventory({ ...filter, page, limit: 50 }),
      fetchStats(),
    ]);
    if (res.success && res.data) {
      setItems(res.data);
      setTotal(res.meta?.total ?? res.data.length);
      setTotalPages(res.meta?.totalPages ?? 1);
    }
    if (statsRes.success && statsRes.data) {
      setRegionCounts(statsRes.data.byRegion);
    }
    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setRegion = (region: RegionFilterValue) => {
    setFilter((f) => ({ ...f, region }));
    setPage(1);
  };

  const handleSave = async (
    data: Omit<InventoryItem, "id" | "updatedAt">
  ) => {
    if (editItem) {
      await updateItem(editItem.id, data);
    } else {
      await createItem({
        ...data,
        region: data.region || filter.region || "BMAG",
      });
    }
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this stock item permanently?")) return;
    await deleteItem(id);
    await load();
  };

  const regionLabel = filter.region
    ? `${REGION_META[filter.region].label} (${REGION_META[filter.region].country})`
    : "All regions";

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Items</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? "Loading…"
              : `${total.toLocaleString()} items · ${regionLabel}`}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={getExportUrl(filter.region || undefined)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            <Download size={16} />
            Export
          </a>
          <button
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-[#396bea] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a52b8]"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </header>

      <div className="mb-4">
        <RegionFilter
          value={filter.region ?? ""}
          onChange={setRegion}
          counts={regionCounts}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            placeholder="Search article no., material, location…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#396bea] focus:outline-none focus:ring-1 focus:ring-[#396bea]"
          />
        </div>
        <select
          value={filter.productForm ?? ""}
          onChange={(e) => {
            setFilter({
              ...filter,
              productForm: e.target.value as InventoryFilter["productForm"],
            });
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All forms</option>
          {PRODUCT_FORMS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={filter.status ?? ""}
          onChange={(e) => {
            setFilter({
              ...filter,
              status: e.target.value as InventoryFilter["status"],
            });
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ok">OK</option>
          <option value="low">Low</option>
          <option value="out">Out</option>
        </select>
      </div>

      <InventoryTable
        items={items}
        onEdit={(item) => {
          setEditItem(item);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
        onAdjust={(item) => setAdjustItem(item)}
      />

      {!loading && totalPages > 1 && (
        <div className="mt-0 overflow-hidden rounded-b-xl">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </div>
      )}

      <ItemFormModal
        open={modalOpen}
        item={editItem}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        onSave={handleSave}
      />

      <StockAdjustModal
        open={!!adjustItem}
        item={adjustItem}
        onClose={() => setAdjustItem(null)}
        onSuccess={load}
      />
    </div>
  );
}
