import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Browser calls to /api/v1 are rewritten to the backend (next.config.ts). The
// backend cannot trust X-Forwarded-For (anyone can send it), so we pass the
// customer's IP in X-Client-IP signed with a shared secret it can verify.
//
// TRUSTED_PROXY_HOPS = number of reverse proxies in front of this Next.js server
// (nginx = 1, Cloudflare + nginx = 2). Each one appends to X-Forwarded-For, so
// the real client is that many entries from the right; anything further left
// was sent by the browser and may be fake.
function clientIp(request: NextRequest): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS || 1));
  const chain = (request.headers.get("x-forwarded-for") || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  return chain[Math.max(0, chain.length - hops)] || "";
}

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Never forward these from the browser.
  headers.delete("x-client-ip");
  headers.delete("x-proxy-secret");

  const secret = process.env.PROXY_SECRET;
  const ip = clientIp(request);
  if (secret && ip) {
    headers.set("x-client-ip", ip);
    headers.set("x-proxy-secret", secret);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: "/api/v1/:path*",
};
