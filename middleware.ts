// middleware.ts
// فرض HTTPS + رؤوس أمان (HSTS, CSP, X-Frame-Options...) على كل الطلبات

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto");

  // إعادة توجيه إجبارية إلى HTTPS في بيئة الإنتاج
  if (process.env.NODE_ENV === "production" && proto === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();

  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';"
  );
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: "/:path*",
};
