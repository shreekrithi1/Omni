import { NextResponse } from "next/server";
import { getSecret, getUrl, recordTest, getSettings, getPersonaId } from "@/lib/secrets";
import { TESTERS } from "@/lib/testers";
import { adminOnly } from "@/lib/guard";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const denied = adminOnly(req); if (denied) return denied;
  const { id } = await req.json();
  const token = getSecret(id);
  if (!token) return NextResponse.json({ ok: false, detail: "No token saved" });
  const url = id === "mastra" ? getSettings().mastraUrl : id === "anam" ? getPersonaId(id) : getUrl(id);
  let result;
  try { result = await TESTERS[id](token, url); } catch (e) { result = { ok: false, detail: String(e.message || e).replace(token, "••••") }; }
  recordTest(id, result);
  return NextResponse.json(result);
}
