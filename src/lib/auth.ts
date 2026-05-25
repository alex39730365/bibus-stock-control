import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  clearSessionCookieOptions,
  createSessionToken,
  getAdminCredentials,
  sessionCookieOptions,
  verifySessionToken,
} from "./auth-session";

export {
  SESSION_COOKIE,
  clearSessionCookieOptions,
  createSessionToken,
  getAdminCredentials,
  sessionCookieOptions,
  verifySessionToken,
};

export async function getSession(): Promise<{
  valid: boolean;
  username?: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
