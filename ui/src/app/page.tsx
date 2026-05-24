"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { LogOut, Sun, Moon, Sparkles, ThumbsUp, Copy, RefreshCw, Edit2, PenSquare, Search, LayoutGrid, History, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { LoginScreen } from "@/components/LoginScreen";
import { streamChat, fetchThreadHistory, uploadFile } from "@/lib/api";
import AgentSearchCard, { isDeepResearch } from "@/components/AgentSearchCard";
import "katex/dist/katex.min.css";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";

function preprocessMath(text: string): string {
  if (!text) return "";
  let processed = text;
  
  // Convert \[ and \] to $$
  processed = processed.replace(/\\\[/g, "\n$$\n").replace(/\\\]/g, "\n$$\n");
  // Convert \( and \) to $
  processed = processed.replace(/\\\(/g, "$").replace(/\\\)/g, "$");
  
  // Upgrade any multi-line $...$ to $$...$$
  // Ensures we don't accidentally match existing $$...$$ blocks
  processed = processed.replace(/(^|[^$\\])\$([^$]+?)\$(?!\$)/g, (match, prefix, inner) => {
    if (inner.includes("\n")) {
      return prefix + "$$" + inner + "$$";
    }
    return match;
  });
  return processed;
}
/* ── exact colors from screenshot ── */
const C = {
  bg: "var(--bg)",
  sidebar: "var(--sidebar)",
  sidebarBorder: "var(--sidebarBorder)",
  inputBg: "var(--inputBg)",
  inputBorder: "var(--inputBorder)",
  chipBg: "var(--chipBg)",
  chipBorder: "var(--chipBorder)",
  text: "var(--text)",
  muted: "var(--muted)",
  accent: "var(--accent)",
  topBar: "var(--topBar)",
  topBarBorder: "var(--topBarBorder)",
  userBubble: "var(--userBubble)",
  assistantBg: "var(--assistantBg)",
  dot: "var(--dot)",
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
/* ── Clipboard helper (safe in HTTP + HTTPS) ── */
function copyToClipboard(text: string): Promise<void> {
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text: string): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand("copy"); } catch (_) {}
  document.body.removeChild(ta);
}
/* ── Message bubble ── */
function Bubble({
  msg, prevMsg, onRegenerate, onRefresh, onEdit
}: {
  msg: any;
  prevMsg?: any;
  onRegenerate?: (id: string) => void;
  onRefresh?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isUser = msg.role === "user";
  const isResearch = !isUser && prevMsg && isDeepResearch(prevMsg.content);
  // ── Toolbar state ──
  const [liked,     setLiked]     = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText,  setEditText]  = useState(msg.content || "");
  const handleCopy = (text: string) => {
    copyToClipboard(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== msg.content) {
      onEdit && onEdit(msg.id, trimmed);
    }
    setIsEditing(false);
  };
  const actions = (msg.statusSteps || [])
    .filter((s: any) => !(msg.isStreaming === false && (s.detail || "").includes("Thinking")))
    .map((s: any, i: number, arr: any[]) => {
      let type = "think";
      if (s.tool?.includes("search")) type = "search";
      else if (s.tool?.includes("memory")) type = "write";
      else if (s.tool?.includes("read")) type = "read";
      return {
        type,
        label: s.detail || (s.tool ? `Using ${s.tool}` : "Working..."),
        done: i < arr.length - 1 || !msg.isStreaming
      };
    });
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 24,
      flexDirection: isUser ? "row-reverse" : "row",
      animation: "fadeUp .3s ease" }}>
      {/* avatar */}
      <div style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        background: isUser ? C.chipBg : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {isUser
          ? <span style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>{msg.userNameInitials || "U"}</span>
          : <img src="/jessica-png.png" alt="Jessica" style={{ width: 46, height: 46, objectFit: "cover", mixBlendMode: isDark ? "screen" : "multiply", filter: isDark ? "contrast(200%)" : "invert(1) contrast(200%)", transform: "scale(1.08)" }} />}
      </div>
      <div style={{ maxWidth: "76%", width: "100%" }}>
        {!isUser && isResearch && (
          <AgentSearchCard
            phase={msg.isStreaming ? "working" : "done"}
            actions={actions}
            searchQuery={prevMsg.content.length > 60 ? prevMsg.content.slice(0, 60) + "…" : prevMsg.content}
          />
        )}
        {/* Message body / edit mode */}
        {isEditing && isUser ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } if (e.key === "Escape") setIsEditing(false); }}
              autoFocus
              rows={Math.max(2, editText.split("\n").length)}
              style={{
                width: "100%", background: C.inputBg, border: `1px solid ${C.accent}`,
                borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14.5,
                lineHeight: 1.7, resize: "vertical", fontFamily: "inherit",
                outline: "none", boxSizing: "border-box"
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{ padding: "5px 14px", borderRadius: 7, border: `1px solid #444`, background: "transparent",
                  color: C.muted, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{ padding: "5px 14px", borderRadius: 7, border: "none", background: C.accent,
                  color: "#fff", fontSize: 12.5, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
                Save & Send
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: isUser ? C.userBubble : C.assistantBg,
            border: isUser ? `1px solid ${C.inputBorder}` : "none",
            borderRadius: isUser ? "14px 14px 4px 14px" : "0 14px 14px 14px",
            padding: isUser ? "10px 15px" : "4px 0",
            color: C.text, fontSize: 14.5, lineHeight: 1.7,
            fontFamily: isUser ? "inherit" : "'Georgia', 'Times New Roman', serif",
          }}>
            {msg.typing || (msg.isStreaming && !msg.content && !isResearch && !isUser) ? (
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
                {preprocessMath(msg.content)}
              </ReactMarkdown>
            )}
          </div>
        )}
        {/* ── Interaction Toolbar ── */}
        {!msg.typing && !msg.isStreaming && msg.content && !isEditing && (
          <div style={{
            display: "flex", gap: 12, marginTop: 8,
            justifyContent: isUser ? "flex-end" : "flex-start",
            color: C.muted, alignItems: "center",
          }}>
            {isUser ? (
              /* USER toolbar: Edit | Copy | Refresh */
              <>
                <button
                  onClick={() => { setEditText(msg.content); setIsEditing(true); }}
                  title="Edit message"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleCopy(msg.content)}
                  title={copied ? "Copied!" : "Copy message"}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: copied ? "#4caf50" : "inherit", display: "flex", alignItems: "center", gap: 4, transition: "color .2s" }}
                  onMouseEnter={e => { if (!copied) e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { if (!copied) e.currentTarget.style.color = C.muted; }}>
                  <Copy size={13} />
                  {copied && <span style={{ fontSize: 11, fontWeight: 600 }}>Copied!</span>}
                </button>
                <button
                  onClick={() => onRefresh && onRefresh(msg.id)}
                  title="Regenerate response"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                  <RefreshCw size={13} />
                </button>
              </>
            ) : (
              /* AGENT toolbar: Like | Copy | Regenerate */
              <>
                <button
                  onClick={() => setLiked(v => !v)}
                  title={liked ? "Unlike" : "Like response"}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: liked ? C.accent : "inherit", display: "flex", alignItems: "center", transition: "color .2s" }}
                  onMouseEnter={e => { if (!liked) e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { if (!liked) e.currentTarget.style.color = C.muted; }}>
                  <ThumbsUp size={13} fill={liked ? C.accent : "none"} />
                </button>
                <button
                  onClick={() => handleCopy(msg.content)}
                  title={copied ? "Copied!" : "Copy response"}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: copied ? "#4caf50" : "inherit", display: "flex", alignItems: "center", gap: 4, transition: "color .2s" }}
                  onMouseEnter={e => { if (!copied) e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { if (!copied) e.currentTarget.style.color = C.muted; }}>
                  <Copy size={13} />
                  {copied && <span style={{ fontSize: 11, fontWeight: 600 }}>Copied!</span>}
                </button>
                <button
                  onClick={() => onRegenerate && onRegenerate(msg.id)}
                  title="Regenerate response"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "inherit", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                  <RefreshCw size={13} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
/* ── Settings Modal ── */
function SettingsModal({ onClose, userName, userEmail, onLogout }: { onClose: () => void, userName: string, userEmail: string, onLogout: () => void }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background: C.sidebar,
        border: `1px solid ${C.sidebarBorder}`,
        borderRadius: 14, width: "100%", maxWidth: 360, padding: "24px 24px 20px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        position: "relative",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: C.text, fontFamily: "inherit", letterSpacing: "-0.01em" }}>
          Settings
        </h2>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, fontFamily: "inherit" }}>
          Preferences and Account
        </p>

        {/* Account Info */}
        <div style={{ marginBottom: 20, padding: "12px", background: C.inputBg, borderRadius: 8, border: `1px solid ${C.inputBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 4, textTransform: "uppercase" }}>Account</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{userName || "User"}</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{userEmail || "Not logged in"}</div>
          <button onClick={onLogout} style={{
            width: "100%", padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
            background: "transparent", color: "#e5534b", border: "1px solid #e5534b",
            cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(229,83,75,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >Sign Out</button>
        </div>

        {/* Theme Toggle */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Theme</div>
          <button onClick={toggle} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7,
            background: C.inputBg, border: `1px solid ${C.inputBorder}`, cursor: "pointer",
            color: C.text, fontSize: 13, fontFamily: "inherit",
          }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
            background: C.accent, color: "white", border: "none",
            cursor: "pointer", fontFamily: "inherit",
            transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >Close</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function HomePage() {
  const { data: session, status } = useSession();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const userId = session?.user?.email || "";
  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || "";
  const isLoggedIn = status === "authenticated";
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [hydrated, setHydrated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
  // Scroll to bottom on messages change
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  // Load session from local storage on mount
  useEffect(() => {
    if (status === "authenticated" && userId) {
      const savedThreads = localStorage.getItem(`jessica_threads_${userId}`);
      const savedActive = localStorage.getItem(`jessica_active_${userId}`);
      if (savedThreads) {
        try { setThreads(JSON.parse(savedThreads)); } catch {}
      }
      setActiveThreadId(savedActive ?? crypto.randomUUID());
    }
    if (status !== "loading") {
      setHydrated(true);
    }
  }, [status, userId]);
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
    const min = now.getMinutes();
    const day = now.getDay();
    const decimalHour = h + min / 60;
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = dayNames[day];
    const nameStr = userName ? `, ${userName.split(" ")[0]}` : "";
    const isEarlyMorning   = decimalHour >= 5   && decimalHour < 7;
    const isMorning        = decimalHour >= 7   && decimalHour < 12;
    const isLunch          = decimalHour >= 12  && decimalHour < 13.5;
    const isAfternoon      = decimalHour >= 13.5 && decimalHour < 17;
    const isLateAfternoon  = decimalHour >= 16  && decimalHour < 18;
    const isEvening        = decimalHour >= 18  && decimalHour < 21;
    const isNight          = decimalHour >= 21  && decimalHour < 24;
    const isLateNight      = decimalHour >= 0   && decimalHour < 5;
    const isWeekend = day === 0 || day === 6;
    const isFriday  = day === 5;
    const isMonday  = day === 1;
    const isSunday  = day === 0;
    if (isLateNight) return { title: `Still up${nameStr}?`, subtitle: "Burning the midnight oil — I'm here whenever you need me." };
    if (isEarlyMorning) return { title: `Early start${nameStr}!`, subtitle: isWeekend ? "Up early on the weekend — making the most of it!" : "You're ahead of the curve today." };
    if (isWeekend) {
      const dayLabel = isSunday ? "Sunday" : "Saturday";
      if (isMorning) return { title: `Happy ${dayLabel} morning${nameStr}!`, subtitle: isSunday ? "A peaceful start — take it slow if you can." : "Let's kick the weekend off right!" };
      if (isLunch) return { title: `${dayLabel} lunch time${nameStr}!`, subtitle: "Refuel and enjoy the weekend." };
      if (isAfternoon) return { title: `Good ${dayLabel} afternoon${nameStr}!`, subtitle: isSunday ? "Hope the weekend has been great so far." : "Afternoon on a Saturday — make it count!" };
      if (isLateAfternoon) return { title: `${dayLabel} late afternoon${nameStr}`, subtitle: isSunday ? "The weekend is winding down — enjoy every moment." : "Getting ready for Saturday evening?" };
      if (isEvening) return { title: `Good ${dayLabel} evening${nameStr}!`, subtitle: isSunday ? "Let's ease into the week ahead." : "How is the Saturday evening going?" };
      return { title: `Good ${dayLabel} night${nameStr}!`, subtitle: isSunday ? "Rest up — new week starts tomorrow." : "Wrapping up the weekend — hope it was great!" };
    }
    if (isMonday) {
      if (isMorning) return { title: `Good Monday morning${nameStr}!`, subtitle: "New week, fresh start — let's make it count." };
      if (isLunch) return { title: `Monday lunch${nameStr}!`, subtitle: "Halfway through the first day — you've got this." };
      if (isAfternoon || isLateAfternoon) return { title: `Monday afternoon${nameStr}`, subtitle: "Grinding through Monday — the hardest part of the week." };
      if (isEvening) return { title: `Monday evening${nameStr}`, subtitle: "Day one done. How can I help you wind down?" };
      return { title: `Monday night${nameStr}`, subtitle: "Rest up — four more days to go!" };
    }
    if (isFriday) {
      if (isMorning) return { title: `Happy Friday${nameStr}! 🎉`, subtitle: "The finish line is in sight — let's close the week strong." };
      if (isLunch) return { title: `Friday lunch${nameStr}!`, subtitle: "Almost there — enjoy this one." };
      if (isAfternoon || isLateAfternoon) return { title: `Friday afternoon${nameStr}!`, subtitle: "The weekend is basically here. What do you need before you wrap up?" };
      if (isEvening) return { title: `Happy Friday evening${nameStr}!`, subtitle: "Weekend mode: activated. How can I help?" };
      return { title: `Friday night${nameStr}!`, subtitle: "The week is behind you — enjoy it!" };
    }
    const midWeekMorningSubtitles: Record<number, string> = { 2: "Tuesday energy — building on yesterday's momentum.", 3: "Happy hump day — downhill from here!", 4: "Thursday: the Friday of serious people." };
    const midWeekEveningSubtitles: Record<number, string> = { 2: "Tuesday done. Keep the streak going.", 3: "Over the hump — well done.", 4: "Almost Friday. You can feel it." };
    if (isMorning) return { title: `Good morning${nameStr}!`, subtitle: midWeekMorningSubtitles[day] ?? "Let's have a productive day." };
    if (isLunch) return { title: `Lunch time${nameStr}!`, subtitle: "Step away, refuel, and come back strong." };
    if (isAfternoon) return { title: `Good afternoon${nameStr}!`, subtitle: "Deep work hours — you're in the zone." };
    if (isLateAfternoon) return { title: `Late afternoon${nameStr}`, subtitle: "Wrapping up the workday — anything to finish off?" };
    if (isEvening) return { title: `Good evening${nameStr}!`, subtitle: midWeekEveningSubtitles[day] ?? "Hope the day treated you well." };
    return { title: `Good night${nameStr}`, subtitle: "Rest well — tomorrow's another good day." };
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
  const handleNewThread = () => { setActiveThreadId(crypto.randomUUID()); };
  const handleDeleteThread = (id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (id === activeThreadId) setActiveThreadId(crypto.randomUUID());
  };
  const handleLogin = (email: string, firstName: string, lastName: string) => {};
  const handleLogout = () => {
    setThreads([]);
    setActiveThreadId("");
    setMessages([]);
    signOut();
  };
  const send = async (text: string) => {
    if ((!text.trim() && attachedFiles.length === 0) || loading) return;
    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let finalQuery = text.trim();
    if (attachedFiles.length > 0) {
      finalQuery += "\n\n[Attached files:\n" + attachedFiles.map(f => `- ${f.name} (uploaded to ${f.path})`).join("\n") + "]";
    }
    setInput("");
    setAttachedFiles([]);
    if (taRef.current) taRef.current.style.height = "auto";
    const initials = userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "U";
    const userMsg = { id: `user-${Date.now()}`, role: "user", content: finalQuery, userNameInitials: initials };
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
    const agentMsg = { id: agentMsgId, role: "assistant", content: "", typing: true, statusSteps: [] as any[], isStreaming: true };
    setMessages(prev => [...prev, agentMsg]);
    try {
      for await (const event of streamChat(finalQuery, activeThreadId, userId, userName, controller.signal)) {
        if (event.type === "status") {
          const d = event.data as { phase: string; detail: string; tool?: string };
          setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, statusSteps: [...(m.statusSteps || []), { phase: d.phase, detail: d.detail, tool: d.tool }] } : m));
        } else if (event.type === "response") {
          const content = event.data as string;
          setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, content, typing: false } : m));
        }
      }
      setMessages(prev => prev.map(m => m.id === agentMsgId ? { ...m, isStreaming: false, typing: false } : m));
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setMessages(prev => prev.map(m => m.id === agentMsgId ? {
        ...m,
        content: isAbort ? (m.content ? m.content + "\n\n⏹️ *Generation stopped by user.*" : "⏹️ *Generation stopped by user.*") : `⚠️ Error communicating with agent: ${err instanceof Error ? err.message : "Unknown error"}`,
        typing: false, isStreaming: false
      } : m));
    }
    abortControllerRef.current = null;
    setLoading(false);
  };
  const handleRegenerate = async (agentMsgId: string) => {
    if (loading) return;
    const idx = messages.findIndex(m => m.id === agentMsgId);
    if (idx === -1) return;
    const userMsg = messages[idx - 1];
    if (!userMsg || userMsg.role !== "user") return;
    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const finalQuery = userMsg.content;
    const freshAgentMsgId = `agent-${Date.now()}`;
    const freshAgentMsg = { id: freshAgentMsgId, role: "assistant", content: "", typing: true, statusSteps: [] as any[], isStreaming: true };
    setMessages(prev => { const sliced = prev.slice(0, idx); return [...sliced, freshAgentMsg]; });
    try {
      for await (const event of streamChat(finalQuery, activeThreadId, userId, userName, controller.signal)) {
        if (event.type === "status") {
          const d = event.data as { phase: string; detail: string; tool?: string };
          setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, statusSteps: [...(m.statusSteps || []), { phase: d.phase, detail: d.detail, tool: d.tool }] } : m));
        } else if (event.type === "response") {
          const content = event.data as string;
          setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, content, typing: false } : m));
        }
      }
      setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, isStreaming: false, typing: false } : m));
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? {
        ...m,
        content: isAbort ? (m.content ? m.content + "\n\n⏹️ *Generation stopped by user.*" : "⏹️ *Generation stopped by user.*") : `⚠️ Error communicating with agent: ${err instanceof Error ? err.message : "Unknown error"}`,
        typing: false, isStreaming: false
      } : m));
    }
    abortControllerRef.current = null;
    setLoading(false);
  };
  const handleRefresh = async (userMsgId: string) => {
    if (loading) return;
    const idx = messages.findIndex(m => m.id === userMsgId);
    if (idx === -1) return;
    const agentMsg = messages[idx + 1];
    if (agentMsg && agentMsg.role === "assistant") {
      await handleRegenerate(agentMsg.id);
    } else {
      const userMsg = messages[idx];
      setLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const finalQuery = userMsg.content;
      const freshAgentMsgId = `agent-${Date.now()}`;
      const freshAgentMsg = { id: freshAgentMsgId, role: "assistant", content: "", typing: true, statusSteps: [] as any[], isStreaming: true };
      setMessages(prev => { const sliced = prev.slice(0, idx + 1); return [...sliced, freshAgentMsg]; });
      try {
        for await (const event of streamChat(finalQuery, activeThreadId, userId, userName, controller.signal)) {
          if (event.type === "status") {
            const d = event.data as { phase: string; detail: string; tool?: string };
            setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, statusSteps: [...(m.statusSteps || []), { phase: d.phase, detail: d.detail, tool: d.tool }] } : m));
          } else if (event.type === "response") {
            const content = event.data as string;
            setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, content, typing: false } : m));
          }
        }
        setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, isStreaming: false, typing: false } : m));
      } catch (err) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? {
          ...m,
          content: isAbort ? (m.content ? m.content + "\n\n⏹️ *Generation stopped by user.*" : "⏹️ *Generation stopped by user.*") : `⚠️ Error communicating with agent: ${err instanceof Error ? err.message : "Unknown error"}`,
          typing: false, isStreaming: false
        } : m));
      }
      abortControllerRef.current = null;
      setLoading(false);
    }
  };
  const handleEditSubmit = async (userMsgId: string, newContent: string) => {
    if (loading) return;
    const idx = messages.findIndex(m => m.id === userMsgId);
    if (idx === -1) return;
    const updatedUserMsg = { ...messages[idx], content: newContent };
    const freshAgentMsgId = `agent-${Date.now()}`;
    const freshAgentMsg = { id: freshAgentMsgId, role: "assistant", content: "", typing: true, statusSteps: [] as any[], isStreaming: true };
    setMessages([...messages.slice(0, idx), updatedUserMsg, freshAgentMsg]);
    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      for await (const event of streamChat(newContent, activeThreadId, userId, userName, controller.signal)) {
        if (event.type === "status") {
          const d = event.data as { phase: string; detail: string; tool?: string };
          setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, statusSteps: [...(m.statusSteps || []), { phase: d.phase, detail: d.detail, tool: d.tool }] } : m));
        } else if (event.type === "response") {
          const content = event.data as string;
          setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, content, typing: false } : m));
        }
      }
      setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? { ...m, isStreaming: false, typing: false } : m));
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setMessages(prev => prev.map(m => m.id === freshAgentMsgId ? {
        ...m,
        content: isAbort ? (m.content ? m.content + "\n\n⏹️ *Generation stopped.*" : "⏹️ *Generation stopped.*") : `⚠️ Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        typing: false, isStreaming: false
      } : m));
    }
    abortControllerRef.current = null;
    setLoading(false);
  };
  const isEmpty = messages.length === 0;
  if (!hydrated) return null;
  if (!isLoggedIn) return <LoginScreen />;

  /* ── Gemini-style collapsed icon strip ── */
  const CollapsedIconStrip = () => {
    const iconBtn = (title: string, onClick: () => void, children: React.ReactNode, extraStyle?: React.CSSProperties) => (
      <button
        title={title}
        onClick={onClick}
        style={{
          width: 40, height: 40, borderRadius: 12,
          background: "transparent", border: "none",
          cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
          color: C.muted, transition: "background .15s, color .15s",
          ...extraStyle,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          e.currentTarget.style.color = C.text;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = (extraStyle?.color as string) ?? C.muted;
        }}
      >
        {children}
      </button>
    );

    const userInitials = userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "U";

    return (
      <div style={{
        width: 56,
        minWidth: 56,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 10,
        paddingBottom: 12,
        flexShrink: 0,
        background: "transparent",
        /* no border, no background — pure floating icons like Gemini */
      }}>
        {/* Top group */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {iconBtn("Open sidebar", () => setSidebarOpen(true),
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          )}
          {iconBtn("New chat", handleNewThread,
            <PenSquare size={17} strokeWidth={1.7} />
          )}
          {iconBtn("Search chats", () => {
            setShowSearchModal(true);
          },
            <Search size={17} strokeWidth={1.7} />
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom group */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {iconBtn("Recent chats", () => setSidebarOpen(true),
            <History size={17} strokeWidth={1.7} />
          )}
          {/* Settings with blue dot — matches Gemini */}
          <div style={{ position: "relative" }}>
            {iconBtn("Settings", () => setShowSettings(true),
              <Settings size={17} strokeWidth={1.7} />
            )}
            <span style={{
              position: "absolute", top: 7, right: 7,
              width: 7, height: 7, borderRadius: "50%",
              background: C.dot,
              border: `1.5px solid ${C.bg}`,
              pointerEvents: "none",
            }} />
          </div>
          {/* Avatar / logout */}
          <button
            title="Sign out"
            onClick={handleLogout}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#3a3a3a", border: "1.5px solid #555",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: C.text,
              marginTop: 4, transition: "border-color .15s",
              overflow: "hidden",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#555")}
          >
            {userInitials}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={isDark ? "theme-dark" : "theme-light"} style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.text, overflow: "hidden" }}>
      {/* ── LEFT SIDEBAR (open) ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
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
        {/* Nav items */}
        <nav style={{ padding: "4px 8px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
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

          {isSearching ? (
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px" }}>
              <Search size={15} style={{ color: C.muted, marginRight: 8 }} />
              <input
                autoFocus
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent", border: "none", color: C.text, outline: "none",
                  fontSize: 13, width: "100%", fontFamily: "inherit"
                }}
              />
              <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", marginLeft: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          ) : (
            <button onClick={() => setIsSearching(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "9px 10px", borderRadius: 8, background: "transparent", border: "none",
                cursor: "pointer", color: C.text, fontSize: 14, fontFamily: "inherit",
                textAlign: "left", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Search size={17} />
              <span>Search chats</span>
            </button>
          )}
        </nav>
        {/* Recents */}
        <div style={{ padding: "14px 8px 6px 18px", flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Recents</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {threads.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <div style={{ margin: "8px 4px", padding: "14px 12px", borderRadius: 10,
              border: `1px dashed ${C.sidebarBorder}`, color: "#555", fontSize: 13,
              textAlign: "center", lineHeight: 1.6 }}>
              {searchQuery ? "No matches found" : "Your conversations\nwill appear here"}
            </div>
          ) : (
            threads.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map((t, i) => (
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
        {/* Footer */}
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
            <button onClick={() => setShowSettings(true)} title="Settings"
              style={{ width: 32, height: 32, borderRadius: 7, background: "rgba(255,255,255,0.06)",
                border: "1px solid #3a3a3a", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
              <Settings size={15} style={{ color: C.muted }} />
            </button>
          </div>
        </div>
      </aside>

      <div className={`mobile-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ── GEMINI-STYLE COLLAPSED ICON STRIP (shown when sidebar is closed) ── */}
      <div className="desktop-only" style={{ height: "100%" }}>
        {!sidebarOpen && <CollapsedIconStrip />}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} userName={userName} userEmail={userEmail} onLogout={handleLogout} />}

      {showSearchModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 200,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", paddingTop: "10vh"
        }} onClick={() => setShowSearchModal(false)}>
          <div style={{
            width: "100%", maxWidth: 500, background: C.sidebar, border: `1px solid ${C.sidebarBorder}`,
            borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "60vh",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", padding: "16px", borderBottom: `1px solid ${C.sidebarBorder}` }}>
              <Search size={20} style={{ color: C.muted, marginRight: 12 }} />
              <input 
                autoFocus
                placeholder="Search recent chats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                   if (e.key === "Enter") {
                      const filtered = threads.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (filtered.length > 0) {
                         setActiveThreadId(filtered[0].id);
                         setShowSearchModal(false);
                      }
                   }
                   if (e.key === "Escape") setShowSearchModal(false);
                }}
                style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 16, width: "100%", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ overflowY: "auto", padding: 8 }}>
              {threads.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map((t, i) => (
                <button key={t.id} onClick={() => { setActiveThreadId(t.id); setShowSearchModal(false); }}
                  style={{
                    width: "100%", padding: "12px 16px", background: "transparent", border: "none",
                    color: C.text, textAlign: "left", cursor: "pointer", borderRadius: 8,
                    fontSize: 14, fontFamily: "inherit",
                    transition: "background 0.1s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(120,120,120,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {/* Top bar */}
        <div className="mobile-only" style={{ height: 56, alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", borderBottom: `1px solid var(--sidebarBorder)`,
          background: "var(--sidebar)", flexShrink: 0, zIndex: 10 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "transparent", border: "none", color: "var(--text)", padding: 4, cursor: "pointer" }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "'Georgia', serif" }}>Jessica <span style={{ color: "var(--accent)" }}>3.0</span></span>
          <div style={{ width: 32 }}></div>
        </div>
        <div className="desktop-only" style={{ height: 48, display: "flex", alignItems: "center",
          padding: "0 14px", borderBottom: `1px solid ${C.sidebarBorder}`,
          background: C.sidebar, flexShrink: 0 }}>
        </div>
        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {isEmpty ? (
            /* ── EMPTY STATE ── */
            <div style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 36, padding: "60px 20px 160px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src="/jessica-png.png" alt="Jessica" style={{ width: 72, height: 72, objectFit: "cover", mixBlendMode: isDark ? "screen" : "multiply", filter: isDark ? "contrast(200%)" : "invert(1) contrast(200%)", transform: "scale(1.08)" }} />
                  </div>
                  <h1 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 300,
                    letterSpacing: "-0.02em", margin: 0, color: C.text,
                    fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                    {getGreeting().title}
                  </h1>
                </div>
                <p style={{ fontSize: 16, color: C.muted, fontWeight: 400, margin: 0,
                  fontFamily: "'DM Sans', sans-serif" }}>
                  {getGreeting().subtitle}
                </p>
              </div>
              {/* input box */}
              <div style={{ width: "100%", maxWidth: 680 }} className="chat-input-wrapper">
                <div className="chat-input-container" style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`,
                  borderRadius: 16, padding: "18px 18px 14px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                      {loading ? (
                        <button onClick={stopGeneration} title="Stop generating"
                          style={{ width: 32, height: 32, borderRadius: 8, border: "none",
                            background: C.accent, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background .2s", boxShadow: `0 0 10px var(--accentShadow)` }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" fill="var(--bg)" stroke="none" />
                          </svg>
                        </button>
                      ) : (
                        <button onClick={() => send(input)}
                          disabled={(!input.trim() && attachedFiles.length === 0) || loading}
                          style={{ width: 32, height: 32, borderRadius: 8, border: "none",
                            background: (input.trim() || attachedFiles.length > 0) && !loading ? C.accent : "rgba(128,128,128,0.2)",
                            cursor: (input.trim() || attachedFiles.length > 0) && !loading ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "background .2s",
                            boxShadow: (input.trim() || attachedFiles.length > 0) && !loading ? `0 0 10px var(--accentShadow)` : "none" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={((input.trim() || attachedFiles.length > 0) && !loading) ? "var(--bg)" : "var(--muted)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" fill={((input.trim() || attachedFiles.length > 0) && !loading) ? "var(--bg)" : "var(--muted)"} stroke="none" />
                          </svg>
                        </button>
                      )}
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
              {messages.map((m, i) => (
                <Bubble
                  key={i}
                  msg={m}
                  prevMsg={i > 0 ? messages[i-1] : undefined}
                  onRegenerate={handleRegenerate}
                  onRefresh={handleRefresh}
                  onEdit={handleEditSubmit}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        {/* ── FLOATING INPUT (chat mode) ── */}
        {!isEmpty && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "12px 24px 20px",
            background: `linear-gradient(transparent, ${C.bg} 38%)` }} className="chat-input-wrapper">
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div className="chat-input-container" style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`,
                borderRadius: 16, padding: "14px 16px 12px",
                boxShadow: "0 4px 24px rgba(0,0,0,.5)" }}>
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
                    {loading ? (
                      <button onClick={stopGeneration} title="Stop generating"
                        style={{ width: 32, height: 32, borderRadius: 8, border: "none",
                          background: C.accent, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background .2s", boxShadow: `0 0 10px var(--accentShadow)` }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" fill="var(--bg)" stroke="none" />
                        </svg>
                      </button>
                    ) : (
                      <button onClick={() => send(input)}
                        disabled={(!input.trim() && attachedFiles.length === 0) || loading}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "none",
                          background: (input.trim() || attachedFiles.length > 0) && !loading ? C.accent : "rgba(128,128,128,0.2)",
                          cursor: (input.trim() || attachedFiles.length > 0) && !loading ? "pointer" : "not-allowed",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background .2s",
                          boxShadow: (input.trim() || attachedFiles.length > 0) && !loading ? `0 0 10px var(--accentShadow)` : "none" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={((input.trim() || attachedFiles.length > 0) && !loading) ? "var(--bg)" : "var(--muted)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" fill={((input.trim() || attachedFiles.length > 0) && !loading) ? "var(--bg)" : "var(--muted)"} stroke="none" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        :root, .theme-dark {
          --bg: #1a1a1a;
          --sidebar: #1e1e1e;
          --sidebarBorder: #2a2a2a;
          --inputBg: #2a2a2a;
          --inputBorder: #383838;
          --chipBg: #2e2e2e;
          --chipBorder: #3a3a3a;
          --text: #e8e6e1;
          --muted: #888880;
          --accent: #ffffff;
          --accentShadow: rgba(255,255,255,0.3);
          --topBar: #252525;
          --topBarBorder: #333;
          --userBubble: #2e2e2e;
          --assistantBg: transparent;
          --dot: #3b82f6;
        }
        .theme-light {
          --bg: #fafafa;
          --sidebar: #ffffff;
          --sidebarBorder: #e4e4e7;
          --inputBg: #ffffff;
          --inputBorder: #e4e4e7;
          --chipBg: #f4f4f5;
          --chipBorder: #e4e4e7;
          --text: #18181b;
          --muted: #71717a;
          --accent: #000000;
          --accentShadow: rgba(0,0,0,0.25);
          --topBar: #ffffff;
          --topBarBorder: #e4e4e7;
          --userBubble: #f4f4f5;
          --assistantBg: transparent;
          --dot: #3b82f6;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); }
        .sidebar {
          background: var(--sidebar);
          display: flex; flex-direction: column; flex-shrink: 0;
          transition: width 0.25s ease, min-width 0.25s ease, border-right 0.25s ease;
        }
        @media (min-width: 769px) {
          .sidebar.open { width: 240px; min-width: 240px; border-right: 1px solid var(--sidebarBorder); }
          .sidebar.closed { width: 0px; min-width: 0px; border-right: none; overflow: hidden; }
          .mobile-only { display: none !important; }
        }
        @media (max-width: 768px) {
          .sidebar { position: fixed; top: 0; left: 0; bottom: 0; z-index: 1000; width: 280px; min-width: 280px; border-right: 1px solid var(--sidebarBorder); transform: translateX(-100%); transition: transform 0.3s ease; }
          .sidebar.open { transform: translateX(0); }
          .sidebar.closed { transform: translateX(-100%); }
          .desktop-only { display: none !important; }
          .chat-input-wrapper { padding: 8px 12px 12px !important; }
          .chat-input-container { padding: 10px 12px 8px !important; }
          .modal-container { padding: 20px !important; margin: 16px !important; }
        }
        .mobile-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .mobile-backdrop.open {
          opacity: 1; pointer-events: auto;
        }
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