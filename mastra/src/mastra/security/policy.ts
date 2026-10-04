import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { neon } from "@neondatabase/serverless";

// ---- SSRF protection for any agent-supplied URL ------------------------------------------
const PRIVATE = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^::1$/, /^fc/i, /^fd/i, /^fe80/i, /^::ffff:(10|127|169\.254|192\.168)\./i];
export async function assertSafeUrl(raw: string) {
  const u = new URL(raw);
  if (u.protocol !== "https:") throw new Error("Blocked: only https:// URLs are allowed.");
  if (u.username || u.password) throw new Error("Blocked: credentials in URL.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|metadata\.google\.internal)$/i.test(host) || host.endsWith(".internal") || host.endsWith(".local")) throw new Error("Blocked: internal host.");
  const addrs = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (addrs.some((a) => PRIVATE.some((r) => r.test(a)))) throw new Error("Blocked: resolves to a private/internal address.");
  return u;
}

// ---- Enforced human-in-the-loop -----------------------------------------------------------
// Sensitive tools require an approval row that a HUMAN approved (status='approved') and that hasn't been used.
export async function requireApproval(approvalId: string | undefined, action: string) {
  if (!approvalId) throw new Error(`"${action}" needs human approval. Create one with neon-create-approval and wait for the user to approve it.`);
  if (!process.env.DATABASE_URL) throw new Error("Approvals need DATABASE_URL.");
  const sql = neon(process.env.DATABASE_URL);
  await sql`ALTER TABLE approvals ADD COLUMN IF NOT EXISTS consumed_at timestamptz`;
  const rows = await sql`UPDATE approvals SET consumed_at = now() WHERE id = ${approvalId} AND status = 'approved' AND consumed_at IS NULL RETURNING id, title`;
  if (!rows.length) throw new Error(`Approval ${approvalId} is not approved by the user, or was already used.`);
  return rows[0];
}

// Redact anything secret-looking before it is logged.
export function redact(v: unknown): unknown {
  const s = JSON.stringify(v ?? null);
  return JSON.parse(s.replace(/("(?:[^"]*(?:key|token|secret|password|authorization|cookie)[^"]*)"\s*:\s*)"[^"]*"/gi, '$1"[REDACTED]"')
    .replace(/\b(sk|pk|rk|xox[abp]|ghp|gho|AKIA)[-_A-Za-z0-9]{12,}\b/g, "[REDACTED]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]").replace(/\b(?:\d[ -]?){13,19}\b/g, "[CARD]"));
}
