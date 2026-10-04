import { neon } from "@neondatabase/serverless";

// Lightweight read-only calls that prove a token works. Never mutate anything.
const ok = (detail) => ({ ok: true, detail });
async function http(url, init = {}) {
  const r = await fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(10000) });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
  if (!r.ok) throw new Error(`${r.status} ${(j?.error?.message || j?.message || j?.error || t).toString().slice(0, 140)}`);
  return j ?? t;
}
const bearer = (t) => ({ Authorization: `Bearer ${t}` });

export const TESTERS = {
  mastra: async (t, url) => { if (!url) throw new Error("Add your Mastra deployment URL in the Olivia section"); const a = await http(`${url.replace(/\/$/, "")}/api/agents`, { headers: bearer(t) }); return ok(`${Object.keys(a).length} agents reachable`); },
  openai: async (t) => { const j = await http("https://api.openai.com/v1/models", { headers: bearer(t) }); return ok(`${j.data?.length ?? 0} models available`); },
  anthropic: async (t) => { const j = await http("https://api.anthropic.com/v1/models", { headers: { "x-api-key": t, "anthropic-version": "2023-06-01" } }); return ok(`${j.data?.length ?? 0} models available`); },
  neon: async (t) => { const r = await neon(t)`SELECT current_database() AS db, (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public') AS tables`; return ok(`${r[0].db} · ${r[0].tables} tables`); },
  exa: async (t) => { const j = await http("https://api.exa.ai/search", { method: "POST", headers: { "x-api-key": t, "Content-Type": "application/json" }, body: JSON.stringify({ query: "test", numResults: 1 }) }); return ok(`search ok (${j.results?.length ?? 0} result)`); },
  agentmail: async (t) => { const j = await http("https://api.agentmail.to/v0/inboxes", { headers: bearer(t) }); return ok(`${j.count ?? j.inboxes?.length ?? 0} inboxes`); },
  kernel: async (t) => { const j = await http("https://api.onkernel.com/browsers", { headers: bearer(t) }); return ok(`${Array.isArray(j) ? j.length : 0} active browsers`); },
  fly: async (t) => { const j = await http("https://api.machines.dev/v1/apps?org_slug=personal", { headers: bearer(t) }); return ok(`${j.total_apps ?? j.apps?.length ?? 0} apps`); },
  anam: async (t, personaId) => {
    if (!personaId) { const j = await http("https://api.anam.ai/v1/personas", { headers: bearer(t) }); return ok(`key valid · ${j.data?.length ?? 0} personas — add a Persona ID`); }
    const r = await http("https://api.anam.ai/v1/auth/session-token", { method: "POST", headers: { ...bearer(t), "Content-Type": "application/json" }, body: JSON.stringify({ personaConfig: { personaId } }) });
    if (!r.sessionToken) throw new Error("no session token returned");
    return ok("key valid · persona ready to stream");
  },
  executor: async (t, url) => { if (!url) throw new Error("Add the gateway URL"); const r = await fetch(url, { method: "POST", headers: { ...bearer(t), "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }), signal: AbortSignal.timeout(10000) }); if (r.status === 401 || r.status === 403) throw new Error("token rejected"); return ok(`gateway responded (${r.status})`); },
  github: async (t) => { const j = await http("https://api.github.com/user", { headers: { ...bearer(t), "User-Agent": "omnicontrol" } }); return ok(`signed in as ${j.login}`); },
  google: async (t) => { const j = await http("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=10", { headers: bearer(t) }); return ok(`${j.items?.length ?? 0} calendars`); },
};
