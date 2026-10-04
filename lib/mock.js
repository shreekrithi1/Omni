// Mock data — stands in for Neon (state), Executor MCP (accounts), AgentMail, Kernel, wearables.
export const user = { name: "Naren", household: "Darla Family" };

export const accounts = [
  { id: 1, name: "Chase Checking", type: "bank", balance: 18420.55 },
  { id: 2, name: "Ally Savings", type: "bank", balance: 52300.0 },
  { id: 3, name: "Fidelity Brokerage", type: "investment", balance: 214880.12 },
  { id: 4, name: "Vanguard 401(k)", type: "investment", balance: 168245.9 },
  { id: 5, name: "Amex Platinum", type: "credit", balance: -3210.44 },
  { id: 6, name: "Chase Sapphire", type: "credit", balance: -1185.2 },
  { id: 7, name: "Home Mortgage", type: "loan", balance: -412600.0 },
  { id: 8, name: "Home Value (est.)", type: "asset", balance: 865000.0 },
];

export const netWorthHistory = [781, 794, 801, 815, 809, 829, 842, 851, 862, 873, 885, 901.9]; // $K, last 12 months
export const cashFlow = { income: 21400, spend: 13880, velocity: 1.54 };
export const creditScore = { score: 792, change: +6, utilization: 7 };

export const bills = [
  { id: "b1", payee: "PG&E", amount: 214.37, due: "2026-10-08", status: "anomaly", note: "38% above 6-mo avg", source: "agentmail:finance@" },
  { id: "b2", payee: "Comcast Xfinity", amount: 89.99, due: "2026-10-10", status: "scheduled", note: "Matches budget", source: "kernel:portal" },
  { id: "b3", payee: "State Farm Auto", amount: 1286.0, due: "2026-10-12", status: "approval", note: "Exceeds $500 HITL threshold", source: "agentmail:finance@" },
  { id: "b4", payee: "Netflix", amount: 22.99, due: "2026-10-15", status: "paid", note: "Auto-paid", source: "kernel:portal" },
  { id: "b5", payee: "City Water", amount: 64.1, due: "2026-10-18", status: "scheduled", note: "Matches budget", source: "agentmail:finance@" },
];

export const budget = [
  { cat: "Housing", spent: 3420, limit: 3500 },
  { cat: "Groceries", spent: 1120, limit: 1200 },
  { cat: "Utilities", spent: 512, limit: 450 },
  { cat: "Dining", spent: 640, limit: 600 },
  { cat: "Kids", spent: 880, limit: 1000 },
  { cat: "Subscriptions", spent: 184, limit: 250 },
];

export const family = [
  { name: "Naren", role: "Parent", color: "#6366f1" },
  { name: "Priya", role: "Parent", color: "#ec4899" },
  { name: "Aarav", role: "Child (10)", color: "#10b981" },
  { name: "Maya", role: "Child (7)", color: "#f59e0b" },
];

export const events = [
  { day: "Mon 10/5", time: "8:00", who: "Aarav", title: "School picture day", tag: "school" },
  { day: "Mon 10/5", time: "16:30", who: "Maya", title: "Swim lesson", tag: "activity" },
  { day: "Tue 10/6", time: "15:30", who: "Aarav", title: "Soccer practice", tag: "activity", conflict: true },
  { day: "Tue 10/6", time: "15:30", who: "Naren", title: "Dentist (Dr. Kim)", tag: "health", conflict: true },
  { day: "Wed 10/7", time: "18:00", who: "Priya", title: "PTA meeting", tag: "school" },
  { day: "Thu 10/8", time: "9:00", who: "Maya", title: "Field trip — Exploratorium", tag: "school" },
  { day: "Sat 10/10", time: "10:00", who: "Family", title: "Flight SFO → SEA (AS 331)", tag: "travel" },
];

export const familyTasks = [
  { id: "f1", title: "Permission slip — Exploratorium field trip", who: "Maya", due: "10/6", status: "needs signature" },
  { id: "f2", title: "Resolve Tue 3:30 conflict: soccer drop-off vs dentist", who: "Naren", due: "10/5", status: "agent proposal ready" },
  { id: "f3", title: "Book piano teacher for Aarav (3 options found)", who: "Aarav", due: "10/9", status: "researching" },
];

export const health = {
  vitality: 78,
  metrics: [
    { k: "Sleep", v: "7h 12m", score: 82, trend: [6.4, 7.1, 6.8, 7.5, 7.0, 6.2, 7.2] },
    { k: "HRV", v: "54 ms", score: 71, trend: [48, 52, 50, 57, 55, 49, 54] },
    { k: "Resting HR", v: "58 bpm", score: 80, trend: [60, 59, 59, 58, 57, 59, 58] },
    { k: "Glucose (avg)", v: "98 mg/dL", score: 86, trend: [102, 97, 99, 95, 101, 100, 98] },
    { k: "Steps", v: "8,940", score: 74, trend: [6200, 9100, 10400, 7600, 8800, 5400, 8940] },
    { k: "Mood check-in", v: "Good", score: 76, trend: [3, 4, 4, 3, 4, 3, 4] },
  ],
  recs: [
    "HRV dipped Saturday — consider a lighter workout today.",
    "Glucose spikes after late dinners (3 of 7 days). Try eating before 7:30pm.",
    "Bedtime consistency is up 18% this week — keep it going.",
  ],
};

export const agents = [
  { name: "Finance Auditor", inbox: "finance@omni.agentmail.to", status: "running", task: "Reconciling Amex statement", runtime: "fly:sjc" },
  { name: "Family Logistics", inbox: "family@omni.agentmail.to", status: "running", task: "Parsing 4 new school emails", runtime: "fly:sjc" },
  { name: "Health Coach", inbox: "health@omni.agentmail.to", status: "idle", task: "Next run 6:00am", runtime: "fly:lax" },
  { name: "Research & Procurement", inbox: "research@omni.agentmail.to", status: "running", task: "Exa: comparing auto insurance quotes", runtime: "fly:sea" },
];

export const sandboxes = [
  { id: "kb-7f21", site: "pge.com/myaccount", step: "Downloading Sept statement PDF", progress: 72 },
  { id: "kb-a9c3", site: "geico.com/quote", step: "Filling vehicle details (2 of 5)", progress: 40 },
];

export const approvals = [
  { id: "a1", kind: "Payment", title: "Pay State Farm Auto $1,286.00", agent: "Finance Auditor", reason: "Over $500 threshold" },
  { id: "a2", kind: "Calendar", title: "Move dentist to Thu 10/8 2:00pm", agent: "Family Logistics", reason: "Resolves soccer conflict" },
  { id: "a3", kind: "Dispute", title: "Email PG&E disputing $214 bill", agent: "Finance Auditor", reason: "38% above avg, no rate change found" },
];

export const travel = [{ title: "Seattle family weekend", when: "Oct 10–12", detail: "AS 331 SFO→SEA 10:00 · Hotel Theodore · 2 rooms" }];

export const auditLog = [
  { t: "09:42", actor: "Finance Auditor", action: "kernel.session.start", target: "pge.com" },
  { t: "09:40", actor: "Finance Auditor", action: "agentmail.receive", target: "PG&E e-bill Sept" },
  { t: "09:31", actor: "Family Logistics", action: "calendar.detect_conflict", target: "Tue 10/6 15:30" },
  { t: "09:15", actor: "Research", action: "exa.search", target: "best auto insurance bay area 2026" },
  { t: "08:58", actor: "Executor", action: "mcp.token.refresh", target: "plaid:chase" },
];
