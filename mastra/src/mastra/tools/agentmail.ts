import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { callJson, requireEnv } from "./http";
import { requireApproval } from "../security/policy";
import { untrusted } from "../security/guardrails";

const BASE = "https://api.agentmail.to/v0";
const auth = () => ({ Authorization: `Bearer ${requireEnv("AGENTMAIL_API_KEY")}` });

export const agentmailListInboxes = createTool({
  id: "agentmail-list-inboxes",
  description: "List the agent email inboxes (one per sub-agent: finance@, family@, health@, research@).",
  inputSchema: z.object({}),
  execute: async () => callJson(`${BASE}/inboxes`, { headers: auth() }),
});

export const agentmailCreateInbox = createTool({
  id: "agentmail-create-inbox",
  description: "Create a dedicated inbox for an agent identity.",
  inputSchema: z.object({ username: z.string().describe("e.g. finance-omni"), displayName: z.string().optional() }),
  execute: async ({ username, displayName }) => callJson(`${BASE}/inboxes`, { method: "POST", headers: auth(), body: JSON.stringify({ username, display_name: displayName }) }),
});

export const agentmailListMessages = createTool({
  id: "agentmail-list-messages",
  description: "List recent messages in an inbox (e.g. incoming bills, school announcements).",
  inputSchema: z.object({ inboxId: z.string(), limit: z.number().int().max(50).default(10) }),
  execute: async ({ inboxId, limit }) => untrusted("email", await callJson(`${BASE}/inboxes/${encodeURIComponent(inboxId)}/messages?limit=${limit}`, { headers: auth() })),
});

export const agentmailGetMessage = createTool({
  id: "agentmail-get-message",
  description: "Read one message in full.",
  inputSchema: z.object({ inboxId: z.string(), messageId: z.string() }),
  execute: async ({ inboxId, messageId }) => untrusted("email", await callJson(`${BASE}/inboxes/${encodeURIComponent(inboxId)}/messages/${encodeURIComponent(messageId)}`, { headers: auth() })),
});

export const agentmailSend = createTool({
  id: "agentmail-send",
  description: "Send an email from an agent inbox. Only after the user approved it.",
  inputSchema: z.object({ inboxId: z.string(), to: z.array(z.string().email()).max(10), subject: z.string().max(300), text: z.string().max(20000), approvalId: z.string() }),
  execute: async ({ inboxId, to, subject, text, approvalId }) => (await requireApproval(approvalId, `send email: ${subject}`), callJson(`${BASE}/inboxes/${encodeURIComponent(inboxId)}/messages/send`, { method: "POST", headers: auth(), body: JSON.stringify({ to, subject, text }) })),
});
