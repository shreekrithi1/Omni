// Creates tables in Neon and seeds them from lib/mock.js. Run: npm run db:setup
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (existsSync(".env.local")) for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const k = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (k && !process.env[k[1]]) process.env[k[1]] = k[2].replace(/^["']|["']$/g, "");
}
if (!process.env.DATABASE_URL) { console.error("Set DATABASE_URL in .env.local first."); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);
const m = await import("data:text/javascript;base64," + Buffer.from(readFileSync("lib/mock.js")).toString("base64"));

const stmts = readFileSync("db/schema.sql", "utf8").replace(/--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);
for (const s of stmts) await sql.query(s);
console.log(`✓ schema (${stmts.length} statements)`);

const empty = async (t) => (await sql.query(`SELECT count(*)::int AS n FROM ${t}`))[0].n === 0;
const today = new Date(); const day = (offset, hm = "00:00") => { const d = new Date(today); d.setDate(d.getDate() + offset); const [h, mi] = hm.split(":"); d.setHours(+h, +mi, 0, 0); return d.toISOString(); };

if (await empty("accounts")) for (const a of m.accounts) await sql`INSERT INTO accounts (name, type, balance) VALUES (${a.name}, ${a.type}, ${a.balance})`;
if (await empty("net_worth_history")) for (const [i, v] of m.netWorthHistory.entries()) { const d = new Date(today.getFullYear(), today.getMonth() - (m.netWorthHistory.length - 1 - i), 1); await sql`INSERT INTO net_worth_history VALUES (${d.toISOString().slice(0, 10)}, ${v * 1000})`; }
if (await empty("budgets")) for (const b of m.budget) await sql`INSERT INTO budgets VALUES (${b.cat}, ${b.spent}, ${b.limit})`;
if (await empty("bills")) for (const b of m.bills) await sql`INSERT INTO bills (id, payee, amount, due_date, status, note, source) VALUES (${b.id}, ${b.payee}, ${b.amount}, ${b.due}, ${b.status}, ${b.note}, ${b.source})`;
if (await empty("family_members")) for (const f of m.family) await sql`INSERT INTO family_members (name, role, color) VALUES (${f.name}, ${f.role}, ${f.color})`;
if (await empty("approvals")) for (const a of m.approvals) await sql`INSERT INTO approvals (id, kind, title, agent, reason) VALUES (${a.id}, ${a.kind}, ${a.title}, ${a.agent}, ${a.reason})`;
if (await empty("agent_identities")) for (const a of m.agents) await sql`INSERT INTO agent_identities VALUES (${a.name}, ${a.inbox}, ${a.runtime}, ${a.status}, ${a.task})`;
if (await empty("todos")) for (const [text, tag, done] of [["Sign Maya's field trip permission slip", "Family", false], ["Approve State Farm payment ($1,286)", "Money", false], ["Reply to Aarav's piano teacher", "Family", false], ["Review Q4 budget draft", "Money", true], ["Book annual physical", "Health", false]]) await sql`INSERT INTO todos (text, tag, done) VALUES (${text}, ${tag}, ${done})`;
if (await empty("tasks")) for (const [title, d, p, area] of [["PG&E bill dispute — send email", 0, "high", "Money"], ["Permission slip — Exploratorium", 2, "high", "Family"], ["State Farm auto renewal", 8, "medium", "Money"], ["Pack for Seattle trip", 6, "medium", "Travel"], ["Renew passport (Naren)", 21, "low", "Admin"], ["Quarterly estimated taxes", 11, "high", "Money"]]) await sql`INSERT INTO tasks (title, due_date, priority, area) VALUES (${title}, ${day(d).slice(0, 10)}, ${p}, ${area})`;
if (await empty("events")) for (const [s, e, title, who, cal, color, conflict] of [["07:30", "08:00", "School drop-off", "Aarav & Maya", "Family", "mint"], ["09:00", "09:30", "Daily standup", "Zoom", "Work", "lilac"], ["10:00", "11:30", "OmniControl design review", "Conf room B", "Work", "lilac"], ["12:15", "13:00", "Lunch with Priya", "Tartine", "Personal", "peach"], ["14:00", "14:45", "Investor call — Seed round", "Google Meet", "Work", "blue"], ["15:30", "16:15", "Dentist (Dr. Kim)", "Conflict: soccer pickup", "Health", "pink", true], ["16:30", "17:15", "Maya — swim lesson", "YMCA", "Family", "mint"], ["19:00", "19:45", "Evening walk", "Goal: 10k steps", "Health", "peach"]]) await sql`INSERT INTO events (title, who, starts_at, ends_at, calendar, color, conflict) VALUES (${title}, ${who}, ${day(0, s)}, ${day(0, e)}, ${cal}, ${color}, ${!!conflict})`;
if (await empty("health_metrics")) for (const x of m.health.metrics) for (const [i, v] of x.trend.entries()) await sql`INSERT INTO health_metrics (metric, value, recorded_at) VALUES (${x.k}, ${v}, ${day(i - 6)})`;
await sql`INSERT INTO audit_log (actor, action, target) VALUES ('system', 'db.setup', 'neon')`;
console.log("✓ seeded. Tables:", (await sql`SELECT string_agg(table_name, ', ' ORDER BY table_name) AS t FROM information_schema.tables WHERE table_schema='public'`)[0].t);
