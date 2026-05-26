"use client";

import { useCallback, useEffect, useState } from "react";
import { InventoryTable } from "@/components/InventoryTable";
import { ItemFormModal } from "@/components/ItemFormModal";
import { StockAdjustModal } from "@/components/StockAdjustModal";
import { BulkItemEditModal } from "@/components/BulkItemEditModal";
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
import { formatNumber } from "@/lib/format";
import { PRODUCT_FORMS } from "@/lib/types";
import { REGION_META } from "@/lib/regions";
import { Plus, Search, Download, ArrowLeftRight, Pencil, Trash2 } from "lucide-react";

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
  const [adjustItems, setAdjustItems] = useState<InventoryItem[]>([]);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<string, InventoryItem>>(
    () => new Map()
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setFilter((f) => ({ ...f, search: searchInput }));
      setPage(1);
      setSelectedItems(new Map());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSelectedItems((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Map(prev);
      for (const item of items) {
        if (next.has(item.id)) {
          next.set(item.id, item);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [items]);

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
    setSelectedItems(new Map());
  };

  const clearSelection = () => setSelectedItems(new Map());

  const selectedList = Array.from(selectedItems.values());

  const openStockAdjust = (item?: InventoryItem) => {
    if (selectedItems.size > 0) {
      setAdjustItems(Array.from(selectedItems.values()));
    } else if (item) {
      setAdjustItems([item]);
    }
  };

  const handleBulkDelete = async () => {
    const n = selectedItems.size;
    if (
      !confirm(
        `Delete ${formatNumber(n)} stock item${n === 1 ? "" : "s"} permanently?`
      )
    ) {
      return;
    }
    for (const id of selectedItems.keys()) {
      await deleteItem(id);
    }
    clearSelection();
    await load();
  };

  const openEdit = (item?: InventoryItem) => {
    const selected = Array.from(selectedItems.values());
    if (selectedItems.size > 1) {
      setBulkEditOpen(true);
    } else if (selectedItems.size === 1) {
      setEditItem(selected[0]);
      setModalOpen(true);
    } else if (item) {
      setEditItem(item);
      setModalOpen(true);
    }
  };

  const handleBulkSave = async (
    patch: Partial<Omit<InventoryItem, "id" | "updatedAt">>
  ) => {
    for (const item of selectedList) {
      await updateItem(item.id, patch);
    }
    clearSelection();
    await load();
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
              : `${formatNumber(total)} items · ${regionLabel}`}
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
            setSelectedItems(new Map());
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
            setSelectedItems(new Map());
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="ok">OK</option>
          <option value="low">Low</option>
          <option value="out">Out</option>
        </select>
      </div>

      {selectedItems.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-[#396bea]/30 bg-[#396bea]/5 px-4 py-2 text-sm">
          <span className="font-medium text-[#396bea]">
            {formatNumber(selectedItems.size)} selected
          </span>
          <div className="flex items-center gap-1 border-l border-[#396bea]/20 pl-3">
            <button
              type="button"
              onClick={() => openStockAdjust()}
              className="rounded p-1.5 text-gray-600 hover:bg-green-50 hover:text-green-700"
              title={`Stock in / out (${selectedItems.size})`}
            >
              <ArrowLeftRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => openEdit()}
              className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-[#396bea]"
              title={
                selectedList.length === 1
                  ? "Edit item"
                  : `Bulk edit (${selectedItems.size})`
              }
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="rounded p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600"
              title={`Delete (${selectedItems.size})`}
            >
              <Trash2 size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
          >
            Clear selection
          </button>
        </div>
      )}

      <InventoryTable
        items={items}
        selectedItems={selectedItems}
        onSelectedItemsChange={setSelectedItems}
        onEdit={(item) => openEdit(item)}
        onDelete={handleDelete}
        onAdjust={(item) => openStockAdjust(item)}
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
        open={adjustItems.length > 0}
        items={adjustItems}
        onClose={() => setAdjustItems([])}
        onSuccess={() => {
          if (adjustItems.length > 1) clearSelection();
          load();
        }}
      />

      <BulkItemEditModal
        open={bulkEditOpen}
        items={Array.from(selectedItems.values())}
        onClose={() => setBulkEditOpen(false)}
        onSave={handleBulkSave}
      />
    </div>
  );
}
