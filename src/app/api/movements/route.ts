import { NextRequest, NextResponse } from "next/server";
import { readMovements, recordMovement } from "@/lib/movements";
import { getSession } from "@/lib/auth";
import type { ApiResponse, MovementType, StockMovement } from "@/lib/types";

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 100), 200);
  const itemId = req.nextUrl.searchParams.get("itemId");
  let items = await readMovements();
  if (itemId) items = items.filter((m) => m.itemId === itemId);
  return NextResponse.json<ApiResponse<StockMovement[]>>({
    success: true,
    data: items.slice(0, limit),
    meta: { total: items.length },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.valid) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as {
      itemId?: string;
      type?: MovementType;
      quantity?: number;
      reason?: string;
    };

    if (!body.itemId || !body.type) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "itemId and type are required" },
        { status: 400 }
      );
    }

    const qty = Number(body.quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Invalid quantity" },
        { status: 400 }
      );
    }

    if (body.type !== "adjust" && qty <= 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    const result = await recordMovement({
      itemId: body.itemId,
      type: body.type,
      quantity: qty,
      reason: body.reason ?? "",
      operator: session.username ?? "admin",
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Movement failed";
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
