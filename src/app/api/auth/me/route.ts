import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session.valid) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  return NextResponse.json<ApiResponse<{ username: string }>>({
    success: true,
    data: { username: session.username! },
  });
}
