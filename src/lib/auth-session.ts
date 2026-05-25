/** Edge-safe session helpers (middleware + API). No next/headers. */

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

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function sign(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(username: string): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${username}:${exp}`;
  return `${payload}:${await sign(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<{ valid: boolean; username?: string }> {
  if (!token) return { valid: false };
  const parts = token.split(":");
  if (parts.length < 3) return { valid: false };
  const sig = parts.pop()!;
  const payload = parts.join(":");
  const expected = await sign(payload);
  if (!timingSafeEqualHex(sig, expected)) return { valid: false };
  const [username, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!username || !exp || Date.now() > exp) return { valid: false };
  return { valid: true, username };
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
