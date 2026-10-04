import { NextResponse } from "next/server";
import { CONNECTORS, byId } from "@/lib/connectors";
import { saveSecret, deleteSecret, status } from "@/lib/secrets";
import { adminOnly } from "@/lib/guard";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const denied = adminOnly(req); if (denied) return denied;
  return NextResponse.json({ connectors: CONNECTORS.map((c) => ({ ...c, status: status(c.id) })) });
}
export async function POST(req) {
  const denied = adminOnly(req); if (denied) return denied;
  const { id, value, url } = await req.json();
  const c = byId(id); if (!c) return NextResponse.json({ error: "Unknown connector" }, { status: 400 });
  const v = (value || "").trim();
  if (v.length < 8 || v.length > 4096 || /\s/.test(v)) return NextResponse.json({ error: "That doesn't look like a valid token" }, { status: 400 });
  if (url && !/^https:\/\//.test(url) && !/^http:\/\/localhost(:\d+)?/.test(url)) return NextResponse.json({ error: "URL must be https://" }, { status: 400 });
  saveSecret(id, v, { url });
  return NextResponse.json({ ok: true, status: status(id) });
}
export async function DELETE(req) {
  const denied = adminOnly(req); if (denied) return denied;
  const { id } = await req.json(); deleteSecret(id);
  return NextResponse.json({ ok: true, status: status(id) });
}
