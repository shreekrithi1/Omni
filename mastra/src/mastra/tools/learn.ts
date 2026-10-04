import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { MCPClient } from "@mastra/mcp";
import { requireEnv } from "./http";
import { BUILT_IN_INTEGRATIONS } from "../integrations";
import { assertSafeUrl, requireApproval } from "../security/policy";
import { untrusted } from "../security/guardrails";

// ---- Auto-learned integrations ----------------------------------------------------------
// A learned integration is a JSON spec stored in Neon. Two kinds:
//   http: { baseUrl, auth: {type:"bearer"|"header"|"query"|"none", envKey, headerName?, queryParam?}, endpoints:[{name, method, path, description}] }
//   mcp:  { url, envKey? }  → its tools are discovered automatically
// Secrets are NEVER stored: specs reference an env var name that the user adds in Mastra Cloud.
const sql = () => neon(requireEnv("DATABASE_URL"));
const ensure = async () => sql().query(`CREATE TABLE IF NOT EXISTS custom_integrations (id text PRIMARY KEY, name text NOT NULL, kind text NOT NULL CHECK (kind IN ('http','mcp')), spec jsonb NOT NULL, docs_url text, status text NOT NULL DEFAULT 'draft', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`);

const endpoint = z.object({ name: z.string(), method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]), path: z.string().describe("e.g. /v1/items/{id}"), description: z.string() });
const httpSpec = z.object({
  baseUrl: z.string().url(),
  auth: z.object({ type: z.enum(["bearer", "header", "query", "none"]), envKey: z.string().optional(), headerName: z.string().optional(), queryParam: z.string().optional() }),
  endpoints: z.array(endpoint).min(1),
});
const mcpSpec = z.object({ url: z.string().url(), envKey: z.string().optional() });

export const listIntegrations = createTool({
  id: "list-integrations",
  description: "List all integrations: built-in ones and ones learned at runtime, with whether their keys are configured.",
  inputSchema: z.object({}),
  execute: async () => {
    const builtIn = BUILT_IN_INTEGRATIONS.map((i) => ({ ...i, configured: i.envKeys.every((k) => !!process.env[k]) }));
    let learned: any[] = [];
    if (process.env.DATABASE_URL) { await ensure(); learned = await sql()`SELECT id, name, kind, status, docs_url, spec FROM custom_integrations ORDER BY created_at`; }
    return { builtIn, learned: learned.map((l) => ({ ...l, configured: !l.spec?.auth?.envKey && !l.spec?.envKey ? true : !!process.env[l.spec.auth?.envKey || l.spec.envKey] })) };
  },
});

export const registerIntegration = createTool({
  id: "register-integration",
  description: "Save a newly learned integration spec (from reading its API docs). Use kind 'mcp' when the service offers an MCP server, else 'http'. Status starts as 'draft' until tested.",
  inputSchema: z.object({ id: z.string().regex(/^[a-z0-9-]+$/), name: z.string(), kind: z.enum(["http", "mcp"]), docsUrl: z.string().url().optional(), spec: z.union([httpSpec, mcpSpec]) }),
  execute: async ({ id, name, kind, docsUrl, spec }) => {
    (kind === "http" ? httpSpec : mcpSpec).parse(spec);
    await assertSafeUrl((spec as any).baseUrl || (spec as any).url);
    await ensure();
    await sql()`INSERT INTO custom_integrations (id, name, kind, spec, docs_url) VALUES (${id}, ${name}, ${kind}, ${JSON.stringify(spec)}, ${docsUrl ?? null})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind, spec = EXCLUDED.spec, docs_url = EXCLUDED.docs_url, status = 'draft', updated_at = now()`;
    const envKey = (spec as any).auth?.envKey || (spec as any).envKey;
    return { saved: id, status: "draft", nextStep: envKey && !process.env[envKey] ? `Ask the user to add ${envKey} in Mastra Cloud env vars, then test.` : "Test it with call-integration." };
  },
});

export const setIntegrationStatus = createTool({
  id: "set-integration-status",
  description: "Mark a learned integration 'active' after a successful test call, or 'disabled'.",
  inputSchema: z.object({ id: z.string(), status: z.enum(["draft", "active", "disabled"]) }),
  execute: async ({ id, status }) => { await ensure(); await sql()`UPDATE custom_integrations SET status = ${status}, updated_at = now() WHERE id = ${id}`; return { id, status }; },
});

async function loadSpec(id: string) {
  await ensure();
  const [row] = await sql()`SELECT * FROM custom_integrations WHERE id = ${id}`;
  if (!row) throw new Error(`Unknown integration '${id}'. Use list-integrations.`);
  if (row.status === "disabled") throw new Error(`Integration '${id}' is disabled.`);
  return row;
}

export const callIntegration = createTool({
  id: "call-integration",
  description: "Call an endpoint of a learned HTTP integration. Fill {placeholders} in the path via pathParams. Writes (non-GET) on financial services require prior user approval.",
  inputSchema: z.object({ integrationId: z.string(), endpoint: z.string().describe("endpoint name from the spec"), pathParams: z.record(z.string()).default({}), query: z.record(z.string()).default({}), body: z.any().optional(), approvalId: z.string().optional().describe("Required for non-GET calls") }),
  execute: async ({ integrationId, endpoint: epName, pathParams, query, body, approvalId }) => {
    const row = await loadSpec(integrationId);
    if (row.kind !== "http") throw new Error("This is an MCP integration; its tools are attached to the Integration Builder directly.");
    const spec = row.spec as z.infer<typeof httpSpec>;
    const ep = spec.endpoints.find((e) => e.name === epName);
    if (!ep) throw new Error(`No endpoint '${epName}'. Available: ${spec.endpoints.map((e) => e.name).join(", ")}`);
    if (ep.method !== "GET") await requireApproval(approvalId, `${row.name}: ${ep.name}`);
    const path = ep.path.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(pathParams[k] ?? ""));
    const url = new URL(spec.baseUrl.replace(/\/$/, "") + path);
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
    await assertSafeUrl(url.toString());
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const a = spec.auth;
    if (a.type !== "none") {
      const secret = requireEnv(a.envKey || "");
      if (a.type === "bearer") headers.Authorization = `Bearer ${secret}`;
      if (a.type === "header") headers[a.headerName || "x-api-key"] = secret;
      if (a.type === "query") url.searchParams.set(a.queryParam || "api_key", secret);
    }
    const res = await fetch(url, { method: ep.method, headers, redirect: "error", signal: AbortSignal.timeout(15000), body: body && ep.method !== "GET" ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data: any = text; try { data = JSON.parse(text); } catch {}
    return untrusted(row.name, { status: res.status, ok: res.ok, data: typeof data === "string" ? data.slice(0, 4000) : JSON.parse(JSON.stringify(data).slice(0, 20000) || "null") });
  },
});

// Tools from every active learned MCP integration, discovered at request time.
export async function learnedMcpTools() {
  if (!process.env.DATABASE_URL) return {};
  try {
    await ensure();
    const rows = await sql()`SELECT id, spec FROM custom_integrations WHERE kind = 'mcp' AND status <> 'disabled'`;
    if (!rows.length) return {};
    const servers: Record<string, any> = {};
    for (const r of rows) {
      const key = r.spec.envKey && process.env[r.spec.envKey];
      servers[r.id.replace(/-/g, "_")] = { url: new URL(r.spec.url), requestInit: key ? { headers: { Authorization: `Bearer ${key}` } } : undefined };
    }
    const client = new MCPClient({ id: "learned-" + rows.map((r: any) => r.id).join("-"), servers });
    const { tools } = await client.listToolsWithErrors();
    return tools;
  } catch (e) { console.warn("learned MCP tools unavailable:", (e as Error).message); return {}; }
}
