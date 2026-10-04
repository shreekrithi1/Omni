import { NextResponse } from "next/server";
import { db, audit } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  const sql = db(); if (!sql) return NextResponse.json({ source: "mock", todos: null });
  const todos = await sql`SELECT id, text, tag, done FROM todos ORDER BY done, created_at DESC`;
  return NextResponse.json({ source: "neon", todos });
}
export async function POST(req) {
  const sql = db(); if (!sql) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 503 });
  const { text, tag = "Inbox" } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
  const [todo] = await sql`INSERT INTO todos (text, tag) VALUES (${text.trim()}, ${tag}) RETURNING id, text, tag, done`;
  await audit("user", "todo.create", text.trim());
  return NextResponse.json({ todo });
}
export async function PATCH(req) {
  const sql = db(); if (!sql) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 503 });
  const { id, done } = await req.json();
  const [todo] = await sql`UPDATE todos SET done = ${!!done} WHERE id = ${id} RETURNING id, text, tag, done`;
  await audit("user", done ? "todo.complete" : "todo.reopen", todo?.text);
  return NextResponse.json({ todo });
}
