import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { callJson, requireEnv } from "./http";
import { requireApproval } from "../security/policy";

const BASE = "https://api.machines.dev/v1";
const auth = () => ({ Authorization: `Bearer ${requireEnv("FLY_API_TOKEN")}` });
const app = (a?: string) => a || requireEnv("FLY_APP_NAME");

export const flyListMachines = createTool({
  id: "fly-list-machines",
  description: "List micro-agent worker machines (sprites) on Fly.io.",
  inputSchema: z.object({ app: z.string().optional() }),
  execute: async ({ app: a }) => {
    const ms = await callJson(`${BASE}/apps/${app(a)}/machines`, { headers: auth() });
    return { machines: ms.map((m: any) => ({ id: m.id, name: m.name, state: m.state, region: m.region, image: m.config?.image })) };
  },
});

export const flyRunWorker = createTool({
  id: "fly-run-worker",
  description: "Launch an ephemeral worker machine on Fly.io to run an isolated agent job. Auto-destroys when it exits.",
  inputSchema: z.object({ image: z.string(), region: z.string().default("sjc"), env: z.record(z.string()).default({}), cmd: z.array(z.string()).optional(), app: z.string().optional(), approvalId: z.string() }),
  execute: async ({ image, region, env, cmd, app: a, approvalId }) => {
    await requireApproval(approvalId, `launch Fly worker ${image}`);
    const m = await callJson(`${BASE}/apps/${app(a)}/machines`, { method: "POST", headers: auth(), body: JSON.stringify({ region, config: { image, env, auto_destroy: true, restart: { policy: "no" }, guest: { cpu_kind: "shared", cpus: 1, memory_mb: 512 }, ...(cmd ? { init: { cmd } } : {}) } }) });
    return { id: m.id, state: m.state, region: m.region };
  },
});

export const flyStopMachine = createTool({
  id: "fly-stop-machine",
  description: "Stop a Fly.io worker machine.",
  inputSchema: z.object({ machineId: z.string(), app: z.string().optional() }),
  execute: async ({ machineId, app: a }) => { await callJson(`${BASE}/apps/${app(a)}/machines/${machineId}/stop`, { method: "POST", headers: auth() }); return { ok: true }; },
});
