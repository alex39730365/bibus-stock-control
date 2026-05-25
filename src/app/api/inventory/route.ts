import { NextRequest, NextResponse } from "next/server";
import { readInventory } from "@/lib/storage";
import { generateId, upsertItem } from "@/lib/storage";
import type { ApiResponse, InventoryItem, ProductForm, Region } from "@/lib/types";
import { getStockStatus } from "@/lib/types";
import { resolveRegion } from "@/lib/regions";

function filterItems(
  items: InventoryItem[],
  params: URLSearchParams
): InventoryItem[] {
  const search = params.get("search")?.toLowerCase();
  const region = params.get("region") as Region | null;
  const productForm = params.get("productForm") as ProductForm | null;
  const location = params.get("location")?.toLowerCase();
  const status = params.get("status");

  return items.filter((item) => {
    if (region && resolveRegion(item) !== region) return false;
    if (search) {
      const hay = [
        item.articleNo,
        item.material,
        item.alloy,
        item.dimensions,
        item.location,
        item.supplier,
        item.notes,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search)) return false;
    }
    if (productForm && item.productForm !== productForm) return false;
    if (location && !item.location.toLowerCase().includes(location))
      return false;
    if (status === "alert") {
      const s = getStockStatus(item);
      if (s !== "low" && s !== "out") return false;
    } else if (status && getStockStatus(item) !== status) return false;
    return true;
  });
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(10, parseInt(params.get("limit") || "50", 10))
    );

    const items = await readInventory();
    const filtered = filterItems(items, params);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    const res: ApiResponse<InventoryItem[]> = {
      success: true,
      data: paged,
      meta: { total, page, limit, totalPages },
    };
    return NextResponse.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Omit<InventoryItem, "id" | "updatedAt">;
    if (!body.articleNo) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "articleNo is required" },
        { status: 400 }
      );
    }

    const item: InventoryItem = {
      ...body,
      region: body.region ?? "BMAG",
      id: generateId(),
      quantity: Number(body.quantity) || 0,
      minStock: Number(body.minStock) || 0,
      updatedAt: new Date().toISOString(),
    };

    await upsertItem(item);
    return NextResponse.json<ApiResponse<InventoryItem>>(
      { success: true, data: item },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
