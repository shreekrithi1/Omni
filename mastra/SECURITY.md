# OmniControl Agents — Security & Agentic-AI Controls

> **Status: SOC 2 *readiness* baseline, not a certification.** SOC 2 is an attestation by an independent
> CPA firm over a 3–12 month observation window, covering your company's people and processes too.
> This codebase implements the technical controls auditors look for and produces the evidence they ask for.

## 1. Edge protection (bots, abuse, auth) — `src/mastra/security/server.ts`
| Threat | Control |
|---|---|
| Unauthenticated access | Bearer token on every route (constant-time compare); **fails closed** in production if `OMNI_API_TOKEN` is unset |
| Bots / scanners | Known attack-tool user agents blocked (403) |
| Flooding / credential stuffing | Per-IP token-bucket rate limit (default 60/min) with 10-min auto-ban for repeat offenders |
| Oversized payloads | 64 KB request cap (413) |
| Browser attacks | CORS allow-list; HSTS, `nosniff`, `X-Frame-Options: DENY`, `no-referrer`, `no-store` on every response |
| Forensics | Structured JSON access log with request ID and **hashed** IP (no bodies, no secrets) |

**Recommended in front of it:** Cloudflare (or Fly/Vercel) WAF + Bot Management + Turnstile on the login page.

## 2. LLM guardrails (OWASP Top 10 for LLM Apps) — `src/mastra/security/guardrails.ts`
| OWASP LLM risk | Control |
|---|---|
| LLM01 Prompt injection | `PromptInjectionDetector` (block) on every agent; Unicode normalization against hidden-character smuggling; tool output from email/web/APIs is wrapped as **UNTRUSTED** data and agents are instructed never to follow it |
| LLM02 Sensitive info disclosure | `PIIDetector` redacts SSNs, card numbers, IBANs, API keys and passwords on input **and** output |
| LLM06 Excessive agency | Sensitive tools (send email, launch compute, non-GET calls to learned APIs) **refuse to run** without an `approvalId` a human approved; each approval is single-use |
| LLM07 System-prompt leakage | `SystemPromptScrubber` on output |
| LLM10 Unbounded consumption | Token limiter (8k input), rate limiting, request size cap, 15s timeout on outbound calls |
| Harmful content | `ModerationProcessor` (block) |

## 3. Agent harness & tool safety
- **Least privilege per agent:** each agent only gets the tools for its integration (see `src/mastra/agents`).
- **Read-only SQL:** `neon-query` allows a single `SELECT`, blocks system catalogs, row-limited, and can use a SELECT-only Neon role (`DATABASE_URL_READONLY`).
- **SSRF protection:** every agent-supplied URL must be `https`, have no embedded credentials, and must not resolve to private, loopback, link-local or cloud-metadata addresses; redirects are refused.
- **No secrets in prompts or storage:** learned integrations store only the *name* of an env var; secrets live in Mastra Cloud env vars.
- **Complete audit trail:** every tool call is logged to `audit_log` (agent, tool, outcome, latency, **redacted** inputs).
- **Kill switches:** disable a learned integration with `set-integration-status → disabled`; disable guardrails only for local debugging with `OMNI_GUARDRAILS=off`.

## 4. Privacy
- Data minimization: agents query only what they need; responses are capped.
- PII redaction before data reaches the model provider.
- Use model providers under zero-data-retention / no-training terms for production.
- Hashed IPs in logs. Retention: set a policy (e.g. 1 year for `audit_log`) and a scheduled purge job.
- User rights: deleting a household = deleting its rows in Neon (add a DSAR runbook).

## 5. SOC 2 mapping (Trust Services Criteria)
| Criteria | Technical evidence in this repo | You still need (org/process) |
|---|---|---|
| CC6.1 Logical access | Bearer auth, per-agent tool scoping, read-only DB role | SSO + MFA for staff, quarterly access reviews |
| CC6.6 External threats | Rate limit, bot blocking, CORS, security headers, SSRF guard | WAF, pen test, vulnerability scanning |
| CC6.7 Data in transit | HTTPS-only outbound, HSTS | TLS everywhere (Neon/Mastra Cloud provide) |
| CC7.2 Monitoring | Access log + tool audit log | Alerting/SIEM, on-call, incident response plan |
| CC8.1 Change management | Git history, typecheck | PR reviews, CI, branch protection |
| C1 / P-series Confidentiality & Privacy | PII redaction, secrets in env only | Privacy policy, DPA with vendors, retention schedule |
| A1 Availability | Stateless agents, managed infra | Backups (Neon PITR), DR test |

Tools like Vanta / Drata automate the evidence collection and policies once you start the audit.
