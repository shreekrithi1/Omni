import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { requireEnv } from "./http";

const sql = () => neon(requireEnv("DATABASE_URL"));
// Least privilege: point DATABASE_URL_READONLY at a Neon role with SELECT-only grants.
const ro = () => neon(process.env.DATABASE_URL_READONLY || requireEnv("DATABASE_URL"));

export const neonQuery = createTool({
  id: "neon-query",
  description: "Run a READ-ONLY SQL SELECT against the OmniControl Neon database. Tables: accounts, net_worth_history, budgets, bills, events, todos, tasks, approvals, health_metrics, agent_identities, interests, audit_log, family_members.",
  inputSchema: z.object({ query: z.string().describe("A single SELECT statement") }),
  execute: async ({ query }) => {
    const q = query.trim().replace(/;+\s*$/, "");
    if (!/^(select|with)\b/i.test(q) || /;/.test(q) || /\b(insert|update|delete|drop|alter|truncate|grant|create)\b/i.test(q))
      throw new Error("Only single read-only SELECT queries are allowed.");
    if (/\b(pg_|information_schema|custom_integrations|current_setting|set_config|dblink|lo_)/i.test(q)) throw new Error("Blocked: system objects are not queryable.");
    const rows = await ro().query(`SELECT * FROM (${q}) AS t LIMIT 200`);
    return { rows };
  },
});

export const neonAudit = createTool({
  id: "neon-audit-log",
  description: "Write an entry to the audit log. Call after any action an agent takes.",
  inputSchema: z.object({ actor: z.string(), action: z.string(), target: z.string().optional(), detail: z.record(z.any()).optional() }),
  execute: async ({ actor, action, target, detail }) => {
    await sql()`INSERT INTO audit_log (actor, action, target, detail) VALUES (${actor}, ${action}, ${target ?? null}, ${detail ? JSON.stringify(detail) : null})`;
    return { ok: true };
  },
});

export const neonCreateApproval = createTool({
  id: "neon-create-approval",
  description: "Queue a human-in-the-loop approval (payments over threshold, calendar changes, disputes). Never execute these directly.",
  inputSchema: z.object({ kind: z.string(), title: z.string(), agent: z.string(), reason: z.string() }),
  execute: async ({ kind, title, agent, reason }) => {
    const id = "a" + Date.now().toString(36);
    await sql()`INSERT INTO approvals (id, kind, title, agent, reason) VALUES (${id}, ${kind}, ${title}, ${agent}, ${reason})`;
    return { id, status: "pending" };
  },
});

export const neonAddTodo = createTool({
  id: "neon-add-todo",
  description: "Add a to-do for the user.",
  inputSchema: z.object({ text: z.string(), tag: z.string().default("Inbox") }),
  execute: async ({ text, tag }) => {
    const [row] = await sql()`INSERT INTO todos (text, tag) VALUES (${text}, ${tag}) RETURNING id`;
    return { id: row.id };
  },
});
