import { NextRequest, NextResponse } from "next/server";

/**
 * Basic-auth gate for the dashboard UI.
 *
 * The pages are server components that render agent state, missions, costs, etc.
 * straight into HTML, so without this anyone with the URL can read the whole
 * fleet. This locks the UI behind HTTP Basic Auth.
 *
 * API routes are NOT gated here (see `config.matcher` below) — they manage their
 * own auth: `/api/agents/state` requires `Authorization: Bearer <INTERNAL_API_SECRET>`
 * for both GET and POST, and `/api/health` stays open for uptime monitors.
 *
 * If DASHBOARD_USER / DASHBOARD_PASS are unset, the gate is a no-op so local
 * `npm run dev` isn't locked out.
 */
export function middleware(req: NextRequest) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASS;

  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    // Edge runtime has no Node Buffer; atob is the Web API for base64 decode.
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    const idx = decoded.indexOf(":");
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (idx !== -1 && u === user && p === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Hermes Mission Control"' },
  });
}

export const config = {
  // Gate everything except API routes and Next internals/static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
