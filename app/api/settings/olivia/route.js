import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/secrets";
import { adminOnly } from "@/lib/guard";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const denied = adminOnly(req); if (denied) return denied;
  return NextResponse.json(getSettings());
}
export async function POST(req) {
  const denied = adminOnly(req); if (denied) return denied;
  const b = await req.json();
  const s = {};
  if (typeof b.mastraUrl === "string") { const u = b.mastraUrl.trim().replace(/\/$/, ""); if (u && !/^https:\/\//.test(u) && !/^http:\/\/localhost(:\d+)?$/.test(u)) return NextResponse.json({ error: "Use an https:// URL (or http://localhost:4111 for local)" }, { status: 400 }); s.mastraUrl = u; }
  if (typeof b.agentId === "string") s.agentId = b.agentId.replace(/[^a-z0-9-]/gi, "").slice(0, 60) || "olivia";
  if (typeof b.useLive === "boolean") s.useLive = b.useLive;
  if (typeof b.displayName === "string") s.displayName = b.displayName.slice(0, 40);
  saveSettings(s);
  return NextResponse.json(getSettings());
}
