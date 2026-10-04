import { NextResponse } from "next/server";
// Settings endpoints are admin-only: same-origin requests from localhost, or a matching OMNI_ADMIN_TOKEN header.
export function adminOnly(req) {
  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== host) return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const admin = process.env.OMNI_ADMIN_TOKEN;
  if (admin ? req.headers.get("x-omni-admin") !== admin : !local) return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  return null;
}
