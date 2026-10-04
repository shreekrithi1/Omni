import { NextResponse } from "next/server";
import { getSecret, getPersonaId } from "@/lib/secrets";
export const dynamic = "force-dynamic";

// Exchanges the server-side Anam API key for a short-lived session token. The API key never reaches the browser.
export async function POST(req) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  const key = getSecret("anam"); const personaId = getPersonaId("anam");
  if (!key || !personaId) return NextResponse.json({ error: "Add your Anam API key and Persona ID in Settings → Connectors" }, { status: 400 });
  const r = await fetch("https://api.anam.ai/v1/auth/session-token", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ personaConfig: { personaId } }), signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.sessionToken) return NextResponse.json({ error: `Anam: ${j.message || j.error || r.status}` }, { status: 502 });
  return NextResponse.json({ sessionToken: j.sessionToken });
}
