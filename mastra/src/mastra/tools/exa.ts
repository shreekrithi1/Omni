import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { callJson, requireEnv } from "./http";
import { untrusted } from "../security/guardrails";

export const exaSearch = createTool({
  id: "exa-search",
  description: "Neural web search via Exa. Use for news, bills/providers research, prices, specialists, insurance comparisons.",
  inputSchema: z.object({
    query: z.string(),
    numResults: z.number().int().min(1).max(10).default(5),
    category: z.enum(["news", "company", "research paper", "pdf", "personal site", "financial report"]).optional(),
    days: z.number().int().optional().describe("Only results published in the last N days"),
  }),
  execute: async ({ query, numResults, category, days }) => {
    const body: any = { query, type: "auto", numResults, contents: { summary: true } };
    if (category) body.category = category;
    if (days) body.startPublishedDate = new Date(Date.now() - days * 864e5).toISOString();
    const data = await callJson("https://api.exa.ai/search", { method: "POST", headers: { "x-api-key": requireEnv("EXA_API_KEY") }, body: JSON.stringify(body) });
    return { results: (data.results || []).map((r: any) => ({ title: r.title, url: r.url, publishedDate: r.publishedDate, summary: r.summary })) };
  },
});

export const exaContents = createTool({
  id: "exa-get-contents",
  description: "Fetch clean text of specific URLs via Exa (e.g. a bill page or article).",
  inputSchema: z.object({ urls: z.array(z.string().url()).min(1).max(5) }),
  execute: async ({ urls }) => {
    const data = await callJson("https://api.exa.ai/contents", { method: "POST", headers: { "x-api-key": requireEnv("EXA_API_KEY") }, body: JSON.stringify({ urls, text: { maxCharacters: 4000 } }) });
    return untrusted("web pages", { results: (data.results || []).map((r: any) => ({ url: r.url, title: r.title, text: r.text })) });
  },
});
