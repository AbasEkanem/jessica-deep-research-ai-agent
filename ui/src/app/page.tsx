"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { LogOut, Sun, Moon, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { LoginScreen } from "@/components/LoginScreen";
import { streamChat, fetchThreadHistory, uploadFile } from "@/lib/api";

/* ── exact colors from screenshot ── */
const C = {
  bg: "#1a1a1a",
  sidebar: "#1e1e1e",
  sidebarBorder: "#2a2a2a",
  inputBg: "#2a2a2a",
  inputBorder: "#383838",
  chipBg: "#2e2e2e",
  chipBorder: "#3a3a3a",
  text: "#e8e6e1",
  muted: "#888880",
  accent: "#cc785c",   /* the warm coral/terracotta of the asterisk */
  topBar: "#252525",
  topBarBorder: "#333",
  userBubble: "#2e2e2e",
  assistantBg: "transparent",
  dot: "#3b82f6",
};

/* ── sidebar icons (SVG paths) ── */
function Icon({ d, size = 18, stroke = C.muted, strokeWidth = 1.6 }: { d: string; size?: number; stroke?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const SUGGESTION_CHIPS = [
  { icon: "✏️", label: "Write", prompt: "Help me draft a professional research email" },
  { icon: "🎓", label: "Learn", prompt: "Explain the core concepts of agentic AI" },
  { icon: "💻", label: "Code", prompt: "Help me write a Python script to track API changes" },
  { icon: "☕", label: "Life stuff", prompt: "Help me plan a productive daily schedule" },
];

/* ── Asterisk logo (the coral starburst) ── */
function AsteriskLogo({ size = 52 }) {
  const spokes = 8;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {Array.from({ length: spokes }).map((_, i) => {
        const angle = (i * 360) / spokes;
        const rad = (angle * Math.PI) / 180;
        const x2 = 50 + 42 * Math.sin(rad);
        const y2 = 50 - 42 * Math.cos(rad);
        return (
          <line key={i} x1="50" y1="50" x2={x2} y2={y2}
            stroke={C.accent} strokeWidth="7" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

/* ── Thinking steps panel using dynamic steps from agent stream ── */
function ThinkingPanel({ steps, done }: { steps: any[]; done: boolean }) {
  if (!steps || steps.length === 0) {
    return (
      <div style={{
        background: "rgba(204,120,92,0.07)",
        border: `1px solid rgba(204,120,92,0.2)`,
        borderRadius: 10, padding: "12px 16px", marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: C.accent }}>
          <span style={{ width: 12, height: 12, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} />
          Thinking…
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(204,120,92,0.07)",
      border: `1px solid rgba(204,120,92,0.2)`,
      borderRadius: 10, padding: "12px 16px", marginBottom: 12,
      animation: "fadeUp .35s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
        fontSize: 11, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: C.accent }}>
        <span style={{ width: 12, height: 12, border: `2px solid ${C.accent}`,
          borderTopColor: "transparent", borderRadius: "50%", display: "inline-block",
          animation: done ? "none" : "spin .8s linear infinite" }} />
        {done ? "Thought process" : "Thinking…"}
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 9, padding: "4px 0",
          animation: "slideIn .25s ease both" }}>
          <span style={{ fontSize: 11, color: C.accent, minWidth: 14, marginTop: 2 }}>
            {i < steps.length - 1 || done ? "✓" : "▸"}
          </span>
          <span style={{ fontSize: 13, color: i === steps.length - 1 && !done ? C.text : "#888", fontStyle: i === steps.length - 1 && !done ? "italic" : "normal", lineHeight: 1.5 }}>
            {s.detail} {s.tool ? `(${s.tool})` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Typing dots ── */
function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%",
          background: C.muted, display: "inline-block",
          animation: `dotBounce 1.1s ease-in-out ${i*.18}s infinite` }} />
      ))}
    </span>
  );
}

/* ── Message bubble ── */
function Bubble({ msg }: { msg: any }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 24,
      flexDirection: isUser ? "row-reverse" : "row",
      animation: "fadeUp .3s ease" }}>
      {/* avatar */}
      <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        background: isUser ? "#3a3a3a" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isUser
          ? <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{msg.userNameInitials || "U"}</span>
          : <AsteriskLogo size={28} />}
      </div>
      <div style={{ maxWidth: "76%", width: "100%" }}>
        {!isUser && msg.statusSteps && msg.statusSteps.length > 0 && (
          <ThinkingPanel steps={msg.statusSteps} done={!msg.isStreaming} />
        )}
        <div style={{
          background: isUser ? C.userBubble : C.assistantBg,
          border: isUser ? `1px solid ${C.inputBorder}` : "none",
          borderRadius: isUser ? "14px 14px 4px 14px" : "0 14px 14px 14px",
          padding: isUser ? "10px 15px" : "4px 0",
          color: C.text, fontSize: 14.5, lineHeight: 1.7,
          fontFamily: isUser ? "inherit" : "'Georgia', 'Times New Roman', serif",
        }}>
          {msg.typing ? (
            <TypingDots />
          ) : isUser ? (
            msg.content
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                p: ({node, ...props}) => <p style={{ marginBottom: 14, whiteSpace: "pre-line" }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ paddingLeft: 20, marginBottom: 14 }} {...props} />,
                ol: ({node, ...props}) => <ol style={{ paddingLeft: 20, marginBottom: 14 }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: 6 }} {...props} />,
                h1: ({node, ...props}) => <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "16px 0 8px", color: C.accent }} {...props} />,
                h2: ({node, ...props}) => <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "14px 0 8px", color: C.text }} {...props} />,
                h3: ({node, ...props}) => <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "12px 0 6px", color: C.text }} {...props} />,
                code: ({node, inline, className, children, ...props}: any) => {
                  return inline ? (
                    <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 13 }} {...props}>{children}</code>
                  ) : (
                    <pre style={{ background: "rgba(255,255,255,0.04)", padding: 12, borderRadius: 8, overflowX: "auto", fontFamily: "monospace", fontSize: 13, border: "1px solid #333", margin: "8px 0" }}><code {...props}>{children}</code></pre>
                  );
                }
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function HomePage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on messages change
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load session from local storage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("jessica_user_email");
    const savedName = localStorage.getItem("jessica_user_name");
    const savedUserId = localStorage.getItem("jessica_user_id");

    if (savedEmail && savedUserId) {
      setUserEmail(savedEmail);
      setUserName(savedName || "");
      setUserId(savedUserId);
      setIsLoggedIn(true);

      const savedThreads = localStorage.getItem(`jessica_threads_${savedUserId}`);
      const savedActive = localStorage.getItem(`jessica_active_${savedUserId}`);
      if (savedThreads) {
        try { setThreads(JSON.parse(savedThreads)); } catch {}
      }
      setActiveThreadId(savedActive ?? crypto.randomUUID());
    }
    setHydrated(true);
  }, []);

  // Save threads to local storage
  useEffect(() => {
    if (!userId || threads.length === 0) return;
    localStorage.setItem(`jessica_threads_${userId}`, JSON.stringify(threads));
  }, [threads, userId]);

  // Save active thread ID
  useEffect(() => {
    if (!userId || !activeThreadId) return;
    localStorage.setItem(`jessica_active_${userId}`, activeThreadId);
  }, [activeThreadId, userId]);

  // Load history when activeThreadId changes
  useEffect(() => {
    if (!activeThreadId) return;
    let active = true;
    const loadHistory = async () => {
      const history = await fetchThreadHistory(activeThreadId);
      if (!active) return;
      
      const initials = userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "U";
      const formatted = history.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
        userNameInitials: initials,
        statusSteps: [],
        isStreaming: false
      }));
      setMessages(formatted);
    };
    loadHistory();
    return () => { active = false; };
  }, [activeThreadId, userName]);

  const resize = () => {
    const t = taRef.current;
    if (t) { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 180) + "px"; }
  };

  /* ── Rich Context-Aware Greetings ── */
  const getGreeting = () => {
    const now = new Date();
    const h = now.getHours();
    const day = now.getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[day];

    const nameStr = userName ? `, ${userName.split(" ")[0]}` : "";

    // Weekend greetings
    if (day === 0) { // Sunday
      if (h < 12) return `Happy Sunday morning${nameStr}! Wishing you a peaceful start to the day.`;
      if (h < 18) return `Happy Sunday afternoon${nameStr}! Hope you are having a wonderful weekend.`;
      return `Good Sunday evening${nameStr}! Let's prepare or wind down for the upcoming week.`;
    }
    if (day === 6) { // Saturday
      if (h < 12) return `Happy Saturday morning${nameStr}! Let's start the weekend off right.`;
      if (h < 18) return `Enjoy your Saturday afternoon${nameStr}! Hope it's relaxing.`;
      return `Good Saturday evening${nameStr}! How can I help you tonight?`;
    }

    // Mon/Fri specific vibes
    if (day === 1) { // Monday
      if (h < 12) return `Good Monday morning${nameStr}! Let's start the new week strong.`;
      if (h < 18) return `Happy Monday afternoon${nameStr}! Powering through the start of the week.`;
      return `Good Monday evening${nameStr}! First day of the week completed. How can I help?`;
    }
    if (day === 5) { // Friday
      if (h < 12) return `Happy Friday morning${nameStr}! Almost the weekend. Let's finish strong!`;
      if (h < 18) return `Good Friday afternoon${nameStr}! Wrap up time. What research do we need?`;
      return `Happy Friday evening${nameStr}! The weekend is here. How can I assist you?`;
    }

    // Midweek greetings
    if (h < 12) return `Good ${dayName} morning${nameStr}! Let's build something great today.`;
    if (h < 18) return `Good ${dayName} afternoon${nameStr}! Hope your day is going productively.`;
    return `Good ${dayName} evening${nameStr}! Winding down or starting a deep project?`;
  };

  const handleFiles = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (!files.length) return;
    for (const file of files) {
      try {
        const res = await uploadFile(file);
        setAttachedFiles(prev => [...prev, { name: file.name, path: res.path }]);
      } catch (err) {
        alert("File upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    }
    e.target.value = "";
  };

  const removeFile = (idx: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleNewThread = () => {
    setActiveThreadId(crypto.randomUUID());
  };

  const handleDeleteThread = (id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (id === activeThreadId) setActiveThreadId(crypto.randomUUID());
  };

  const handleLogin = (email: string, firstName: string, lastName: string) => {
    const uid = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const name = firstName + (lastName ? " " + lastName : "");
    localStorage.setItem("jessica_user_email", email);
    localStorage.setItem("jessica_user_name", name);
    localStorage.setItem("jessica_user_id", uid);
    setUserEmail(email);
    setUserName(name);
    setUserId(uid);
    setActiveThreadId(crypto.randomUUID());
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("jessica_user_email");
    localStorage.removeItem("jessica_user_name");
    localStorage.removeItem("jessica_user_id");
    setIsLoggedIn(false);
    setUserEmail("");
    setUserName("");
    setUserId("");
    setThreads([]);
    setActiveThreadId("");
  };

  const send = async (text: string) => {
    if ((!text.trim() && attachedFiles.length === 0) || loading) return;
    setLoading(true);
    
    // Build context prompt if files are attached
    let finalQuery = text.trim();
    if (attachedFiles.length > 0) {
      finalQuery += "\n\n[Attached files:\n" + attachedFiles.map(f => `- ${f.name} (uploaded to ${f.path})`).join("\n") + "]";
    }
    
    setInput("");
    setAttachedFiles([]);
    if (taRef.current) taRef.current.style.height = "auto";

    const initials = userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "U";
    
    const userMsg = { role: "user", content: finalQuery, userNameInitials: initials };
    
    // Save to threads sidebar list if it's the first message
    if (messages.length === 0) {
      const title = text.length > 36 ? text.slice(0, 36) + "…" : text;
      setThreads(prev => {
        const exists = prev.find(t => t.id === activeThreadId);
        if (exists) return prev;
        return [{ id: activeThreadId, title, timestamp: Date.now() }, ...prev];
      });
    }

    setMessages(prev => [...prev, userMsg]);

    const agentMsgId = `agent-${Date.now()}`;
    const agentMsg = {
      id: agentMsgId,
      role: "assistant",
      content: "",
      typing: true,
      statusSteps: [] as any[],
      isStreaming: true
    };
    
    setMessages(prev => [...prev, agentMsg]);

    try {
      let isFirstResponse = true;
      for await (const event of streamChat(finalQuery, activeThreadId, userId)) {
        if (event.type === "status") {
          const d = event.data as { phase: string; detail: string; tool?: string };
          setMessages(prev => prev.map(m => m.id === agentMsgId ? {
            ...m,
            statusSteps: [...(m.statusSteps || []), { phase: d.phase, detail: d.detail, tool: d.tool }]
          } : m));
        } else if (event.type === "response") {
          const content = event.data as string;
          setMessages(prev => prev.map(m => m.id === agentMsgId ? {
            ...m,
            content,
            typing: false
          } : m));
        }
      }
      setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, isStreaming: false, typing: false } : m));
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === agentMsgId ? {
        ...m,
        content: `⚠️ Error communicating with agent: ${err instanceof Error ? err.message : "Unknown error"}`,
        typing: false,
        isStreaming: false
      } : m));
    }
    
    setLoading(false);
  };

  const isEmpty = messages.length === 0;

  if (!hydrated) return null;

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.text, overflow: "hidden" }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? 240 : 0,
        minWidth: sidebarOpen ? 240 : 0,
        overflow: "hidden",
        background: C.sidebar,
        borderRight: sidebarOpen ? `1px solid ${C.sidebarBorder}` : "none",
        display: "flex", flexDirection: "column",
        flexShrink: 0,
        transition: "width .25s ease, min-width .25s ease",
      }}>
        {/* Header: Jessica 3.0 + collapse button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 14px 8px 18px", flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.02em",
            fontFamily: "'Georgia', serif" }}>Jessica <span style={{ color: C.accent }}>3.0</span></span>
          <button onClick={() => setSidebarOpen(false)} title="Collapse sidebar"
            style={{ width: 32, height: 32, borderRadius: 7, background: "transparent", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.7" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
        </div>

        {/* Nav items — only New chat */}
        <nav style={{ padding: "4px 8px", flexShrink: 0 }}>
          <button onClick={handleNewThread}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "9px 10px", borderRadius: 8, background: "transparent", border: "none",
              cursor: "pointer", color: C.text, fontSize: 14, fontFamily: "inherit",
              textAlign: "left", transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Icon d="M12 5v14M5 12h14" size={17} />
            <span>New chat</span>
          </button>
        </nav>

        {/* Recents — live chat history container */}
        <div style={{ padding: "14px 8px 6px 18px", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Recents</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {threads.length === 0 ? (
            /* empty placeholder */
            <div style={{ margin: "8px 4px", padding: "14px 12px", borderRadius: 10,
              border: `1px dashed ${C.sidebarBorder}`, color: "#555", fontSize: 13,
              textAlign: "center", lineHeight: 1.6 }}>
              Your conversations<br/>will appear here
            </div>
          ) : (
            /* live chat sessions */
            threads.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4, width: "100%", position: "relative", marginBottom: 2 }}>
                <button
                  onClick={() => setActiveThreadId(t.id)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 10px", borderRadius: 8,
                    background: t.id === activeThreadId ? "rgba(255,255,255,0.07)" : "transparent",
                    border: "none", cursor: "pointer", color: t.id === activeThreadId ? C.text : "#aaa",
                    fontSize: 13.5, fontFamily: "inherit", textAlign: "left",
                    transition: "background .15s", gap: 6, overflow: "hidden" }}
                  onMouseEnter={e => { if (t.id !== activeThreadId) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (t.id !== activeThreadId) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {t.title}
                  </span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteThread(t.id); }}
                  title="Delete chat"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "8px", fontSize: 16, lineHeight: 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                  onMouseLeave={e => e.currentTarget.style.color = "#555"}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer: user + download */}
        <div style={{ borderTop: `1px solid ${C.sidebarBorder}`, padding: "12px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#3a3a3a",
              border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: C.text, flexShrink: 0 }}>
              {userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "U"}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{userName ? userName.split(" ")[0] : "User"}</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>Premium workspace</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={handleLogout} title="Sign out"
              style={{ width: 32, height: 32, borderRadius: 7, background: "rgba(255,255,255,0.06)",
                border: "1px solid #3a3a3a", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
              <LogOut size={15} style={{ color: C.muted }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

        {/* Top bar */}
        <div style={{ height: 48, display: "flex", alignItems: "center",
          padding: "0 14px", borderBottom: `1px solid ${C.sidebarBorder}`,
          background: C.sidebar, flexShrink: 0 }}>
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
              style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .15s", animation: "fadeUp .2s ease" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
            </button>
          )}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {isEmpty ? (
            /* ── EMPTY STATE ── */
            <div style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 36, padding: "60px 20px 160px" }}>

              {/* greeting */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, textAlign: "center", flexDirection: "column" }}>
                <AsteriskLogo size={54} />
                <h1 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 300,
                  letterSpacing: "-0.02em", margin: 0, color: C.text,
                  fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                  {getGreeting()}
                </h1>
              </div>

              {/* input box */}
              <div style={{ width: "100%", maxWidth: 680 }}>
                <div style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`,
                  borderRadius: 16, padding: "18px 18px 14px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
                  {/* attached file pills */}
                  {attachedFiles.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                      {attachedFiles.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6,
                          background: "rgba(255,255,255,0.07)", border: "1px solid #444",
                          borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.text }}>
                          <span>📄</span>
                          <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                          <button onClick={() => removeFile(i)} style={{ background: "none", border: "none",
                            cursor: "pointer", color: C.muted, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={taRef}
                    value={input}
                    onChange={e => { setInput(e.target.value); resize(); }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                    placeholder="How can I help you today?"
                    rows={1}
                    style={{ width: "100%", background: "transparent", border: "none", outline: "none",
                      color: C.text, fontSize: 15, lineHeight: 1.6, resize: "none",
                      fontFamily: "inherit", maxHeight: 180, overflowY: "auto",
                      marginBottom: 10 }}
                  />
                  {/* bottom row of input */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {/* hidden real file input */}
                    <input ref={fileInputRef} type="file" multiple onChange={handleFiles}
                      style={{ display: "none" }} accept="*/*" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach files"
                      style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                        border: "none", cursor: "pointer", color: C.muted, fontSize: 20, lineHeight: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
                      +
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button
                        onClick={() => send(input)}
                        disabled={(!input.trim() && attachedFiles.length === 0) || loading}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "none",
                          background: (input.trim() || attachedFiles.length > 0) && !loading ? C.accent : "rgba(255,255,255,0.08)",
                          cursor: (input.trim() || attachedFiles.length > 0) && !loading ? "pointer" : "not-allowed",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background .2s",
                          boxShadow: (input.trim() || attachedFiles.length > 0) && !loading ? `0 0 10px rgba(204,120,92,.4)` : "none" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* suggestion chips */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16, justifyContent: "center" }}>
                  {SUGGESTION_CHIPS.map(chip => (
                    <button key={chip.label}
                      onClick={() => send(chip.prompt)}
                      style={{ display: "flex", alignItems: "center", gap: 7,
                        background: C.chipBg, border: `1px solid ${C.chipBorder}`,
                        borderRadius: 20, padding: "8px 16px", color: C.text,
                        fontSize: 13.5, cursor: "pointer", fontFamily: "inherit",
                        transition: "border-color .15s, background .15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.background = "#363636"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.chipBorder; e.currentTarget.style.background = C.chipBg; }}>
                      <span style={{ fontSize: 14 }}>{chip.icon}</span>
                      {chip.label}
                    </button>
                  ))}
                </div>

              </div>
            </div>
          ) : (
            /* ── CHAT VIEW ── */
            <div style={{ maxWidth: 720, width: "100%", margin: "0 auto",
              padding: "32px 24px 180px", flex: 1 }}>
              {messages.map((m, i) => <Bubble key={i} msg={m} />)}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── FLOATING INPUT (chat mode) ── */}
        {!isEmpty && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "12px 24px 20px",
            background: `linear-gradient(transparent, ${C.bg} 38%)` }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`,
                borderRadius: 16, padding: "14px 16px 12px",
                boxShadow: "0 4px 24px rgba(0,0,0,.5)" }}>
                {/* attached file pills */}
                {attachedFiles.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {attachedFiles.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(255,255,255,0.07)", border: "1px solid #444",
                        borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.text }}>
                        <span>📄</span>
                        <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        <button onClick={() => removeFile(i)} style={{ background: "none", border: "none",
                          cursor: "pointer", color: C.muted, fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); resize(); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Reply to Jessica…"
                  rows={1}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none",
                    color: C.text, fontSize: 15, lineHeight: 1.6, resize: "none",
                    fontFamily: "inherit", maxHeight: 160, overflowY: "auto", marginBottom: 10 }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button onClick={() => fileInputRef.current?.click()} title="Attach files"
                    style={{ width: 28, height: 28, borderRadius: "50%",
                      background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer",
                      color: C.muted, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
                    +
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={() => send(input)}
                      disabled={(!input.trim() && attachedFiles.length === 0) || loading}
                      style={{ width: 32, height: 32, borderRadius: 8, border: "none",
                        background: (input.trim() || attachedFiles.length > 0) && !loading ? C.accent : "rgba(255,255,255,0.08)",
                        cursor: (input.trim() || attachedFiles.length > 0) && !loading ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .2s",
                        boxShadow: (input.trim() || attachedFiles.length > 0) && !loading ? `0 0 10px rgba(204,120,92,.4)` : "none" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="none" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        textarea::placeholder { color: #555; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes dotBounce { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-5px); opacity:1; } }
      `}</style>
    </div>
  );
}
