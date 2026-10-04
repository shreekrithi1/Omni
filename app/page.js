"use client";
import { useState, useRef, useEffect } from "react";
import * as m from "@/lib/mock";

const $ = (n) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

function Spark({ data, w = 120, h = 32, color = "var(--accent)" }) {
  const mx = Math.max(...data), mn = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / (mx - mn || 1)) * (h - 4) - 2}`).join(" ");
  return <svg width={w} height={h}><polyline fill="none" stroke={color} strokeWidth="2" points={pts} /></svg>;
}
function Ring({ value }) {
  const r = 50, c = 2 * Math.PI * r;
  return (<svg className="ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r={r} stroke="var(--panel2)" strokeWidth="10" fill="none" />
    <circle cx="60" cy="60" r={r} stroke="var(--good)" strokeWidth="10" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 60 60)" strokeLinecap="round" />
    <text x="60" y="66" textAnchor="middle" fill="var(--text)" fontSize="26" fontWeight="700">{value}</text></svg>);
}

function Approvals({ items, decide }) {
  return (<div className="card c5"><div className="lbl">Pending approvals · HITL</div>
    {items.length === 0 && <div className="muted">All clear.</div>}
    {items.map((a) => (<div className="row" key={a.id}><div><div>{a.title}</div><div className="small muted">{a.agent} · {a.reason}</div></div>
      <div style={{ display: "flex", gap: 6 }}><button className="btn pri" onClick={() => decide(a, true)}>Approve</button><button className="btn" onClick={() => decide(a, false)}>Deny</button></div></div>))}
  </div>);
}

function Overview({ approvals, decide }) {
  const nw = m.accounts.reduce((s, a) => s + a.balance, 0);
  return (<>
    <div className="grid">
      <div className="card c3"><div className="lbl">Net worth</div><div className="big">{$(nw)}</div><div className="small pos">+1.9% this month</div><Spark data={m.netWorthHistory} w={180} /></div>
      <div className="card c3"><div className="lbl">Cash flow (Sept)</div><div className="big">{$(m.cashFlow.income - m.cashFlow.spend)}</div><div className="small muted">In {$(m.cashFlow.income)} · Out {$(m.cashFlow.spend)}</div><div className="small">Velocity {m.cashFlow.velocity}x</div></div>
      <div className="card c3"><div className="lbl">Credit health</div><div className="big">{m.creditScore.score}</div><div className="small pos">+{m.creditScore.change} pts · {m.creditScore.utilization}% utilization</div></div>
      <div className="card c3"><div className="lbl">Vitality index</div><div className="big">{m.health.vitality}<span className="muted small">/100</span></div><div className="small muted">Sleep 7h12m · HRV 54ms</div></div>
      <Approvals items={approvals} decide={decide} />
      <div className="card c7"><div className="lbl">Live bill alerts</div>{m.bills.slice(0, 4).map((b) => (<div className="row" key={b.id}><div><div>{b.payee} <span className="muted small">due {b.due.slice(5)}</span></div><div className="small muted">{b.note}</div></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><b>{$(b.amount)}</b><span className={"pill " + b.status}>{b.status}</span></div></div>))}</div>
      <div className="card c6"><div className="lbl">Active browser sandboxes · Kernel</div>{m.sandboxes.map((s) => (<div key={s.id} style={{ marginBottom: 12 }}><div className="row" style={{ border: 0, padding: "2px 0" }}><span>{s.site}</span><span className="pill running">{s.id}</span></div><div className="small muted" style={{ marginBottom: 6 }}>{s.step}</div><div className="bar"><i style={{ width: s.progress + "%" }} /></div></div>))}</div>
      <div className="card c6"><div className="lbl">Upcoming travel</div>{m.travel.map((t) => (<div key={t.title}><div style={{ fontWeight: 600 }}>{t.title}</div><div className="muted">{t.when}</div><div className="small" style={{ marginTop: 6 }}>{t.detail}</div></div>))}
        <div className="lbl" style={{ marginTop: 16 }}>Today's family</div>{m.events.slice(0, 2).map((e, i) => (<div className="row" key={i}><span>{e.time} · {e.title}</span><span className="muted small">{e.who}</span></div>))}</div>
    </div></>);
}

function Finance() {
  const groups = ["bank", "investment", "credit", "loan", "asset"];
  return (<div className="grid">
    <div className="card c7"><div className="lbl">Accounts · via Executor MCP</div>{groups.map((g) => m.accounts.filter((a) => a.type === g).map((a) => (<div className="row" key={a.id}><div>{a.name} <span className="pill">{a.type}</span></div><b className={a.balance < 0 ? "neg" : ""}>{$(a.balance)}</b></div>)))}</div>
    <div className="card c5"><div className="lbl">Net worth — 12 months ($K)</div><Spark data={m.netWorthHistory} w={320} h={120} /><div className="small muted">From $781K to $902K</div></div>
    <div className="card c7"><div className="lbl">Bills · Audit agent</div>{m.bills.map((b) => (<div className="row" key={b.id}><div><div>{b.payee}</div><div className="small muted">{b.note} · {b.source}</div></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><b>{$(b.amount)}</b><span className={"pill " + b.status}>{b.status}</span></div></div>))}</div>
    <div className="card c5"><div className="lbl">Budget vs actual (Neon)</div>{m.budget.map((b) => { const p = Math.min(100, (b.spent / b.limit) * 100); return (<div key={b.cat} style={{ marginBottom: 10 }}><div className="row" style={{ border: 0, padding: "2px 0" }}><span>{b.cat}</span><span className={"small " + (b.spent > b.limit ? "neg" : "muted")}>{$(b.spent)} / {$(b.limit)}</span></div><div className="bar"><i style={{ width: p + "%", background: b.spent > b.limit ? "var(--bad)" : "var(--accent)" }} /></div></div>); })}</div>
  </div>);
}

function Family() {
  const color = (w) => (m.family.find((f) => f.name === w) || { color: "#888" }).color;
  return (<div className="grid">
    <div className="card c4"><div className="lbl">Household</div>{m.family.map((f) => (<div className="row" key={f.name}><span><i className="dot" style={{ background: f.color }} />{f.name}</span><span className="muted small">{f.role}</span></div>))}</div>
    <div className="card c8"><div className="lbl">Unified calendar · this week</div>{m.events.map((e, i) => (<div className="row" key={i}><div><i className="dot" style={{ background: color(e.who) }} />{e.day} {e.time} — {e.title}</div><div style={{ display: "flex", gap: 6 }}>{e.conflict && <span className="pill bad">conflict</span>}<span className="pill">{e.tag}</span></div></div>))}</div>
    <div className="card c12"><div className="lbl">Logistics tasks · family@ agent inbox</div>{m.familyTasks.map((t) => (<div className="row" key={t.id}><div>{t.title}<div className="small muted">{t.who} · due {t.due}</div></div><span className="pill warn">{t.status}</span></div>))}</div>
  </div>);
}

function Health() {
  return (<div className="grid">
    <div className="card c4" style={{ textAlign: "center" }}><div className="lbl">Daily vitality index</div><Ring value={m.health.vitality} /><div className="small muted">Composite of sleep, HRV, glucose, activity, mood</div></div>
    <div className="card c8"><div className="lbl">Recommendations</div>{m.health.recs.map((r, i) => <div className="row" key={i}>{r}</div>)}</div>
    {m.health.metrics.map((x) => (<div className="card c4" key={x.k}><div className="lbl">{x.k}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}><div><div className="big" style={{ fontSize: 22 }}>{x.v}</div><div className="small muted">score {x.score}</div></div><Spark data={x.trend} color="var(--good)" /></div></div>))}
  </div>);
}

function Agents() {
  return (<div className="grid">
    <div className="card c7"><div className="lbl">Mastra agents · Fly.io sprites</div>{m.agents.map((a) => (<div className="row" key={a.name}><div><div>{a.name}</div><div className="small muted">{a.inbox} · {a.runtime}</div><div className="small">{a.task}</div></div><span className={"pill " + a.status}>{a.status}</span></div>))}</div>
    <div className="card c5"><div className="lbl">Audit log · Neon</div>{m.auditLog.map((l, i) => (<div className="row small" key={i}><span className="muted">{l.t}</span><span style={{ flex: 1 }}>{l.actor}</span><code>{l.action}</code></div>))}</div>
    <div className="card c12"><div className="lbl">Integration status</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{["Anam.AI", "Assistant UI", "Mastra", "Executor MCP", "Exa", "Kernel", "AgentMail", "Fly.io", "Neon"].map((s) => <span key={s} className="pill warn">{s}: mock</span>)}</div></div>
  </div>);
}

function Assistant() {
  const [msgs, setMsgs] = useState([{ r: "a", agent: "Orchestrator", t: "Good morning, Naren. 3 approvals waiting, 1 bill anomaly, and a Tuesday calendar conflict. What would you like to tackle?" }]);
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const end = useRef();
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);
  async function send(text) {
    if (!text.trim()) return; setMsgs((x) => [...x, { r: "u", t: text }]); setInput(""); setBusy(true);
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) }).then((r) => r.json());
    setMsgs((x) => [...x, { r: "a", agent: res.agent, t: res.reply }]); setBusy(false);
  }
  return (<aside className="right">
    <div className="avatar"><div className={"face" + (busy ? " talk" : "")} /><span className="live">● LIVE</span><span className="av-tag">Anam.AI avatar (placeholder)</span></div>
    <div className="chat">{msgs.map((x, i) => (<div key={i} className={"msg " + x.r}>{x.agent && <div className="who">{x.agent}</div>}{x.t}</div>))}{busy && <div className="msg a muted">thinking…</div>}<div ref={end} /></div>
    <div className="chips">{["Morning brief", "Net worth?", "Any bills?", "Family schedule", "Health today", "Find insurance"].map((c) => <button key={c} className="btn" onClick={() => send(c)}>{c}</button>)}</div>
    <form className="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask OmniControl…" /><button className="btn pri">Send</button></form>
  </aside>);
}

const TABS = { overview: "Control Room", finance: "Finance", family: "Family Hub", health: "Health", agents: "Agents & Audit" };

export default function Page() {
  const [tab, setTab] = useState("overview");
  const [approvals, setApprovals] = useState(m.approvals);
  const decide = (a) => setApprovals((x) => x.filter((y) => y.id !== a.id));
  return (<div className="shell">
    <nav className="side"><div className="brand">Omni<span>Control</span></div>
      {Object.entries(TABS).map(([k, v]) => <button key={k} className={"nav" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{v}</button>)}
      <div style={{ marginTop: "auto" }} className="small muted">{m.user.household}<br />Mock data mode</div></nav>
    <main className="main"><h1 className="h1">{TABS[tab]}</h1><div className="sub">Sunday, Oct 4 · {approvals.length} approvals pending</div>
      {tab === "overview" && <Overview approvals={approvals} decide={decide} />}
      {tab === "finance" && <Finance />}{tab === "family" && <Family />}{tab === "health" && <Health />}{tab === "agents" && <Agents />}
    </main>
    <Assistant />
  </div>);
}
