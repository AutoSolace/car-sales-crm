import { createHmac, timingSafeEqual } from "node:crypto";

// Single shared password gate. The password lives only in the APP_PASSWORD
// env var (never in the repo, which is public); the cookie holds an HMAC
// derived from it, so changing APP_PASSWORD signs everyone out.
export const AUTH_COOKIE = "crm_auth";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function appPassword(): string | null {
  return process.env.APP_PASSWORD || null;
}

export function isAuthEnabled(): boolean {
  return appPassword() !== null;
}

export function sessionToken(): string | null {
  const password = appPassword();
  if (!password) return null;
  return createHmac("sha256", password).update("autosolace-crm-session").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function isValidSession(cookieValue: string | undefined): boolean {
  const expected = sessionToken();
  return !!expected && !!cookieValue && safeEqual(cookieValue, expected);
}

export function isCorrectPassword(attempt: string): boolean {
  const password = appPassword();
  return !!password && safeEqual(attempt, password);
}

// Only allow same-site relative paths as a post-login destination.
export function safeNextPath(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/";
}
