import { NextResponse } from "next/server";
import * as m from "@/lib/mock";

// Mock "Mastra orchestrator" — routes intent to a sub-agent and answers from mock state.
export async function POST(req) {
  const { message = "" } = await req.json();
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
