# OmniControl Agents (Mastra)

One agent per integration, orchestrated by **Olivia**:

| Agent | Integration | What it does |
|---|---|---|
| `olivia` | — | Orchestrator; delegates to the agents below |
| `exa-research` | Exa | News, research, procurement comparisons |
| `neon-data` | Neon | Answers from the household DB, adds to-dos, queues approvals |
| `agentmail` | AgentMail | Reads bills & school mail, drafts/sends replies (with approval) |
| `kernel-browser` | Kernel | Cloud browsers for portals & forms |
| `fly-compute` | Fly.io | Ephemeral worker machines (with approval) |
| `anam-avatar` | Anam.AI | Avatar session tokens & spoken briefings |
| `executor-gateway` | Executor MCP | All personal APIs exposed by the gateway |
| `integration-builder` | **any new tool** | Reads API docs, registers a spec, tests it, activates it |

Integrations live in `src/mastra/integrations.ts` (built-in) and the `custom_integrations` Neon table (learned at runtime).
Security controls: see [SECURITY.md](SECURITY.md).

## Run locally
```bash
cp .env.example .env    # fill in keys
npm install
npm run dev             # Mastra Studio at http://localhost:4111
```

## Deploy to Mastra Cloud
1. Push this repo to GitHub.
2. https://projects.mastra.ai → **Create project** → import the GitHub repo.
3. Project root: `mastra` (this folder) · Mastra directory: `src/mastra` · Build: `npm run build`.
4. Add every variable from `.env.example` under **Environment variables** (at minimum `OPENAI_API_KEY`, `OMNI_API_TOKEN`, `DATABASE_URL`).
5. Deploy. Each push to `main` redeploys.

## Teach Omni a new tool
Ask Olivia (or the Integration Builder): *"Integrate Plaid"* / *"Connect to https://docs.example.com/api"*.
It finds the docs, registers the integration, tells you which env var to add, tests it, and activates it.
