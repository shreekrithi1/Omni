// Catalog of every service OmniControl talks to. One personal access token (PAT) / key each.
// `env` = environment variable used as a fallback when nothing is saved in Settings.
export const CONNECTORS = [
  { id: "mastra", name: "Olivia (Mastra)", group: "Assistant", env: "OMNI_API_TOKEN", mark: "M", color: "lilac", purpose: "API token for your deployed Mastra agents (OMNI_API_TOKEN on the server).", help: "https://projects.mastra.ai", placeholder: "long random token" },
  { id: "openai", name: "OpenAI", group: "AI models", env: "OPENAI_API_KEY", mark: "AI", color: "mint", purpose: "Model provider for Olivia and the agents.", help: "https://platform.openai.com/api-keys", placeholder: "sk-…" },
  { id: "anthropic", name: "Anthropic", group: "AI models", env: "ANTHROPIC_API_KEY", mark: "A", color: "peach", purpose: "Optional Claude models for the agents.", help: "https://console.anthropic.com/settings/keys", placeholder: "sk-ant-…" },
  { id: "neon", name: "Neon Postgres", group: "Data", env: "DATABASE_URL", mark: "N", color: "mint", purpose: "Database for accounts, bills, to-dos, approvals and audit log.", help: "https://console.neon.tech", placeholder: "postgresql://…?sslmode=require", secretLabel: "Connection string" },
  { id: "exa", name: "Exa", group: "Research", env: "EXA_API_KEY", mark: "E", color: "blue", purpose: "Neural search for News for you and research.", help: "https://dashboard.exa.ai/api-keys", placeholder: "exa key" },
  { id: "agentmail", name: "AgentMail", group: "Communication", env: "AGENTMAIL_API_KEY", mark: "@", color: "pink", purpose: "Email inboxes for your agents (bills, school mail).", help: "https://console.agentmail.to", placeholder: "am_…" },
  { id: "kernel", name: "Kernel", group: "Automation", env: "KERNEL_API_KEY", mark: "K", color: "lilac", purpose: "Cloud browsers for portal logins and forms.", help: "https://dashboard.onkernel.com", placeholder: "kernel key" },
  { id: "fly", name: "Fly.io", group: "Automation", env: "FLY_API_TOKEN", mark: "F", color: "blue", purpose: "Edge worker machines for micro-agents.", help: "https://fly.io/user/personal_access_tokens", placeholder: "FlyV1 …" },
  { id: "anam", name: "Anam.AI", group: "Assistant", env: "ANAM_API_KEY", mark: "a.", color: "pink", purpose: "Olivia's real-time video avatar and voice.", help: "https://lab.anam.ai", placeholder: "anam key" },
  { id: "executor", name: "Executor MCP", group: "Automation", env: "EXECUTOR_API_KEY", mark: "X", color: "peach", purpose: "Universal MCP gateway to your personal APIs.", help: "https://executor.sh", placeholder: "token", urlEnv: "EXECUTOR_MCP_URL", urlLabel: "Gateway URL" },
  { id: "github", name: "GitHub", group: "Developer", env: "GITHUB_TOKEN", mark: "GH", color: "lilac", purpose: "Fine-grained PAT so agents can read/write the Omni repo.", help: "https://github.com/settings/personal-access-tokens/new", placeholder: "github_pat_…" },
  { id: "google", name: "Google Calendar", group: "Life", env: "GOOGLE_ACCESS_TOKEN", mark: "G", color: "mint", purpose: "OAuth access token for My day's calendar (read-only scope).", help: "https://developers.google.com/oauthplayground", placeholder: "ya29.…" },
];
export const byId = (id) => CONNECTORS.find((c) => c.id === id);
