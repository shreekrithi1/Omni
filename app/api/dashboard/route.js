import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as m from "@/lib/mock";
export const dynamic = "force-dynamic";

// One call for the whole control room. Reads Neon when configured, otherwise mock data.
export async function GET() {
  const sql = db();
  if (!sql) return NextResponse.json({ source: "mock", accounts: m.accounts, bills: m.bills, budget: m.budget, approvals: m.approvals, agents: m.agents, auditLog: m.auditLog });
  const [accounts, history, bills, budget, approvals, agents, events, tasks, auditLog] = await Promise.all([
    sql`SELECT id, name, type, balance::float AS balance FROM accounts ORDER BY id`,
    sql`SELECT month, value::float AS value FROM net_worth_history ORDER BY month`,
    sql`SELECT id, payee, amount::float AS amount, to_char(due_date,'YYYY-MM-DD') AS due, status, note, source FROM bills ORDER BY due_date`,
    sql`SELECT category AS cat, spent::float AS spent, monthly_limit::float AS limit FROM budgets`,
    sql`SELECT id, kind, title, agent, reason FROM approvals WHERE status='pending' ORDER BY id`,
    sql`SELECT name, inbox, runtime, status, task FROM agent_identities`,
    sql`SELECT id, title, who, starts_at, ends_at, calendar, color, conflict FROM events WHERE starts_at::date = current_date ORDER BY starts_at`,
    sql`SELECT id, title, (due_date - current_date) AS due, priority AS prio, area FROM tasks WHERE NOT done ORDER BY due_date`,
    sql`SELECT to_char(at,'HH24:MI') AS t, actor, action, target FROM audit_log ORDER BY at DESC LIMIT 20`,
  ]);
  const netWorth = accounts.reduce((s, a) => s + a.balance, 0);
  return NextResponse.json({ source: "neon", netWorth, accounts, history, bills, budget, approvals, agents, events, tasks, auditLog });
}
