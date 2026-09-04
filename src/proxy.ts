import { NextRequest, NextResponse } from "next/server";
// Preserve the original form URLs; authorization also runs inside every handler.
export function proxy(request: NextRequest) {
  if (request.method === "POST") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/forms" + url.pathname;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*", "/login", "/logout"] };
