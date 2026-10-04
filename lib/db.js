import { neon } from "@neondatabase/serverless";
import { getSecret } from "./secrets";

// Returns a Neon SQL client, or null when DATABASE_URL isn't set (app falls back to mock data).
let client, clientUrl;
export function db() {
  const url = getSecret("neon"); // Settings → Connectors, or DATABASE_URL
  if (!url) return null;
  if (!client || clientUrl !== url) { client = neon(url); clientUrl = url; }
  return client;
}
export async function audit(actor, action, target, detail = null) {
  const sql = db(); if (!sql) return;
  await sql`INSERT INTO audit_log (actor, action, target, detail) VALUES (${actor}, ${action}, ${target}, ${detail ? JSON.stringify(detail) : null})`;
}
