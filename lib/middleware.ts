import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isMobileDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();

  return (
    /android|iphone|ipod|ipad|blackberry|iemobile|opera mini|mobile/.test(ua) &&
    !/windows nt|macintosh|x11|linux x86_64/.test(ua)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";

  const publicFiles =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico";

  if (publicFiles) {
    return NextResponse.next();
  }

  if (pathname === "/desktop-blocked") {
    return NextResponse.next();
  }

  const isMobile = isMobileDevice(userAgent);

  if (!isMobile) {
    return NextResponse.redirect(new URL("/desktop-blocked", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};