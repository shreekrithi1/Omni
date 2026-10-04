import { NextResponse } from "next/server";
import * as m from "@/lib/mock";
import { getSecret, getSettings } from "@/lib/secrets";

// Mock "Mastra orchestrator" — routes intent to a sub-agent and answers from mock state.
export const dynamic = "force-dynamic";

// Live mode: forward to the deployed Mastra agent (Olivia). Falls back to demo replies if not configured or unreachable.
async function askOlivia(message) {
  const s = getSettings(); const token = getSecret("mastra");
  if (!s.useLive || !s.mastraUrl || !token) return null;
  const r = await fetch(`${s.mastraUrl}/api/agents/${encodeURIComponent(s.agentId || "olivia")}/generate`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages: [{ role: "user", content: message.slice(0, 4000) }] }), signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) throw new Error(`Olivia returned ${r.status}`);
  const j = await r.json();
  return { agent: s.displayName || "Olivia", reply: j.text ?? j.response?.text ?? JSON.stringify(j).slice(0, 2000), live: true };
}

export async function POST(req) {
  const { message = "" } = await req.json();
  try { const live = await askOlivia(String(message)); if (live) return NextResponse.json(live); }
  catch (e) { return NextResponse.json({ agent: "Olivia", reply: `I couldn't reach your live agents (${e.message}). Check Settings → Olivia.`, live: false }); }
  const q = message.toLowerCase();
  const nw = m.accounts.reduce((s, a) => s + a.balance, 0);
  let agent = "Orchestrator", reply;
  if (/net ?worth|money|finance|balance/.test(q)) {
    agent = "Finance Auditor";
    reply = `Your net worth is $${Math.round(nw).toLocaleString()}, up 1.9% this month. Cash flow velocity is ${m.cashFlow.velocity}x. Credit score ${m.creditScore.score} (+${m.creditScore.change}).`;
  } else if (/bill|pay/.test(q)) {
    agent = "Finance Auditor";
    reply = `5 bills this cycle. PG&E ($214.37) is flagged — 38% above average. State Farm ($1,286) is waiting for your approval. Everything else is scheduled.`;
  } else if (/family|calendar|school|kid|schedule/.test(q)) {
    agent = "Family Logistics";
    reply = `One conflict Tuesday 3:30pm: Aarav's soccer vs your dentist. I propose moving the dentist to Thu 2:00pm — it's in your approvals. Maya's field-trip slip needs a signature by 10/6.`;
  } else if (/health|sleep|hrv|vital/.test(q)) {
    agent = "Health Coach";
    reply = `Vitality index is ${m.health.vitality}/100. Sleep 7h12m, HRV 54ms. ${m.health.recs[0]}`;
  } else if (/insurance|research|find|buy/.test(q)) {
    agent = "Research & Procurement";
    reply = `I'm comparing auto insurance via Exa and have a Kernel sandbox filling a GEICO quote. Early estimate: ~$180/yr savings vs State Farm.`;
  } else {
    reply = `Morning brief: 3 approvals pending, 1 bill anomaly, 1 calendar conflict, vitality ${m.health.vitality}. Ask me about finances, bills, family, health, or research.`;
  }
  await new Promise((r) => setTimeout(r, 400));
  return NextResponse.json({ agent, reply });
}
