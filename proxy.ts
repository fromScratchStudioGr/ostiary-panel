import { NextResponse } from "next/server";
import { getAdminApiUrl } from "@/app/lib/admin-api-url";

const isDev = process.env.NODE_ENV === "development";

// Built per request rather than in next.config.ts, whose headers are fixed at
// build time - connect-src has to follow ADMIN_API_URL as set when the
// container starts.
function buildCsp(): string {
  return `
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self' data:;
    connect-src 'self' ${getAdminApiUrl()};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDev ? "" : "upgrade-insecure-requests;"}
  `
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function proxy() {
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", buildCsp());
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
