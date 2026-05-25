import { NextResponse } from "next/server";
import { clearSessionCookieOptions } from "@/lib/auth-session";
import type { ApiResponse } from "@/lib/types";

export async function POST() {
  const res = NextResponse.json<ApiResponse<void>>({ success: true });
  res.cookies.set(clearSessionCookieOptions());
  return res;
}
