import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { callJson, requireEnv } from "./http";

const BASE = "https://api.onkernel.com";
const auth = () => ({ Authorization: `Bearer ${requireEnv("KERNEL_API_KEY")}` });

export const kernelCreateBrowser = createTool({
  id: "kernel-create-browser",
  description: "Start a cloud Chrome sandbox (Kernel) for portal logins, downloading statements or filling forms. Returns a CDP URL for automation and a live-view URL the user can watch.",
  inputSchema: z.object({ headless: z.boolean().default(false), stealth: z.boolean().default(true), timeoutSeconds: z.number().int().default(300) }),
  execute: async ({ headless, stealth, timeoutSeconds }) => {
    const b = await callJson(`${BASE}/browsers`, { method: "POST", headers: auth(), body: JSON.stringify({ headless, stealth, timeout_seconds: timeoutSeconds }) });
    return { sessionId: b.session_id, cdpWsUrl: b.cdp_ws_url, liveViewUrl: b.browser_live_view_url };
  },
});

export const kernelListBrowsers = createTool({
  id: "kernel-list-browsers",
  description: "List active Kernel browser sandboxes.",
  inputSchema: z.object({}),
  execute: async () => callJson(`${BASE}/browsers`, { headers: auth() }),
});

export const kernelDeleteBrowser = createTool({
  id: "kernel-delete-browser",
  description: "Shut down a Kernel browser sandbox when the task is finished.",
  inputSchema: z.object({ sessionId: z.string() }),
  execute: async ({ sessionId }) => { await callJson(`${BASE}/browsers/${encodeURIComponent(sessionId)}`, { method: "DELETE", headers: auth() }); return { ok: true }; },
});
