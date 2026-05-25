import { NextRequest, NextResponse } from "next/server";
import { computeStats, readInventory } from "@/lib/storage";
import type { ApiResponse, InventoryStats, Region } from "@/lib/types";
import { resolveRegion } from "@/lib/regions";

export async function GET(req: NextRequest) {
  try {
    let items = await readInventory();
    const region = req.nextUrl.searchParams.get("region") as Region | null;
    if (region) {
      items = items.filter((i) => resolveRegion(i) === region);
    }
    const stats = computeStats(items);
    return NextResponse.json<ApiResponse<InventoryStats>>({
      success: true,
      data: stats,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
