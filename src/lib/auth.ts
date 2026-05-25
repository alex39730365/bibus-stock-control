import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "scp_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

function getSecret(): string {
  return process.env.ADMIN_SECRET || "bibus-stock-control-dev-secret";
}

export function getAdminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(username: string): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${username}:${exp}`;
  return `${payload}:${sign(payload)}`;
}

export function verifySessionToken(
  token: string | undefined
): { valid: boolean; username?: string } {
  if (!token) return { valid: false };
  const parts = token.split(":");
  if (parts.length < 3) return { valid: false };
  const sig = parts.pop()!;
  const payload = parts.join(":");
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false };
  const [username, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!username || !exp || Date.now() > exp) return { valid: false };
  return { valid: true, username };
}

export async function getSession(): Promise<{
  valid: boolean;
  username?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
