"use client";

import { useState, useEffect } from "react";

// ── helpers ──────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 55, delay = 600) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setShown("");
    setDone(false);
    const t = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(id);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(t);
  }, [text, speed, delay]);
  return { shown, done };
}

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// GREETING 1 — Good Morning, Sunrise warmth
export function Greeting1({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  const [hour, setHour] = useState(12);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHour(new Date().getHours());
    setMounted(true);
  }, []);

  const isMorning = hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const tag = isMorning ? "Good morning" : isAfternoon ? "Good afternoon" : "Good evening";
  const headline = isMorning ? "Rise and shine —" : isAfternoon ? "Afternoon push —" : "Evening hours —";
  const firstName = userName ? userName.split(" ")[0] : "user";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[new Date().getDay()];

  return (
    <section className="gv-section" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.3s", height: "auto", maxHeight: "none", flex: "none", width: "100%", paddingBottom: "12px", paddingTop: "12px" }}>
      <div className="gv-g1-bg" />
      <div className="gv-g1-sun" />
      <div className="gv-inner">
        <h1 className="gv-g1-headline gv-stagger-2" style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: "1.3" }}>
          {headline}<br />
          <span className="gv-g1-highlight" style={{ fontSize: "clamp(26px, 5vw, 36px)" }}>what are we building</span><br />
          today?
        </h1>
        <p className="gv-g1-sub gv-stagger-3" style={{ fontSize: "20px", fontWeight: "bold", textTransform: "lowercase", marginTop: "16px" }}>
          {tag.toLowerCase()} {firstName.toLowerCase()} - happy {dayName.toLowerCase()}
        </p>
      </div>
    </section>
  );
}

// GREETING 2 — Late Night
function getSlotConfig(hour: number) {
  if (hour < 5) return {
    accent: "#a78bfa", accentDim: "rgba(167,139,250,0.12)", accentGlow: "rgba(167,139,250,0.06)", starCount: 28,
  };
  if (hour >= 22) return {
    accent: "#60a5fa", accentDim: "rgba(96,165,250,0.12)", accentGlow: "rgba(96,165,250,0.06)", starCount: 18,
  };
  return {
    accent: "#fb923c", accentDim: "rgba(251,146,60,0.12)", accentGlow: "rgba(251,146,60,0.06)", starCount: 10,
  };
}

export function Greeting2({ userName, data, onSend }: { userName?: string; data?: any; onSend?: (t: string) => void }) {
  const [hour, setHour] = useState(12);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHour(new Date().getHours());
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const cfg = getSlotConfig(hour);
  const firstName = userName ? userName.split(" ")[0] : "user";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[new Date().getDay()];
  const timeGreeting = hour < 5 ? "Late night" : hour < 12 ? "Good morning" : hour < 16 ? "Good afternoon" : hour < 21 ? "Good evening" : "Late night";

  return (
    <>
      <style>{`
        @keyframes ln-twinkle { 0%, 100% { opacity: var(--op, 0.3); transform: scale(1); } 50% { opacity: calc(var(--op, 0.3) * 1.8); transform: scale(1.4); } }
        @keyframes ln-fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ln-pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.9); opacity: 0; } }
        @keyframes ln-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.85; } }
      `}</style>
      <div 
        ref={(el) => {
          if (el) {
            el.style.setProperty('--ln-accent', cfg.accent);
            el.style.setProperty('--ln-accent-dim', cfg.accentDim);
            el.style.setProperty('--ln-accent-glow', cfg.accentGlow);
          }
        }}
        style={{ position: "relative", borderRadius: 20, border: `1px solid ${cfg.accentDim}`, background: "var(--bg, #0d0d0f)", padding: "36px 32px 16px", overflow: "hidden", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.5s ease, transform 0.5s ease", width: "100%", boxSizing: "border-box" }}
      >
        {/* Simple Starfield */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: "inherit" }}>
          {Array.from({ length: cfg.starCount }).map((_, i) => (
            <span key={i} style={{ position: "absolute", left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: Math.random() * 1.5 + 0.5, height: Math.random() * 1.5 + 0.5, borderRadius: "50%", background: cfg.accent, opacity: Math.random() * 0.6 + 0.4, animation: `ln-twinkle ${Math.random() * 3 + 2}s ${Math.random() * 4}s ease-in-out infinite` }} />
          ))}
        </div>

        {/* Ambient Glow */}
        <div aria-hidden="true" style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: cfg.accent, opacity: 0.15, filter: "blur(60px)", pointerEvents: "none" }} />
        
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18, animation: "ln-fade-up 0.5s 0.1s both ease" }}>
          <span aria-hidden="true" style={{ position: "absolute", inset: -10, borderRadius: "50%", border: `1px solid ${cfg.accent}`, opacity: 0.6, animation: "ln-pulse-ring 2.5s ease-out infinite" }} />
          <span style={{ fontSize: 36, lineHeight: 1 }}>{data?.emoji || "🌙"}</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--text, #e8e6df)", margin: "0 0 8px", letterSpacing: "-0.02em", animation: "ln-fade-up 0.5s 0.18s both ease", textTransform: "lowercase" }}>
          {timeGreeting.toLowerCase()} {firstName.toLowerCase()} - happy {dayName.toLowerCase()}
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--text-muted, #888)", margin: "0 0 12px", lineHeight: 1.6, animation: "ln-fade-up 0.5s 0.26s both ease" }}>
          Ready for another deep work session? Let's explore together.
        </p>
        
        <p style={{ position: "absolute", bottom: 12, right: 18, fontSize: 10, color: cfg.accent, opacity: 0.6, margin: 0, letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums", animation: "ln-breathe 4s ease-in-out infinite" }}>
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </>
  );
}

// GREETING 3 — Typewriter, warm paper tone with day/time context
export function Greeting3({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  const phrases = ["explore together...?", "write today...?", "research today...?", "create next...?"];
  const [idx, setIdx] = useState(0);
  const { shown: typed, done } = useTypewriter(phrases[idx], 90, 400);

  useEffect(() => {
    const t = setTimeout(() => setIdx(i => (i + 1) % phrases.length), 4000);
    return () => clearTimeout(t);
  }, [idx]);

  // Day + time context
  const now = new Date();
  const h = now.getHours();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[now.getDay()];
  const timeGreeting = h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 16 ? "Good afternoon" : h < 21 ? "Good evening" : "Late night";
  const firstName = userName ? userName.split(" ")[0] : "user";

  return (
    <section className="gv-section gv-g3-section" style={{ height: "auto", maxHeight: "none", flex: "none", width: "100%", paddingBottom: "12px", paddingTop: "12px" }}>
      <div className="gv-g3-bg" />
      <div className="gv-inner">
        <h1 className="gv-g3-headline gv-stagger-2" style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: "1.3" }}>
          What should we<br />
          <span className="gv-g3-typed" key={idx} style={{ fontSize: "clamp(26px, 5vw, 36px)" }}>{typed}</span>
        </h1>
        <p className="gv-g3-sub gv-stagger-3" style={{ fontSize: "20px", fontWeight: "bold", textTransform: "lowercase", marginTop: "16px" }}>
          {timeGreeting.toLowerCase()} {firstName.toLowerCase()} - happy {dayName.toLowerCase()}
        </p>
      </div>
    </section>
  );
}

// GREETING 5 — High energy Monday
export function Greeting5({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  const firstName = userName ? userName.split(" ")[0] : "user";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[new Date().getDay()];
  const h = new Date().getHours();
  const timeGreeting = h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 16 ? "Good afternoon" : h < 21 ? "Good evening" : "Late night";

  return (
    <section className="gv-section" style={{ height: "auto", maxHeight: "none", flex: "none", width: "100%", paddingBottom: "12px", paddingTop: "12px" }}>
      <div className="gv-g5-bg">
        <div className="gv-g5-orb" style={{ width: 320, height: 320, top: -80, left: -80, background: "rgba(124,58,237,.15)" }} />
        <div className="gv-g5-orb" style={{ width: 240, height: 240, bottom: -60, right: -60, background: "rgba(59,130,246,.1)" }} />
      </div>
      <div className="gv-inner">
        <div className="gv-g5-badge gv-stagger-1">
          <span className="gv-g5-pulse" />
          Monday — let&apos;s go
        </div>
        <h1 className="gv-stagger-2" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <span className="gv-g5-headline" style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: "1.3" }}>New week,</span>
          <span className="gv-g5-outline" style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: "1.3" }}>new ideas,</span>
          <span className="gv-g5-headline" style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: "1.3" }}>big moves.</span>
        </h1>
        <p className="gv-g5-sub gv-stagger-3" style={{ fontSize: "20px", fontWeight: "bold", textTransform: "lowercase", marginTop: "16px" }}>
          {timeGreeting.toLowerCase()} {firstName.toLowerCase()} - happy {dayName.toLowerCase()}
        </p>
      </div>
    </section>
  );
}

// GREETING 6 — Friday / weekend sparkle
export function Greeting6({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  const sparkles = [
    { top: "15%", left: "72%", delay: "0s" },
    { top: "30%", left: "85%", delay: ".3s" },
    { top: "55%", left: "78%", delay: ".6s" },
    { top: "20%", left: "60%", delay: ".9s" },
    { top: "65%", left: "88%", delay: ".2s" },
  ];
  const firstName = userName ? userName.split(" ")[0] : "user";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[new Date().getDay()];
  const h = new Date().getHours();
  const timeGreeting = h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 16 ? "Good afternoon" : h < 21 ? "Good evening" : "Late night";

  return (
    <section className="gv-section" style={{ height: "auto", maxHeight: "none", flex: "none", width: "100%", paddingBottom: "12px", paddingTop: "12px" }}>
      <div className="gv-g6-bg" />
      {sparkles.map((s, i) => (
        <div key={i} className="gv-g6-sparkle" style={{ top: s.top, left: s.left, animationDelay: s.delay }}>✦</div>
      ))}
      <div className="gv-inner">
        <h1 className="gv-g6-headline gv-stagger-2" style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: "1.3" }}>
          You made it to Friday{" "}
          <span className="gv-g6-emoji">🎉</span><br />
          <span style={{ fontStyle: "italic", color: "#86efac" }}>Let&apos;s finish strong.</span>
        </h1>
        <p className="gv-g6-sub gv-stagger-3" style={{ fontSize: "20px", fontWeight: "bold", textTransform: "lowercase", marginTop: "16px" }}>
          {timeGreeting.toLowerCase()} {firstName.toLowerCase()} - happy {dayName.toLowerCase()}
        </p>
      </div>
    </section>
  );
}

// GREETING 7 — Zen / minimal, light theme
export function Greeting7({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  const time = useClock();
  const fmt = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const firstName = userName ? userName.split(" ")[0] : "user";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[new Date().getDay()];
  const h = new Date().getHours();
  const timeGreeting = h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 16 ? "Good afternoon" : h < 21 ? "Good evening" : "Late night";

  return (
    <section className="gv-section gv-g7-section" style={{ height: "auto", maxHeight: "none", flex: "none", width: "100%", paddingBottom: "12px", paddingTop: "12px" }}>
      <div className="gv-g7-bg" />
      <div className="gv-inner">
        <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: ".1em", marginBottom: 24, fontVariantNumeric: "tabular-nums" }} className="gv-stagger-1">
          {fmt}
        </div>
        <h1 className="gv-g7-headline gv-stagger-2" style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: "1.3" }}>
          Hello.<br />
          What would you like<br />
          to explore today?
        </h1>
        <div className="gv-g7-rule gv-stagger-3" />
        <p className="gv-g7-sub gv-stagger-4" style={{ fontSize: "20px", fontWeight: "bold", textTransform: "lowercase", marginTop: "16px" }}>
          {timeGreeting.toLowerCase()} {firstName.toLowerCase()} - happy {dayName.toLowerCase()}
        </p>
      </div>
    </section>
  );
}

// GREETING 8 — Productivity / Focus mode with live clock
export function Greeting8({ userName, onSend }: { userName?: string; onSend?: (t: string) => void }) {
  const time = useClock();
  const h = time.getHours();
  const dayProgress = Math.round(((h * 60 + time.getMinutes()) / (24 * 60)) * 100);
  const firstName = userName ? userName.split(" ")[0] : "user";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[new Date().getDay()];
  const timeGreeting = h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 16 ? "Good afternoon" : h < 21 ? "Good evening" : "Late night";

  return (
    <section className="gv-section" style={{ height: "auto", maxHeight: "none", flex: "none", width: "100%", paddingBottom: "12px", paddingTop: "12px" }}>
      <div className="gv-g8-bg"><div className="gv-g8-grid" /></div>
      <div className="gv-inner">
        <div className="gv-g8-tag gv-stagger-1">
          <div className="gv-g8-line" />
          Focus mode
          <div className="gv-g8-line" />
        </div>
        <h1 className="gv-g8-headline gv-stagger-2" style={{ fontSize: "clamp(26px, 5vw, 36px)", lineHeight: "1.2" }}>
          {h < 12 ? "Morning briefing." : h < 17 ? "Afternoon deep work." : "Evening wind-down."}
        </h1>
        <p className="gv-g8-sub gv-stagger-3" style={{ fontSize: "20px", fontWeight: "bold", textTransform: "lowercase", marginTop: "16px" }}>
          {timeGreeting.toLowerCase()} {firstName.toLowerCase()} - happy {dayName.toLowerCase()}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }} className="gv-stagger-4">
          {[
            { val: `${dayProgress}%`, lbl: "Day progress" },
            { val: `${24 - h}h`, lbl: "Hours left" },
            { val: time.toLocaleDateString([], { weekday: "short" }), lbl: "Today" },
          ].map(s => (
            <div key={s.lbl} className="gv-g8-stat">
              <span className="gv-g8-stat-val">{s.val}</span>
              <span className="gv-g8-stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Greeting map for easy lookup
export const GREETING_VARIANTS = [
  { id: "morning", label: "Morning", C: Greeting1 },
  { id: "night", label: "Late Night", C: Greeting2 },
  { id: "typewriter", label: "Typewriter", C: Greeting3 },
  { id: "monday", label: "Monday", C: Greeting5 },
  { id: "friday", label: "Friday", C: Greeting6 },
  { id: "zen", label: "Zen", C: Greeting7 },
  { id: "focus", label: "Focus", C: Greeting8 },
] as const;

/** Rotate greeting template by day of the week */
export function pickGreeting(): typeof GREETING_VARIANTS[number] {
  // Enforce Late Night Greeting (Greeting2) if the hour is before 8am or after 10pm
  const h = new Date().getHours();
  if (h < 8 || h >= 22) {
    return GREETING_VARIANTS[1];
  }

  const day = new Date().getDay();
  // Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  const dayMap: Record<number, number> = {
    0: 5, // Sunday    → Zen
    1: 3, // Monday    → Monday Energy
    2: 6, // Tuesday   → Focus
    3: 2, // Wednesday → Typewriter
    4: 2, // Thursday  → Typewriter (replaced Rainy)
    5: 4, // Friday    → Friday Sparkle
    6: 0, // Saturday  → Morning Sunrise
  };
  return GREETING_VARIANTS[dayMap[day]];
}
