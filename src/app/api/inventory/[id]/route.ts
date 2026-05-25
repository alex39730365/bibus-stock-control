import { NextRequest, NextResponse } from "next/server";
import { deleteItem, getItemById, upsertItem } from "@/lib/storage";
import type { ApiResponse, InventoryItem } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await getItemById(id);
  if (!item) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  }
  return NextResponse.json<ApiResponse<InventoryItem>>({
    success: true,
    data: item,
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = await getItemById(id);
  if (!existing) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  }

  const body = (await req.json()) as Partial<InventoryItem>;
  const updated: InventoryItem = {
    ...existing,
    ...body,
    id: existing.id,
    quantity: body.quantity !== undefined ? Number(body.quantity) : existing.quantity,
    minStock: body.minStock !== undefined ? Number(body.minStock) : existing.minStock,
    updatedAt: new Date().toISOString(),
  };

  await upsertItem(updated);
  return NextResponse.json<ApiResponse<InventoryItem>>({
    success: true,
    data: updated,
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = await deleteItem(id);
  if (!ok) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Item not found" },
      { status: 404 }
    );
  }
  return NextResponse.json<ApiResponse<void>>({ success: true });
}
