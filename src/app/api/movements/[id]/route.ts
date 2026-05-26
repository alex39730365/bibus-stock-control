import { NextRequest, NextResponse } from "next/server";
import { cancelMovement } from "@/lib/movements";
import { getSession } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types";
import type { InventoryItem, StockMovement } from "@/lib/types";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.valid) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const result = await cancelMovement(id, session.username ?? "admin");
    return NextResponse.json<
      ApiResponse<{ item: InventoryItem; movement: StockMovement }>
    >({
      success: true,
      data: result,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cancel failed";
    const status = msg.includes("not found") ? 404 : 400;
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: msg },
      { status }
    );
  }
}
