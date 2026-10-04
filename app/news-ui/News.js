"use client";
import { useEffect, useState } from "react";

const DEFAULT = ["AI agents and agentic workflows", "personal finance and investing", "fintech and open banking", "wearables, sleep and longevity", "Bay Area family and schools"];
const load = () => { try { return JSON.parse(localStorage.getItem("omni.interests")) || DEFAULT; } catch { return DEFAULT; } };

export default function News() {
  const [interests, setInterests] = useState(DEFAULT);
  const [draft, setDraft] = useState("");
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setInterests(load()); }, []);
  useEffect(() => { try { localStorage.setItem("omni.interests", JSON.stringify(interests)); } catch {} }, [interests]);

  async function refresh() {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/news", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interests, days }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.status);
      setData(j.results);
    } catch (e) { setErr(String(e.message || e)); }
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []); // eslint-disable-line

  const add = (e) => { e.preventDefault(); const t = draft.trim(); if (t && !interests.includes(t)) setInterests([...interests, t]); setDraft(""); };

  return (<div className="grid">
    <div className="card c12">
      <div className="lbl">Your interests · Exa neural search</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {interests.map((t) => <span key={t} className="pill">{t} <a style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setInterests(interests.filter((x) => x !== t))}>×</a></span>)}
      </div>
      <form onSubmit={add} style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an interest (e.g. Tesla stock, Warriors, Mastra)" style={{ flex: 1, background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--text)", borderRadius: 8, padding: 8 }} />
        <select value={days} onChange={(e) => setDays(+e.target.value)} className="btn"><option value={1}>24h</option><option value={7}>7 days</option><option value={30}>30 days</option></select>
        <button className="btn pri" type="button" onClick={refresh} disabled={loading}>{loading ? "Searching…" : "Refresh"}</button>
      </form>
      {err && <div className="small neg" style={{ marginTop: 8 }}>{err}</div>}
    </div>
    {(data || []).map((g) => (<div className="card c6" key={g.topic}>
      <div className="lbl">{g.topic}</div>
      {g.error && <div className="small neg">{g.error}</div>}
      {!g.error && g.items.length === 0 && <div className="muted small">No recent articles.</div>}
      {g.items.map((n) => (<div className="row" key={n.url} style={{ display: "block" }}>
        <a href={n.url} target="_blank" rel="noreferrer" style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>{n.title}</a>
        <div className="small muted">{n.source}{n.date ? " · " + new Date(n.date).toLocaleDateString() : ""}</div>
        {n.summary && <div className="small" style={{ marginTop: 4 }}>{n.summary}</div>}
      </div>))}
    </div>))}
  </div>);
}
