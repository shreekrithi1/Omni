"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Olivia's live Anam.ai avatar. Toggle on → fetch a session token from our server → stream video →
// greet with a welcome message. Then the user can talk by voice, and chat replies are spoken aloud.
const LiveAvatar = forwardRef(function LiveAvatar({ busy, pending = 0, name = "Olivia" }, ref) {
  const [on, setOn] = useState(false);
  const [state, setState] = useState("idle"); // idle | connecting | live | error
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const client = useRef(null);
  const greeted = useRef(false);

  const welcome = () => {
    const h = new Date().getHours();
    const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
    return `Good ${part}, Naren! I'm ${name}, your Omni assistant. You have ${pending} ${pending === 1 ? "decision" : "decisions"} waiting for you and a few things coming up today. What would you like to tackle first?`;
  };

  async function start() {
    setState("connecting"); setError(""); greeted.current = false;
    try {
      const r = await fetch("/api/anam/session", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not start session");
      const { createClient, AnamEvent } = await import("@anam-ai/js-sdk");
      const c = createClient(j.sessionToken);
      client.current = c;
      c.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        setState("live");
        if (!greeted.current) { greeted.current = true; c.talk(welcome()).catch(() => {}); }
      });
      c.addListener(AnamEvent.CONNECTION_CLOSED, () => { setState("idle"); setOn(false); });
      await c.streamToVideoElement("olivia-live-video");
    } catch (e) {
      setState("error"); setError(String(e.message || e)); setOn(false); client.current = null;
    }
  }
  async function stop() {
    try { await client.current?.stopStreaming(); } catch {}
    client.current = null; setState("idle");
  }
  const toggle = () => { const next = !on; setOn(next); next ? start() : stop(); };
  const toggleMic = () => { if (!client.current) return; muted ? client.current.unmuteInputAudio() : client.current.muteInputAudio(); setMuted(!muted); };

  // Let the chat speak replies through the avatar while it's live.
  useImperativeHandle(ref, () => ({ speak: (text) => { if (state === "live" && client.current && text) client.current.talk(text.slice(0, 600)).catch(() => {}); }, isLive: () => state === "live" }), [state]);
  useEffect(() => () => { client.current?.stopStreaming?.(); }, []);

  return <div className={"olivia-stage" + (busy ? " speaking" : "") + (state === "live" ? " is-live" : "")}>
    <img src="/omni.png" alt={`${name}, your assistant`} style={{ opacity: state === "live" ? 0 : 1 }} />
    <video id="olivia-live-video" autoPlay playsInline style={{ opacity: state === "live" ? 1 : 0 }} />
    {state === "connecting" && <span className="olivia-connecting"><i />Connecting to {name}…</span>}
    <button type="button" className={"olivia-toggle" + (on ? " on" : "")} onClick={toggle} aria-pressed={on} aria-label={on ? "Turn off live avatar" : "Turn on live avatar"}>
      <span className="olivia-switch"><span /></span>{on ? (state === "live" ? "Live" : "…") : "Go live"}
    </button>
    {state === "live" && <button type="button" className="olivia-mic" onClick={toggleMic} aria-label={muted ? "Unmute microphone" : "Mute microphone"}>{muted ? "🔇" : "🎙️"}</button>}
    <span className="olivia-name"><b>{name}</b>{state === "live" ? " · listening — just talk" : state === "error" ? " · couldn't connect" : busy ? " · thinking…" : " · here to help"}</span>
    {state === "error" && <span className="olivia-error" title={error}>{error.length > 70 ? error.slice(0, 70) + "…" : error}</span>}
  </div>;
});
export default LiveAvatar;
