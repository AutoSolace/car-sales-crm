import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, isAuthEnabled, isValidSession } from "@/lib/auth/session";

// Paths reachable without the password. The cron endpoint has its own
// CRON_SECRET bearer check.
const PUBLIC_PATHS = ["/login", "/api/cron/"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!isAuthEnabled()) {
    // Fail closed in production so a missing env var never exposes the app;
    // stay open locally so `npm run dev` works without extra setup.
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("APP_PASSWORD is not configured.", { status: 503 });
    }
    return NextResponse.next();
  }

  if (isValidSession(request.cookies.get(AUTH_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (request.method !== "GET" || pathname.startsWith("/api/")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
