"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./icons";

export default function Assistant({ request, pending, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scroller = useRef(null);
  const sending = useRef(false);
  const lastRequest = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [messages, busy, error]);
  async function send(text) {
    if (!text.trim() || sending.current) return;
    sending.current = true;
    setBusy(true); setError(""); setInput("");
    setMessages(previous => [...previous, { role: "user", text }]);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }), signal: controller.signal });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      if (typeof data.reply !== "string") throw new Error("Invalid reply");
      setMessages(previous => [...previous, { role: "assistant", text: data.reply, agent: data.agent }]);
    } catch {
      setInput(text);
      setError("Couldn't reach Omni. Your message is ready to try again.");
    } finally { clearTimeout(timeout); sending.current = false; setBusy(false); }
  }
  useEffect(() => {
    if (request && request.id !== lastRequest.current) {
      lastRequest.current = request.id;
      if (sending.current) setInput(request.text);
      else send(request.text);
    }
  }, [request]);
  return <aside className="assistant-panel" aria-label="Omni assistant">
    <div className="assistant-heading"><div className="assistant-title"><span className="tiny-logo"><Icon name="spark" size={16}/></span><b>Your sidekick</b></div><span className="demo-dot">Demo</span><button className="icon-button mobile-chat-close" onClick={onClose} aria-label="Back to dashboard"><Icon name="close"/></button></div>
    <div className={"olivia-stage" + (busy ? " speaking" : "")}><img src="/omni.png" alt="Olivia, your assistant"/><span className="olivia-live"><span/> LIVE</span><span className="olivia-name"><b>Olivia</b>{busy ? " · speaking…" : " · here to help"}</span></div>
    <div className="companion-intro"><h2>Hey, I’m Olivia <span>✳</span></h2><p>Your life admin, handled together.</p></div>
    <div className="conversation" ref={scroller} role="log" aria-label="Chat messages" aria-live="polite">
      <div className="chat-message assistant-message"><span className="message-author">OLIVIA · PERSONAL ASSISTANT</span><p>You’ve got {pending} {pending === 1 ? "decision" : "decisions"} to review and a few things coming up. Let’s make some room for the good stuff.</p><span className="message-time">Demo conversation</span></div>
      {messages.map((message, i) => <div className={"chat-message " + (message.role === "user" ? "user-message" : "assistant-message")} key={i}>{message.agent && <span className="message-author">{message.agent}</span>}<p>{message.text}</p></div>)}
      {busy && <div className="typing" aria-label="Omni is thinking"><span/><span/><span/></div>}
      {error && <p className="chat-error" role="alert">{error}</p>}
    </div>
    <div className="chat-suggestions"><span>A LITTLE NUDGE</span>{["Give me my daily brief", "Help me save on bills"].map(text => <button key={text} onClick={() => send(text)} disabled={busy}>{text}<Icon name="up" size={15}/></button>)}</div>
    <form className="composer" onSubmit={event => { event.preventDefault(); send(input); }}><label className="sr-only" htmlFor="chat-input">Message Omni</label><textarea id="chat-input" rows={2} value={input} onChange={event => setInput(event.target.value)} placeholder="What’s on your mind?" onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }}/><div className="composer-bottom"><span><Icon name="spark" size={13}/> Ask anything</span><button className="send-button" disabled={busy || !input.trim()} aria-label="Send message"><Icon name="send" size={18}/></button></div></form>
    <p className="assistant-disclaimer"><Icon name="shield" size={12}/> Mock replies · Anam voice not connected</p>
  </aside>;
}
