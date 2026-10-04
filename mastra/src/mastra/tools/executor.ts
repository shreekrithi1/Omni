import { MCPClient } from "@mastra/mcp";

// Executor = universal MCP gateway. Agents get every tool the gateway exposes (banks, calendar, etc.).
let client: MCPClient | null = null;
export async function executorTools() {
  const url = process.env.EXECUTOR_MCP_URL;
  if (!url) return {};
  if (!url.startsWith("https://") && process.env.NODE_ENV === "production") throw new Error("EXECUTOR_MCP_URL must be https");
  if (!client) client = new MCPClient({
    id: "executor",
    servers: { executor: { url: new URL(url), requestInit: process.env.EXECUTOR_API_KEY ? { headers: { Authorization: `Bearer ${process.env.EXECUTOR_API_KEY}` } } : undefined } },
  });
  try { return await client.listTools(); } catch (e) { console.warn("Executor MCP unavailable:", (e as Error).message); return {}; }
}
