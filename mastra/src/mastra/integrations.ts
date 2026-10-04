// Single place to see / add integrations. Built-ins ship with code; new ones are learned at runtime
// by the Integration Builder agent and stored in Neon (table: custom_integrations).
export type IntegrationInfo = { id: string; name: string; purpose: string; envKeys: string[]; agent: string };

export const BUILT_IN_INTEGRATIONS: IntegrationInfo[] = [
  { id: "exa", name: "Exa", purpose: "Neural web search & crawling", envKeys: ["EXA_API_KEY"], agent: "exaResearchAgent" },
  { id: "neon", name: "Neon Postgres", purpose: "State, audit log, approvals, vector memory", envKeys: ["DATABASE_URL"], agent: "neonDataAgent" },
  { id: "agentmail", name: "AgentMail", purpose: "Agent email inboxes (bills, school, negotiation)", envKeys: ["AGENTMAIL_API_KEY"], agent: "agentmailAgent" },
  { id: "kernel", name: "Kernel", purpose: "Cloud browser sandboxes for portal logins & forms", envKeys: ["KERNEL_API_KEY"], agent: "kernelBrowserAgent" },
  { id: "fly", name: "Fly.io", purpose: "Edge micro-agent worker machines", envKeys: ["FLY_API_TOKEN", "FLY_APP_NAME"], agent: "flyComputeAgent" },
  { id: "anam", name: "Anam.AI", purpose: "Real-time video avatar (Olivia)", envKeys: ["ANAM_API_KEY", "ANAM_PERSONA_ID"], agent: "anamAvatarAgent" },
  { id: "executor", name: "Executor MCP", purpose: "Universal MCP gateway to personal APIs", envKeys: ["EXECUTOR_MCP_URL", "EXECUTOR_API_KEY"], agent: "executorGatewayAgent" },
  { id: "assistant-ui", name: "Assistant UI", purpose: "Frontend chat/widgets — consumes these agents over Mastra's API", envKeys: [], agent: "olivia" },
];
