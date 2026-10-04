import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { callJson, requireEnv } from "./http";

export const anamSessionToken = createTool({
  id: "anam-session-token",
  description: "Create a short-lived Anam.AI session token so the frontend can stream Olivia's real-time video avatar.",
  inputSchema: z.object({ personaId: z.string().optional().describe("Defaults to ANAM_PERSONA_ID") }),
  execute: async ({ personaId }) => {
    const id = personaId || process.env.ANAM_PERSONA_ID;
    const body = id ? { personaConfig: { personaId: id } } : { personaConfig: { name: "Olivia", systemPrompt: "You are Olivia, a warm, concise personal operations assistant." } };
    const r = await callJson("https://api.anam.ai/v1/auth/session-token", { method: "POST", headers: { Authorization: `Bearer ${requireEnv("ANAM_API_KEY")}` }, body: JSON.stringify(body) });
    return { sessionToken: r.sessionToken };
  },
});

export const briefingScript = createTool({
  id: "format-avatar-briefing",
  description: "Turn bullet facts into a short spoken script (under 45 seconds) for the avatar to read.",
  inputSchema: z.object({ facts: z.array(z.string()).min(1) }),
  execute: async ({ facts }) => ({ script: `Hi Naren, here's your quick update. ${facts.slice(0, 6).map((f) => f.replace(/\.$/, "")).join(". ")}. Anything you'd like me to handle?` }),
});
