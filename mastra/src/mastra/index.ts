import { Mastra } from "@mastra/core/mastra";
import { securityMiddleware, corsOptions } from "./security/server";
import { olivia, exaResearchAgent, neonDataAgent, agentmailAgent, kernelBrowserAgent, flyComputeAgent, anamAvatarAgent, executorGatewayAgent, integrationBuilderAgent } from "./agents";

export const mastra = new Mastra({
  agents: { olivia, exaResearchAgent, neonDataAgent, agentmailAgent, kernelBrowserAgent, flyComputeAgent, anamAvatarAgent, executorGatewayAgent, integrationBuilderAgent },
  server: { middleware: [securityMiddleware], cors: corsOptions, build: { swaggerUI: false } },
});
