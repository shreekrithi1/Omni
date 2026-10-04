import { neon } from "@neondatabase/serverless";
import { redact } from "./policy";

// Wraps every tool so each call is written to the immutable audit log (who, what, when, outcome, latency).
export function withAudit<T extends Record<string, any>>(agent: string, tools: T): T {
  const out: any = {};
  for (const [name, tool] of Object.entries(tools)) {
    if (!tool?.execute) { out[name] = tool; continue; }
    const original = tool.execute.bind(tool);
    out[name] = Object.assign(Object.create(Object.getPrototypeOf(tool)), tool, {
      execute: async (input: any, ctx: any) => {
        const t0 = Date.now(); let ok = true; let err: string | undefined;
        try { return await original(input, ctx); }
        catch (e) { ok = false; err = (e as Error).message; throw e; }
        finally {
          if (process.env.DATABASE_URL) {
            neon(process.env.DATABASE_URL)`INSERT INTO audit_log (actor, action, target, detail) VALUES (${agent}, ${"tool." + (tool.id || name)}, ${ok ? "ok" : "error"}, ${JSON.stringify({ input: redact(input), ms: Date.now() - t0, error: err })})`.catch(() => {});
          }
        }
      },
    });
  }
  return out as T;
}
