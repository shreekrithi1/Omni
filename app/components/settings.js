"use client";
import { useEffect, useState } from "react";
import Icon from "./icons";

const api = (url, method = "GET", body) => fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));
const when = (iso) => iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

function Pill({ s }) {
  if (!s?.configured) return <span className="st-pill off">Not connected</span>;
  if (s.test && !s.test.ok) return <span className="st-pill bad">Check token</span>;
  if (s.test?.ok) return <span className="st-pill on">Connected</span>;
  return <span className="st-pill saved">{s.source === "env" ? "From .env" : "Saved · untested"}</span>;
}

function Connector({ c, onChange }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [url, setUrl] = useState(c.status.url || "");
  const [pid, setPid] = useState(c.status.personaId || "");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const save = async () => {
    setBusy("save"); setMsg(null);
    const r = await api("/api/settings/connectors", "POST", { id: c.id, value: value || undefined, url: c.urlEnv ? url : undefined, personaId: c.idEnv ? pid : undefined });
    setBusy(""); if (!r.ok) return setMsg({ ok: false, detail: r.error });
    setValue(""); onChange(c.id, r.status); test();
  };
  const test = async () => { setBusy("test"); const r = await api("/api/settings/connectors/test", "POST", { id: c.id }); setBusy(""); setMsg(r); onChange(c.id, { ...c.status, configured: true, test: r }); };
  const remove = async () => { setBusy("del"); const r = await api("/api/settings/connectors", "DELETE", { id: c.id }); setBusy(""); setMsg(null); onChange(c.id, r.status); };
  const s = c.status;
  return <div className={"st-conn" + (open ? " open" : "")}>
    <button className="st-conn-head" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className={"st-mark " + c.color}>{c.mark}</span>
      <span className="st-conn-title"><b>{c.name}</b><small>{c.purpose}</small></span>
      <Pill s={s} /><Icon name="down" size={15} />
    </button>
    {open && <div className="st-conn-body">
      {s.configured && <p className="st-meta">{c.idEnv && s.personaId && <>Persona <code>{s.personaId}</code> · </>}Using {s.source === "env" ? <>environment variable <code>{c.env}</code></> : "saved token"} ending in <code>••••{s.last4}</code>{s.savedAt && <> · saved {when(s.savedAt)}</>}{s.test && <> · tested {when(s.test.at)}</>}</p>}
      {c.idEnv && <label className="st-field"><span>{c.idLabel}</span><input value={pid} onChange={(e) => setPid(e.target.value)} placeholder={c.idPlaceholder} spellCheck={false} /></label>}
      {c.urlEnv && <label className="st-field"><span>{c.urlLabel}</span><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></label>}
      <label className="st-field"><span>{c.secretLabel || "Personal access token"}</span>
        <div className="st-input"><Icon name="shield" size={14} /><input type="password" autoComplete="off" spellCheck={false} value={value} onChange={(e) => setValue(e.target.value)} placeholder={s.configured ? "Paste a new token to replace" : c.placeholder} /></div>
      </label>
      <div className="st-actions">
        <button className="st-btn pri" disabled={(!value && !(c.idEnv && s.configured && pid !== (s.personaId || ""))) || !!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save & test"}</button>
        <button className="st-btn" disabled={!s.configured || !!busy} onClick={test}>{busy === "test" ? "Testing…" : "Test connection"}</button>
        {s.source === "saved" && <button className="st-btn ghost" disabled={!!busy} onClick={remove}>Remove</button>}
        <a className="st-link" href={c.help} target="_blank" rel="noreferrer">Get a token ↗</a>
      </div>
      {msg && <p className={"st-result " + (msg.ok ? "good" : "bad")}>{msg.ok ? "✓ " : "✕ "}{msg.detail}</p>}
    </div>}
  </div>;
}

export default function Settings() {
  const [list, setList] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState("");
  useEffect(() => {
    api("/api/settings/connectors").then((r) => r.ok ? setList(r.connectors) : setErr(r.error));
    api("/api/settings/olivia").then((r) => r.ok && setCfg(r));
  }, []);
  const update = (id, status) => setList((l) => l.map((c) => c.id === id ? { ...c, status } : c));
  const saveCfg = async (patch) => { const r = await api("/api/settings/olivia", "POST", { ...cfg, ...patch }); if (r.ok) { setCfg(r); setSaved("Saved"); setTimeout(() => setSaved(""), 1500); } else setErr(r.error); };

  if (err) return <div className="st-card"><p className="st-result bad">{err}</p></div>;
  if (!list || !cfg) return <div className="st-card st-muted">Loading settings…</div>;
  const mastra = list.find((c) => c.id === "mastra");
  const groups = [...new Set(list.filter((c) => c.id !== "mastra").map((c) => c.group))];
  const connected = list.filter((c) => c.status.configured).length;

  return <div className="st">
    <section className="st-card st-olivia">
      <div className="st-olivia-id"><img src="/omni.png" alt="" /><div><span className="st-k">Assistant</span><h2>{cfg.displayName || "Olivia"}</h2>
        <p>{cfg.useLive && mastra.status.configured ? "Live — answers come from your Mastra agents" : "Demo mode — using sample replies"}</p></div>
        <label className="st-toggle"><input type="checkbox" checked={!!cfg.useLive} onChange={(e) => saveCfg({ useLive: e.target.checked })} /><span /><b>Live agents</b></label>
      </div>
      <div className="st-grid">
        <label className="st-field"><span>Mastra deployment URL</span><input defaultValue={cfg.mastraUrl} onBlur={(e) => e.target.value !== cfg.mastraUrl && saveCfg({ mastraUrl: e.target.value })} placeholder="https://your-project.mastra.cloud" /></label>
        <label className="st-field"><span>Agent</span><select value={cfg.agentId} onChange={(e) => saveCfg({ agentId: e.target.value })}>
          {["olivia", "exa-research", "neon-data", "agentmail", "kernel-browser", "fly-compute", "anam-avatar", "executor-gateway", "integration-builder"].map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="st-field"><span>Display name</span><input defaultValue={cfg.displayName} onBlur={(e) => saveCfg({ displayName: e.target.value })} /></label>
      </div>
      {saved && <span className="st-saved">✓ {saved}</span>}
      <Connector c={mastra} onChange={update} />
    </section>

    <section className="st-card">
      <header className="st-head"><div><h2>Connectors</h2><p>{connected} of {list.length} connected · one personal access token per service</p></div></header>
      {groups.map((g) => <div key={g} className="st-group"><span className="st-k">{g}</span>{list.filter((c) => c.group === g).map((c) => <Connector key={c.id} c={c} onChange={update} />)}</div>)}
    </section>

    <section className="st-card st-sec">
      <Icon name="shield" size={18} />
      <div><b>How your tokens are protected</b>
        <p>Encrypted with AES-256-GCM on this server, never sent back to the browser (only the last 4 characters are shown), and not committed to git. Settings can only be changed from this computer, or with your admin token. Use read-only, least-privilege tokens wherever a service offers them.</p></div>
    </section>
  </div>;
}
