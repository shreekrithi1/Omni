import { NextResponse } from "next/server";
import { db, audit } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db(); if (!sql) return NextResponse.json({ source: "mock", approvals: null });
  return NextResponse.json({ source: "neon", approvals: await sql`SELECT id, kind, title, agent, reason FROM approvals WHERE status = 'pending' ORDER BY id` });
}
// Human-in-the-loop decision: { id, approve: true|false }
export async function POST(req) {
  const sql = db(); if (!sql) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 503 });
  const { id, approve } = await req.json();
  const [row] = await sql`UPDATE approvals SET status = ${approve ? "approved" : "denied"}, decided_at = now() WHERE id = ${id} AND status = 'pending' RETURNING id, title`;
  if (!row) return NextResponse.json({ error: "Not found or already decided" }, { status: 404 });
  await audit("user", approve ? "approval.approve" : "approval.deny", row.title, { id });
  return NextResponse.json({ ok: true, approval: row });
}
