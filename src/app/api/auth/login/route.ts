import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminCredentials,
  sessionCookieOptions,
} from "@/lib/auth";
import type { ApiResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = (await req.json()) as {
      username?: string;
      password?: string;
    };
    const creds = getAdminCredentials();

    if (username !== creds.username || password !== creds.password) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);
    const res = NextResponse.json<ApiResponse<{ username: string }>>({
      success: true,
      data: { username },
    });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
