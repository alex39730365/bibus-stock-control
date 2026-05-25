import { NextResponse } from "next/server";

/** Public liveness check for Railway / load balancers */
export async function GET() {
  return NextResponse.json({ ok: true });
}
