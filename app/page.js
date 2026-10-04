"use client";
import { useEffect, useRef, useState } from "react";
import * as m from "@/lib/mock";
import Icon from "./components/icons";
import Assistant from "./components/assistant";
import HowTo from "./components/how-to";
import Settings from "./components/settings";
import MyDay from "./components/myday";
import News from "./news-ui/News";
import { Overview, Finance, Family, Health, Agents, Approvals, Connections } from "./components/views";

const navigation = [
  { id: "overview", label: "Overview", icon: "grid", title: "Your life, in sync.", subtitle: "Hey Naren, a little more headspace starts here." },
  { id: "today", label: "My day", icon: "clock", title: "Your day, at a glance.", subtitle: "Calendar, to-dos and what’s due — all in one calm place." },
  { id: "finance", label: "Your money", icon: "wallet", title: "A little more financial zen.", subtitle: "The big picture. The little details. All right here." },
  { id: "family", label: "Life & plans", icon: "calendar", title: "Make room for your people.", subtitle: "Less back-and-forth. More being there." },
  { id: "health", label: "Wellbeing", icon: "heart", title: "How are you, really?", subtitle: "Your daily reminder to look after you, too." },
  { id: "news", label: "News for you", icon: "globe", title: "What matters to you.", subtitle: "Fresh stories on your interests, found by Exa." },
  { id: "agents", label: "Your AI squad", icon: "spark", title: "Consider it a team effort.", subtitle: "Meet the agents keeping your everyday moving." },
  { id: "approvals", label: "For your approval", icon: "inbox", title: "You get the final say.", subtitle: "A few little decisions. A little less on your plate." },
  { id: "settings", label: "Settings", icon: "settings", title: "Make Omni yours.", subtitle: "Connect Olivia and the services she works with." },
  { id: "guide", label: "How to use", icon: "grid", title: "A little guidance goes a long way.", subtitle: "Your step-by-step introduction to Omni." },
  { id: "connections", label: "Connections", icon: "globe", title: "Better, together.", subtitle: "A home for every part of your connected life." },
];
const STORAGE_KEY = "omni-demo-decisions-v1";
export default function Page() {
  const [tab, setTab] = useState("overview");
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dark, setDark] = useState(false);
  const [chatMobile, setChatMobile] = useState(false);
  const [request, setRequest] = useState(null);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const searchDialog = useRef(null);
  const searchInput = useRef(null);
  const content = useRef(null);
  const approvals = m.approvals.filter(item => !history.some(decision => decision.id === item.id));
  const current = navigation.find(item => item.id === tab);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setHistory(saved.filter(item => item && m.approvals.some(a => a.id === item.id) && typeof item.approved === "boolean").map(item => ({ ...m.approvals.find(a => a.id === item.id), approved: item.approved })));
      setDark(localStorage.getItem("omni-theme") === "dark");
    } catch { /* Private browsing can make storage unavailable. */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {} } }, [history, loaded]);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; if (loaded) { try { localStorage.setItem("omni-theme", dark ? "dark" : "light"); } catch {} } }, [dark, loaded]);
  useEffect(() => {
    const onKey = event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 4500); return () => clearTimeout(timer); }, [toast]);
  function navigate(id) { setTab(id); setChatMobile(false); content.current?.scrollTo({ top: 0 }); searchDialog.current?.close(); }
  function openSearch() { setQuery(""); searchDialog.current?.showModal(); searchInput.current?.focus(); }
  function ask(text) { setRequest({ text, id: Date.now() }); setChatMobile(true); }
  function decide(item, approved) {
    setHistory(previous => previous.some(decision => decision.id === item.id) ? previous : [{ ...item, approved }, ...previous]);
    setToast(approved ? "Approved in demo. No external action was taken." : "Declined. Your demo decision has been saved.");
  }
  const filtered = navigation.filter(item => (item.label + " " + item.subtitle).toLowerCase().includes(query.toLowerCase()));
  return <div className={"app-shell" + (chatMobile ? " show-mobile-chat" : "")}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar"><button className="brand" onClick={() => navigate("overview")} aria-label="Omni home"><span className="brand-symbol">✳</span>omni<span className="brand-dot">.</span></button><span className="brand-caption">A LITTLE MORE LIFE.</span>
      <button className="workspace-switch" onClick={() => navigate("family")}><span className="workspace-avatar">D</span><span><b>Your personal space</b><small>Darla family</small></span><Icon name="down" size={15}/></button>
      <span className="nav-label">YOUR EVERYDAY</span><nav aria-label="Main navigation">{navigation.slice(0, 5).map(item => <button key={item.id} className={"nav-item " + (tab === item.id ? "active" : "")} aria-current={tab === item.id ? "page" : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} size={19}/><span>{item.label}</span>{tab === item.id && <i/>}</button>)}<span className="nav-label second-label">A HELPING HAND</span>{navigation.slice(5, 10).map(item => <button key={item.id} className={"nav-item " + (tab === item.id ? "active" : "")} aria-current={tab === item.id ? "page" : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} size={19}/><span>{item.label}</span>{item.id === "approvals" && <span className="nav-count">{approvals.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span>✧</span><h3>You do you.<br/>We’ll do the admin.</h3><p>Your everyday, with a little backup.</p><button onClick={() => ask("Give me my daily brief")}>Meet your sidekick<Icon name="arrow" size={15}/></button></div><button className={"nav-item " + (tab === "connections" ? "active" : "")} onClick={() => navigate("connections")} aria-current={tab === "connections" ? "page" : undefined}><Icon name="globe" size={19}/><span>Connections</span><span className="small">9</span></button><div className="profile"><span className="profile-avatar">ND</span><span><b>Naren Darla</b><small>Personal workspace</small></span><button className="icon-button" onClick={() => setDark(value => !value)} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}><Icon name={dark ? "sun" : "moon"} size={17}/></button></div></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><span>My workspace</span><span>/</span><b>{current.label}</b></div><button className="search-trigger" onClick={openSearch} aria-label="Search workspace"><Icon name="search" size={16}/><span>Find your flow...</span><kbd>⌘ K</kbd></button><div className="topbar-actions"><button className="text-button" onClick={()=>navigate("guide")} aria-label="Open How to use guide">How to use</button><span className="demo-badge"><span/> Demo workspace</span><button className="icon-button notification-button" onClick={() => navigate("approvals")} aria-label={`${approvals.length} pending approvals`}><Icon name="bell" size={20}/>{approvals.length > 0 && <i/>}</button><button className="header-avatar" onClick={() => navigate("family")} aria-label="Open family workspace">N</button></div></header>
      <div className="workspace-body"><main className="main-area" id="main-content" ref={content}><div className="page-heading"><div><span className="eyebrow">YOUR PERSONAL OPERATING SYSTEM</span><h1>{current.title}</h1><p>{current.subtitle}</p></div><span className="date-chip"><Icon name="calendar" size={15}/> Sun, Oct 4 <span>2026</span></span></div>
        {tab === "guide" && <HowTo navigate={navigate}/>}
        {tab === "overview" && <Overview approvals={approvals} decide={decide} navigate={navigate} ask={ask}/>}
        {tab === "today" && <MyDay ask={ask}/>}{tab === "finance" && <Finance/>}{tab === "family" && <Family navigate={navigate}/>}{tab === "health" && <Health/>}{tab === "news" && <News/>}{tab === "agents" && <Agents history={history}/>}{tab === "connections" && <Connections/>}{tab === "settings" && <Settings/>}{tab === "approvals" && <Approvals items={approvals} decide={decide} history={history} reset={() => { setHistory([]); setToast("Demo approvals reset."); }}/>} 
      </main><Assistant request={request} pending={approvals.length} onClose={() => setChatMobile(false)}/></div>
    </div>
    <nav className="mobile-navigation" aria-label="Mobile navigation">{navigation.slice(0, 5).map(item => <button key={item.id} onClick={() => navigate(item.id)} aria-label={item.label} aria-current={!chatMobile && tab === item.id ? "page" : undefined} className={!chatMobile && tab === item.id ? "active" : ""}><Icon name={item.icon} size={19}/><span>{({ overview: "Home", finance: "Money", family: "Plans", health: "Wellbeing", agents: "Squad" })[item.id]}</span></button>)}<button className={chatMobile ? "active" : ""} onClick={() => setChatMobile(value => !value)} aria-label="Open Omni chat"><Icon name="chat" size={19}/><span>Omni</span></button></nav>
    <button className="tablet-chat-button button" onClick={() => setChatMobile(value => !value)}><Icon name={chatMobile ? "close" : "chat"} size={19}/>{chatMobile ? "Back to dashboard" : "Ask Omni"}</button>
    {toast && <div className="toast" role="status"><Icon name="check" size={17}/>{toast}<button className="icon-button" onClick={() => setToast("")} aria-label="Dismiss notification"><Icon name="close" size={15}/></button></div>}
    <dialog className="command-dialog" ref={searchDialog} onClick={event => { if (event.target === searchDialog.current) searchDialog.current.close(); }}><div className="command-search"><Icon name="search"/><label className="sr-only" htmlFor="workspace-search">Search workspace</label><input id="workspace-search" ref={searchInput} value={query} onChange={event => setQuery(event.target.value)} placeholder="Where would you like to go?"/><button className="icon-button" onClick={() => searchDialog.current.close()} aria-label="Close search"><Icon name="close"/></button></div><div className="command-results"><span className="eyebrow">YOUR WORKSPACE</span>{filtered.map(item => <button key={item.id} onClick={() => navigate(item.id)}><Icon name={item.icon}/><span><b>{item.label}</b><small>{item.subtitle}</small></span><Icon name="arrow" size={16}/></button>)}{filtered.length === 0 && <p className="muted">No matching pages. Try “money”, “plans”, or “connections”.</p>}</div><div className="command-footer">Navigate with Tab · Enter to open · Esc to close</div></dialog>
  </div>;
}
