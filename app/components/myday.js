"use client";
import { useEffect, useMemo, useState } from "react";
import Icon from "./icons";

// Mock Google Calendar events for today (swap for Google Calendar API / Executor MCP later)
const CAL = [
  { start: "07:30", end: "08:00", title: "School drop-off", who: "Aarav & Maya", cal: "Family", color: "mint" },
  { start: "09:00", end: "09:30", title: "Daily standup", who: "Zoom", cal: "Work", color: "lilac" },
  { start: "10:00", end: "11:30", title: "OmniControl design review", who: "Conf room B", cal: "Work", color: "lilac" },
  { start: "12:15", end: "13:00", title: "Lunch with Priya", who: "Tartine", cal: "Personal", color: "peach" },
  { start: "14:00", end: "14:45", title: "Investor call — Seed round", who: "Google Meet", cal: "Work", color: "blue" },
  { start: "15:30", end: "16:15", title: "Dentist (Dr. Kim)", who: "Conflict: soccer pickup", cal: "Health", color: "pink", conflict: true },
  { start: "16:30", end: "17:15", title: "Maya — swim lesson", who: "YMCA", cal: "Family", color: "mint" },
  { start: "19:00", end: "19:45", title: "Evening walk", who: "Goal: 10k steps", cal: "Health", color: "peach" },
];
const TODOS = [
  { id: 1, text: "Sign Maya's field trip permission slip", tag: "Family", done: false },
  { id: 2, text: "Approve State Farm payment ($1,286)", tag: "Money", done: false },
  { id: 3, text: "Reply to Aarav's piano teacher", tag: "Family", done: false },
  { id: 4, text: "Review Q4 budget draft", tag: "Money", done: true },
  { id: 5, text: "Book annual physical", tag: "Health", done: false },
];
const TASKS = [
  { title: "PG&E bill dispute — send email", due: 0, prio: "high", area: "Money" },
  { title: "Permission slip — Exploratorium", due: 2, prio: "high", area: "Family" },
  { title: "State Farm auto renewal", due: 8, prio: "medium", area: "Money" },
  { title: "Pack for Seattle trip", due: 6, prio: "medium", area: "Travel" },
  { title: "Renew passport (Naren)", due: 21, prio: "low", area: "Admin" },
  { title: "Quarterly estimated taxes", due: 11, prio: "high", area: "Money" },
];
const START = 7, END = 21, HOUR = 46;
const mins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const fmt = (t) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
const dueLabel = (d) => d === 0 ? "Today" : d === 1 ? "Tomorrow" : d < 7 ? `In ${d} days` : `In ${Math.round(d / 7)} wk${d >= 14 ? "s" : ""}`;

export default function MyDay({ ask }) {
  const [now, setNow] = useState(null);
  const [todos, setTodos] = useState(TODOS);
  const [draft, setDraft] = useState("");
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const [live, setLive] = useState(false);
  useEffect(() => {
    fetch("/api/todos").then((r) => r.json()).then((j) => {
      if (Array.isArray(j.todos)) { setTodos(j.todos); setLive(true); return; }
      try { const s = JSON.parse(localStorage.getItem("omni.todos")); if (Array.isArray(s)) setTodos(s); } catch {}
    }).catch(() => {});
  }, []);
  const save = (list) => { setTodos(list); if (!live) try { localStorage.setItem("omni.todos", JSON.stringify(list)); } catch {} };
  const toggle = (t) => { save(todos.map((x) => x.id === t.id ? { ...x, done: !x.done } : x)); if (live) fetch("/api/todos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, done: !t.done }) }); };
  const addTodo = async (text) => {
    if (!live) return save([{ id: Date.now(), text, tag: "Inbox", done: false }, ...todos]);
    const r = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).then((r) => r.json());
    if (r.todo) setTodos((l) => [r.todo, ...l]);
  };

  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : 10 * 60 + 40;
  const next = useMemo(() => CAL.find((e) => mins(e.start) > nowMin), [nowMin]);
  const current = CAL.find((e) => mins(e.start) <= nowMin && mins(e.end) > nowMin);
  const open = todos.filter((t) => !t.done).length;
  const busyMin = CAL.reduce((s, e) => s + mins(e.end) - mins(e.start), 0);
  const nowTop = ((Math.min(Math.max(nowMin, START * 60), END * 60) - START * 60) / 60) * HOUR;

  return <div className="md">
    <section className="md-stats">
      <div className="md-stat md-focus"><span className="md-k">{current ? "Happening now" : "Up next"}</span>
        <b>{(current || next || {}).title || "You're all clear"}</b>
        <small>{current ? `until ${fmt(current.end)}` : next ? `${fmt(next.start)} · in ${Math.max(0, mins(next.start) - nowMin)} min` : "Enjoy your evening"}</small></div>
      <div className="md-stat"><span className="md-k">Meetings</span><b>{CAL.length}</b><small>{Math.round(busyMin / 6) / 10}h scheduled</small></div>
      <div className="md-stat"><span className="md-k">To-dos left</span><b>{open}</b><small>{todos.length - open} done today</small></div>
      <div className="md-stat"><span className="md-k">Due this week</span><b>{TASKS.filter((t) => t.due < 7).length}</b><small className="md-warn">{TASKS.filter((t) => t.prio === "high").length} high priority</small></div>
    </section>

    <div className="md-cols">
      <section className="md-card md-cal">
        <header><div><h2>Today's calendar</h2><p><span className="md-g">G</span> Google Calendar · demo sync</p></div>
          <div className="md-legend">{["Work", "Family", "Health", "Personal"].map((c) => <span key={c} className={"md-dot " + c.toLowerCase()}>{c}</span>)}</div></header>
        <div className="md-timeline" style={{ height: (END - START) * HOUR }}>
          {Array.from({ length: END - START + 1 }, (_, i) => <div key={i} className="md-hour" style={{ top: i * HOUR }}><span>{fmt(`${START + i}:00`).replace(":00", "")}</span></div>)}
          {CAL.map((e) => { const top = ((mins(e.start) - START * 60) / 60) * HOUR, h = Math.max(22, ((mins(e.end) - mins(e.start)) / 60) * HOUR - 3);
            return <div key={e.title} className={`md-event ${e.color}${e.conflict ? " conflict" : ""}${mins(e.end) <= nowMin ? " past" : ""}${h < 40 ? " short" : ""}`} style={{ top, height: h }}>
              <b>{e.title}</b><small>{h < 40 ? fmt(e.start) : `${fmt(e.start)} – ${fmt(e.end)} · ${e.who}`}</small></div>; })}
          <div className="md-now" style={{ top: nowTop }}><i /></div>
        </div>
      </section>

      <div className="md-side">
        <section className="md-card">
          <header><div><h2>To-dos</h2><p>{open} open · {live ? "saved to Neon" : "saved in this browser"}</p></div></header>
          <form className="md-add" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) addTodo(draft.trim()); setDraft(""); }}>
            <Icon name="plus" size={15} /><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a to-do and press Enter" />
          </form>
          <ul className="md-todos">{todos.map((t) => <li key={t.id} className={t.done ? "done" : ""}>
            <button aria-label="toggle" onClick={() => toggle(t)}>{t.done && <Icon name="check" size={12} />}</button>
            <span>{t.text}</span><em>{t.tag}</em></li>)}</ul>
        </section>

        <section className="md-card">
          <header><div><h2>Upcoming tasks</h2><p>Sorted by due date</p></div><button className="md-link" onClick={() => ask && ask("What should I focus on today?")}>Ask Olivia</button></header>
          <ul className="md-tasks">{[...TASKS].sort((a, b) => a.due - b.due).map((t) => <li key={t.title}>
            <span className={"md-prio " + t.prio} /><div><b>{t.title}</b><small>{t.area}</small></div>
            <em className={t.due <= 2 ? "soon" : ""}>{dueLabel(t.due)}</em></li>)}</ul>
        </section>
      </div>
    </div>
  </div>;
}
