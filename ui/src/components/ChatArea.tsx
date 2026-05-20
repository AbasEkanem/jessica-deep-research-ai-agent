"use client";

import {
  useState, useRef, useEffect, useCallback, ChangeEvent,
} from "react";
import {
  Send, Square, ThumbsUp, Share2, Copy, RefreshCw,
  Edit2, Check, Paperclip, Globe, X, Loader2,
  User, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Clock, Zap, Brain,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import Image from "next/image";
import { ChatMessage, ToolEvent, TodoTask, StatusStep } from "@/types/chat";
import { streamChat, fetchThreadHistory, uploadFile } from "@/lib/api";
import { getToolMeta } from "@/lib/tools";
import { pickGreeting } from "@/components/GreetingVariants";
import { MultipleChoice, TabbedResponse, StepByStep } from "@/components/InteractiveMessages";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type MessageRole = "user" | "jessica";

// ── NEW: UI block types ───────────────────────
export interface UIBlock {
  type:
    | "comparison_table"
    | "card_grid"
    | "timeline"
    | "chart"
    | "action_buttons"
    | "source_cards"
    | "metric_row";
  data: any;
  position: "before" | "after" | "replace";
}

export interface UIHints {
  layout?: "prose" | "card_grid" | "table" | "split";
  inputMode?: "text" | "choices" | "confirm" | "none";
  suggestions?: string[];
  urgency?: "normal" | "high";
}

export interface ExtendedChatMessage extends ChatMessage {
  uiBlocks?: UIBlock[];
  uiHints?: UIHints;
  inputMode?: UIHints["inputMode"];
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SUGGESTION_CHIPS = [
  { icon: "🔍", text: "Deep research on a topic" },
  { icon: "📊", text: "Market analysis report" },
  { icon: "📧", text: "Email a research report" },
  { icon: "💻", text: "Help me write code" },
];

const PHASE_META: Record<string, { color: string; icon: string; label: string }> = {
  thinking: { color: "#a78bfa", icon: "◐", label: "Thinking" },
  subagent: { color: "#60a5fa", icon: "●", label: "Sub-agent" },
  tool: { color: "#fbbf24", icon: "◎", label: "Tool" },
  tool_done: { color: "#34d399", icon: "✓", label: "Complete" },
  writing: { color: "#f472b6", icon: "◑", label: "Writing" },
  searching: { color: "#38bdf8", icon: "◌", label: "Searching" },
  reading: { color: "#fb923c", icon: "◐", label: "Reading" },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
interface TimeGreeting {
  headline: string;
  emoji: string;
  sub: string;
}

function getTimeGreeting(): TimeGreeting {
  const h = new Date().getHours();
  const day = new Date().getDay();

  if (h < 5) {
    if (day === 0 || day === 6) return { headline: "Weekend all-nighter?", emoji: "🌌", sub: "No rush tomorrow. We can go as deep as you want." };
    return { headline: "Burning the midnight oil?", emoji: "🌙", sub: "I'm up. Let's make these late hours count." };
  }
  if (h < 8) {
    if (day === 0 || day === 6) return { headline: "Early weekend rise.", emoji: "🌅", sub: "Quiet weekend mornings are the best. What's on your mind?" };
    return { headline: "Early bird, I see.", emoji: "☕", sub: "Best time to think clearly. What are we solving?" };
  }
  if (h < 10) return { headline: "Time for a coffee break?", emoji: "☕", sub: "Grab your cup — I've got research, writing, whatever you need." };
  if (h < 12) return { headline: "Good morning.", emoji: "🌤", sub: "Momentum is building. What shall we tackle?" };
  if (h < 14) return { headline: "Lunch break?", emoji: "🥗", sub: "Good time to queue something up while you eat." };
  if (h < 17) return { headline: "Good afternoon.", emoji: "☀️", sub: "Midday focus. What do you want to dig into?" };
  if (h < 19) {
    if (day === 5) return { headline: "Happy Friday evening!", emoji: "🎉", sub: "One last push — or just curious? Either works." };
    return { headline: "Dinner time soon.", emoji: "🍽", sub: "Wrapping up for the day? I'll be quick." };
  }
  if (h < 22) {
    if (day === 0 || day === 6) return { headline: "Weekend evening.", emoji: "🌿", sub: "Relaxed pace or late sprint — your call." };
    return { headline: "Good evening.", emoji: "🌆", sub: "Day's winding down. What's on your mind?" };
  }
  if (day === 5 || day === 6) return { headline: "Late weekend vibes.", emoji: "✨", sub: "No alarm tomorrow. Let's explore something fun or dive deep." };
  return { headline: "Late night session.", emoji: "🌃", sub: "Night owl mode. Let's get into it." };
}

function getGreeting() {
  const g = getTimeGreeting();
  return { headline: g.headline, emoji: g.emoji, timeLine: g.headline, dayLine: g.sub };
}

function sanitizeMath(content: string): string {
  return content
    .replace(
      /(?<!\$\$)\s*(\\begin\{(?:aligned|equation|pmatrix|bmatrix|vmatrix|cases|eqnarray)\}[\s\S]*?\\end\{(?:aligned|equation|pmatrix|bmatrix|vmatrix|cases|eqnarray)\})\s*(?!\$\$)/g,
      "\n$$\n$1\n$$\n"
    )
    .replace(/\\\[\s*/g, "$$\n")
    .replace(/\s*\\\]/g, "\n$$")
    .replace(/\\\(\s*/g, "$")
    .replace(/\s*\\\)/g, "$");
}

// ─────────────────────────────────────────────
// UI Component Registry
// ─────────────────────────────────────────────

function ComparisonTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 12 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: "8px 14px", textAlign: "left", fontWeight: 600,
                borderBottom: "1px solid var(--border-med)", color: "var(--text)",
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
                background: "var(--surface-2)",
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "8px 14px", color: "var(--text-muted)" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardGrid({ cards }: { cards: { title: string; body: string; tag?: string; url?: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 12 }}>
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-med)",
            background: "var(--surface-2)", cursor: card.url ? "pointer" : "default",
            transition: "border-color 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-med)";
            (e.currentTarget as HTMLDivElement).style.transform = "";
          }}
          onClick={() => card.url && window.open(card.url, "_blank")}
        >
          {card.tag && (
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 6, display: "block" }}>
              {card.tag}
            </span>
          )}
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{card.title}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{card.body}</p>
        </div>
      ))}
    </div>
  );
}

function MetricRow({ metrics }: { metrics: { label: string; value: string; delta?: string; positive?: boolean }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          flex: "1 1 120px", padding: "12px 16px", borderRadius: 10,
          border: "1px solid var(--border-med)", background: "var(--surface-2)",
        }}>
          <p style={{ margin: 0, fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{m.label}</p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{m.value}</p>
          {m.delta && (
            <p style={{ margin: 0, fontSize: 11, marginTop: 4, color: m.positive ? "#34d399" : "#f87171" }}>
              {m.positive ? "▲" : "▼"} {m.delta}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ActionButtons({
  actions,
  onSelect,
}: {
  actions: { label: string; value: string; style?: "primary" | "danger" | "ghost" }[];
  onSelect: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => onSelect(a.value)}
          style={{
            padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
            background: a.style === "primary" ? "var(--accent)" : a.style === "danger" ? "rgba(248,113,113,0.1)" : "var(--surface-2)",
            border: a.style === "primary" ? "1px solid var(--accent)" : a.style === "danger" ? "1px solid rgba(248,113,113,0.3)" : "1px solid var(--border-med)",
            color: a.style === "primary" ? "#000" : a.style === "danger" ? "#f87171" : "var(--text)",
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

function SourceCards({ sources }: { sources: { title: string; url: string; snippet: string; favicon?: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10,
            border: "1px solid var(--border)", background: "var(--surface-2)",
            textDecoration: "none", transition: "border-color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          {s.favicon && (
            <img src={s.favicon} width={16} height={16} style={{ borderRadius: 3, marginTop: 2, flexShrink: 0 }} alt="" />
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.snippet}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

// Registry — maps type strings → components
function Timeline({ events }: { events: { date: string; title: string; desc?: string }[] }) {
  if (!events || events.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 12 }}>
      {events.map((ev, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--border-med)", flexShrink: 0, marginTop: 4 }} />
            {i < events.length - 1 && <div style={{ width: 1, flex: 1, background: "rgba(148,163,184,0.12)", minHeight: 24 }} />}
          </div>
          <div style={{ paddingBottom: i < events.length - 1 ? 16 : 0 }}>
            <span style={{ fontSize: 10, color: "var(--text-dim)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>{ev.date}</span>
            <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{ev.title}</p>
            {ev.desc && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{ev.desc}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// Registry — maps type strings → components
const UI_COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  comparison_table: ComparisonTable,
  card_grid:        CardGrid,
  metric_row:       MetricRow,
  action_buttons:   ActionButtons,
  source_cards:     SourceCards,
  timeline:         Timeline,
};

function UIBlockRenderer({ block, onAction }: { block: UIBlock; onAction: (value: string) => void }) {
  const Component = UI_COMPONENT_MAP[block.type];
  if (!Component) {
    console.warn(`[UIBlockRenderer] Unknown block type: ${block.type}`);
    return null;
  }
  try {
    return (
      <div style={{ animation: "fade-up 0.3s ease" }}>
        <Component {...(block.data ?? {})} onSelect={onAction} />
      </div>
    );
  } catch (err) {
    console.error(`[UIBlockRenderer] Error rendering ${block.type}:`, err);
    return (
      <div style={{ border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", margin: "6px 0", background: "rgba(239,68,68,0.05)" }}>
        <span style={{ fontSize: 11, color: "#f87171" }}>⚠️ Failed to render {block.type} component</span>
      </div>
    );
  }
}

// ─────────────────────────────────────────────
// AgentAvatar
// ─────────────────────────────────────────────
function AgentAvatar({ size = 32, isWorking = false }: { size?: number; isWorking?: boolean }) {
  return (
    <div style={{ position: "relative", width: size + 8, height: size + 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {isWorking && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%", padding: 1.5,
          background: "conic-gradient(from 0deg, #8ab4f8, #c4b5fd, #f0abfc, #8ab4f8)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          animation: "jessica-orbit 1.2s linear infinite",
          filter: "drop-shadow(0 0 6px rgba(196,181,253,0.5))",
        }} />
      )}
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", background: "var(--surface-3)", position: "relative" }}>
        <Image src="/jessica-png.jpg" alt="Jessica" width={size} height={size} className="object-cover" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CopyButton
// ─────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="action-btn">
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─────────────────────────────────────────────
// AgentThinkingDots
// ─────────────────────────────────────────────
function AgentThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 0 6px" }}>
      <Brain size={13} style={{ color: "#a78bfa", opacity: 0.8 }} />
      <span className="jessica-status-label jessica-status-dots" style={{ fontSize: 12 }}>Thinking</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// GeminiSearchRow
// ─────────────────────────────────────────────
function GeminiSearchRow({ query }: { query?: string }) {
  const WORDS = ["Searching", "Reading sources", "Cross-checking", "Synthesising"];
  const [wordIdx, setWordIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % WORDS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 12, border: "1px solid rgba(56,189,248,0.18)",
      background: "linear-gradient(90deg,rgba(56,189,248,0.06) 0%,rgba(138,180,248,0.06) 100%)",
      marginBottom: 8, animation: "fade-up 0.3s ease",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "2px solid rgba(56,189,248,0.25)", borderTop: "2px solid #38bdf8",
        animation: "jessica-orbit 0.9s linear infinite", flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: "#38bdf8", letterSpacing: "0.03em", animation: "fade-up 0.4s ease" } as any}>
          {WORDS[wordIdx]}…
        </p>
        {query && (
          <p style={{ margin: 0, fontSize: 10.5, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
            {query}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: "50%", background: "#38bdf8",
            display: "inline-block", opacity: 0.5,
            animation: `ping 1.2s ${i * 0.2}s cubic-bezier(0,0,0.2,1) infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AgentThoughtProcessFeed
// ─────────────────────────────────────────────
interface AgentThoughtProcessFeedProps {
  steps: StatusStep[];
  isActive: boolean;
}

const THOUGHT_COLORS: Record<string, { dot: string; bg: string; border: string; icon: string; label: string }> = {
  search: { dot: "#6ee7f7", bg: "rgba(110,231,247,0.08)", border: "rgba(110,231,247,0.18)", icon: "⌕", label: "Web Search" },
  read:   { dot: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.18)", icon: "◈", label: "Reading Sources" },
  reason: { dot: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.18)",  icon: "◎", label: "Reasoning" },
  write:  { dot: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.18)",  icon: "✦", label: "Synthesizing" },
  memory: { dot: "#f472b6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.18)", icon: "🧠", label: "Memory Sync" },
};

function getStepType(s: StatusStep) {
  if (s.phase === "memory" || s.tool?.toLowerCase().includes("memory")) return "memory";
  if (s.phase === "searching" || s.phase === "tool" || s.tool?.toLowerCase().includes("search")) return "search";
  if (s.phase === "reading" || s.tool?.toLowerCase().includes("read")) return "read";
  if (s.phase === "writing") return "write";
  return "reason";
}

function ThoughtStepView({ step, index, allSteps, visible }: { step: StatusStep; index: number; allSteps: StatusStep[]; visible: boolean }) {
  const typeKey = getStepType(step);
  const colors = THOUGHT_COLORS[typeKey] || THOUGHT_COLORS.reason;
  const prevTime = index > 0 ? allSteps[index - 1].timestamp : step.timestamp;
  const elapsedMs = Math.max(0, step.timestamp - prevTime);
  const timeStr = (elapsedMs / 1000).toFixed(1) + "s";

  return (
    <div style={{
      display: "flex", gap: 12,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(6px)",
      transition: `opacity 0.35s ease ${index * 0.06}s, transform 0.35s ease ${index * 0.06}s`,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", background: colors.bg,
          border: `1.5px solid ${colors.border}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 10, color: colors.dot, flexShrink: 0, marginTop: 1,
        }}>
          {colors.icon}
        </div>
        {index < allSteps.length - 1 && (
          <div style={{ width: 1, flex: 1, background: "rgba(148,163,184,0.1)", minHeight: 16, marginTop: 4 }} />
        )}
      </div>
      <div style={{ paddingBottom: index < allSteps.length - 1 ? 14 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.dot, fontFamily: "'DM Mono', monospace" }}>
            {colors.label}
          </span>
          <span style={{ fontSize: 10, color: "#475569", fontFamily: "'DM Mono', monospace" }}>+{timeStr}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
          {step.detail}
        </p>
      </div>
    </div>
  );
}

function AgentThoughtProcessFeed({ steps, isActive }: AgentThoughtProcessFeedProps) {
  const [open, setOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      setOpen(true);
    } else if (steps.length > 0) {
      const t = setTimeout(() => setOpen(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isActive, steps.length]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setContentVisible(true), 60);
      return () => clearTimeout(t);
    } else {
      setContentVisible(false);
    }
  }, [open]);

  if (steps.length === 0) return null;

  const isSimpleQuery = steps.every((s) => s.phase === "thinking");
  if (isSimpleQuery && !isActive) return null;
  if (isSimpleQuery && isActive) {
    return (
      <div style={{ padding: "8px 0 6px" }}>
        <span className="jessica-status-label jessica-status-dots" style={{ fontSize: 12 }}>Thinking</span>
      </div>
    );
  }

  const totalMs = steps.length > 1 ? steps[steps.length - 1].timestamp - steps[0].timestamp : 0;
  const totalTime = (totalMs / 1000).toFixed(1);
  const lastStep = steps[steps.length - 1];
  const isSearching = isActive && (lastStep?.phase === "searching" || lastStep?.tool?.includes("search"));
  const searchQuery = isSearching ? lastStep?.detail : undefined;

  return (
    <div style={{ marginBottom: 14 }}>
      {isSearching && <GeminiSearchRow query={searchQuery} />}

      <style>{`
        @keyframes shimmer-ring { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .thought-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px 6px 10px; border-radius: 999px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(148, 163, 184, 0.12); cursor: pointer; user-select: none; backdrop-filter: blur(8px); transition: border-color 0.2s, background 0.2s, transform 0.15s; font-family: 'DM Sans', sans-serif; margin-bottom: 8px; }
        .thought-pill:hover { border-color: rgba(148, 163, 184, 0.25); background: rgba(15, 23, 42, 0.85); transform: translateY(-1px); }
        .thought-pill:active { transform: translateY(0px); }
        .tp-chevron { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); color: #475569; margin-top: 1px; }
        .tp-chevron.open { transform: rotate(180deg); }
        .tp-dropdown { overflow: hidden; max-height: 0; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease; opacity: 0; }
        .tp-dropdown.open { max-height: 800px; opacity: 1; overflow-y: auto; }
      `}</style>

      <div>
        <button className="thought-pill" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span style={{
            width: 18, height: 18, borderRadius: "50%",
            background: isActive ? "linear-gradient(135deg, #6ee7f7 0%, #a78bfa 50%, #34d399 100%)" : "#34d399",
            backgroundSize: "200% 200%", animation: isActive ? "shimmer-ring 2.5s linear infinite" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {!isActive && <span style={{ color: "#000", fontSize: 10, fontWeight: "bold" }}>✓</span>}
          </span>
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
            {isActive ? "Thinking for " : "Thought for "}
            <span style={{ color: "#cbd5e1", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{totalTime}s</span>
          </span>
          <svg className={`tp-chevron${open ? " open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={`tp-dropdown${open ? " open" : ""}`} ref={containerRef}>
          <div style={{ marginTop: 4, borderRadius: 14, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(148, 163, 184, 0.1)", backdropFilter: "blur(12px)", padding: "18px 20px 16px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", fontFamily: "'DM Mono', monospace" }}>Research Trace</span>
              <span style={{ fontSize: 11, color: "#334155", fontFamily: "'DM Mono', monospace" }}>{steps.length} steps · {totalTime}s total</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {steps.map((step, i) => (
                <ThoughtStepView key={i} step={step} index={i} allSteps={steps} visible={contentVisible} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ToolPills
// ─────────────────────────────────────────────
function ToolPills({ events }: { events: ToolEvent[] }) {
  if (!events || events.length === 0) return null;
  const unique = events.filter((ev, i, arr) => arr.findIndex((e) => e.name === ev.name) === i);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
      {unique.map((ev, i) => {
        const meta = getToolMeta(ev.name);
        return (
          <span key={i} className="tool-pill" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30`, color: meta.color, fontSize: 11, padding: "3px 8px" }}>
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// MarkdownRenderer
// ─────────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 700, marginTop: 20, marginBottom: 10, color: "var(--text)" }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 22, marginBottom: 10, color: "var(--text)" }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 16, marginBottom: 7, color: "var(--text-2)" }}>{children}</h3>,
        p: ({ children }) => <p style={{ marginBottom: 11, lineHeight: 1.78, color: "var(--text-muted)" }}>{children}</p>,
        strong: ({ children }) => <strong style={{ fontWeight: 700, color: "var(--text)" }}>{children}</strong>,
        ul: ({ children }) => <ul style={{ marginLeft: 20, marginBottom: 11, listStyleType: "disc" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ marginLeft: 20, marginBottom: 11 }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: 4, lineHeight: 1.65, color: "var(--text-muted)" }}>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 14, margin: "12px 0", color: "var(--text-dim)", fontStyle: "italic" }}>
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith("language-");
          if (isBlock) {
            const rawContent = Array.isArray(children) ? children.join("") : String(children);
            const tryParseAndRender = (Component: any, tag: string) => {
              const trimmed = rawContent.trim();
              // Pass 1: try raw parse (handles properly double-escaped JSON)
              try {
                const data = JSON.parse(trimmed);
                if (data && typeof data === "object") return <Component {...data} />;
              } catch { /* fall through */ }
              // Pass 2: repair sloppy LaTeX backslashes then retry
              try {
                const repaired = trimmed
                  .replace(/\\\\/g, '\u0000')    // protect already-escaped \\ pairs
                  .replace(/\\/g, '\\\\')         // escape ALL remaining lone backslashes
                  .replace(/\u0000/g, '\\\\');    // restore the protected pairs
                const data = JSON.parse(repaired);
                if (data && typeof data === "object") return <Component {...data} />;
              } catch { /* fall through */ }
              // Pass 3: strip control chars, trailing commas, unescaped newlines
              try {
                const cleaned = trimmed
                  .replace(/[\x00-\x1f]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ch : '')  // remove control chars except whitespace
                  .replace(/,\s*([}\]])/g, '$1')  // remove trailing commas
                  .replace(/\\\\/g, '\u0000')
                  .replace(/\\/g, '\\\\')
                  .replace(/\u0000/g, '\\\\');
                const data = JSON.parse(cleaned);
                if (data && typeof data === "object") return <Component {...data} />;
              } catch (e) {
                console.error(`Failed to parse ${tag} (all 3 passes):`, e);
                return (
                  <div style={{ border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: 12, margin: "10px 0", background: "rgba(248,113,113,0.05)" }}>
                    <div style={{ color: "#f87171", fontSize: 12, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={13} /> Error rendering {tag}
                    </div>
                    <pre style={{ fontSize: 11, color: "var(--text-muted)", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>{trimmed.slice(0, 500)}</pre>
                  </div>
                );
              }
              return null;
            };
            if (className === "language-jessica-quiz")       return tryParseAndRender(MultipleChoice, "jessica-quiz");
            if (className === "language-jessica-tabs")       return tryParseAndRender(TabbedResponse, "jessica-tabs");
            if (className === "language-jessica-steps")      return tryParseAndRender(StepByStep, "jessica-steps");
            if (className === "language-jessica-comparison") return tryParseAndRender(ComparisonTable, "jessica-comparison");
            if (className === "language-jessica-cards")      return tryParseAndRender(CardGrid, "jessica-cards");
            if (className === "language-jessica-metrics")    return tryParseAndRender(MetricRow, "jessica-metrics");
            if (className === "language-jessica-sources")    return tryParseAndRender(SourceCards, "jessica-sources");
            if (className === "language-jessica-timeline")   return tryParseAndRender(Timeline, "jessica-timeline");
            return <code className={className}>{children}</code>;
          }
          return (
            <code style={{ fontFamily: "'JetBrains Mono',monospace", background: "var(--surface-2)", padding: "2px 5px", borderRadius: 4, fontSize: 12.5, color: "var(--text)", border: "1px solid var(--border)" }}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre style={{ fontFamily: "'JetBrains Mono',monospace", background: "var(--surface-3)", border: "1px solid var(--border-med)", borderRadius: 10, padding: "13px 16px", overflowX: "auto", marginBottom: 12, fontSize: 12.5, color: "var(--text)", lineHeight: 1.6 }}>
            {children}
          </pre>
        ),
        a: ({ href, children }) => {
          const safe = href && /^(https?:\/\/|mailto:|\/|#)/.test(href) ? href : "#";
          return <a href={safe} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-1)", textDecoration: "underline", textUnderlineOffset: 3 }}>{children}</a>;
        },
        table: ({ children }) => (
          <div style={{ overflowX: "auto", marginBottom: 12 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>{children}</table>
          </div>
        ),
        th: ({ children }) => <th style={{ padding: "7px 12px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid var(--border-med)", color: "var(--text)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</th>,
        td: ({ children }) => <td style={{ padding: "7px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─────────────────────────────────────────────
// Message
// ─────────────────────────────────────────────
interface MessageProps {
  message: ExtendedChatMessage;
  isLatest: boolean;
  onRegenerate: () => void;
  onEdit: (text: string) => void;
  onAction: (text: string) => void; // ← NEW: handles UI block actions & suggestion chips
}

function Message({ message, isLatest, onRegenerate, onEdit, onAction }: MessageProps) {
  const isUser = message.role === "user";
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(message.content);
  const [liked, setLiked] = useState(false);

  const isNewResponse =
    !message.isStreaming &&
    message.role === "jessica" &&
    isLatest &&
    Date.now() - message.timestamp < 3_000;

  const sanitized = sanitizeMath(message.content);
  const [displayed, setDisplayed] = useState(isNewResponse ? "" : sanitized);

  useEffect(() => { setDisplayed(sanitizeMath(message.content)); }, [message.content]);

  useEffect(() => {
    if (!isNewResponse) return;
    let i = 0;
    const speed = 12;
    const chunkSize = 5;
    const timer = setInterval(() => {
      i += chunkSize;
      if (i >= sanitized.length) { setDisplayed(sanitized); clearInterval(timer); }
      else setDisplayed(sanitized.substring(0, i));
    }, speed);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitEdit = () => {
    if (editVal.trim()) { onEdit(editVal.trim()); setEditing(false); }
  };

  // ── User message ──────────────────────────────
  if (isUser) {
    return (
      <div className="fade-up" style={{ display: "flex", flexDirection: "row-reverse", gap: 12, marginBottom: 28, alignItems: "flex-start" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "var(--surface-3)", border: "1px solid var(--border-med)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
          <User size={14} style={{ color: "var(--text-muted)" }} />
        </div>
        <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="msg-user" style={{ padding: "11px 18px", borderRadius: "22px 22px 6px 22px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 14, color: "var(--text)", width: "100%", lineHeight: 1.6, fontFamily: "inherit" }}
                  rows={Math.max(2, editVal.split("\n").length)}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button className="action-btn" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="action-btn" onClick={submitEdit} style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb),0.3)", background: "var(--accent-subtle)" }}>
                    <Check size={11} /> Save & send
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "var(--text)", margin: 0, lineHeight: 1.68 }}>{message.content}</p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {!message.isStreaming && (
              <>
                <button className="action-btn" onClick={() => setEditing(true)} title="Edit"><Edit2 size={11} /> Edit</button>
                <button className="action-btn" onClick={onRegenerate} title="Regenerate"><RefreshCw size={11} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Agent message ──────────────────────────────
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "row", gap: 12, marginBottom: 28, alignItems: "flex-start" }}>
      <AgentAvatar size={32} isWorking={!!message.isStreaming} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <p className="gradient-text-subtle" style={{ marginBottom: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Jessica 3.0
        </p>

        {/* Tool pills */}
        {message.toolEvents && <ToolPills events={message.toolEvents} />}

        {/* Live thought feed */}
        {message.statusSteps && message.statusSteps.length > 0 && (
          <AgentThoughtProcessFeed steps={message.statusSteps} isActive={!!message.isStreaming} />
        )}

        {/* Skeleton loader */}
        {message.isStreaming && message.content.length === 0 && (
          <div className="skeleton-lines" style={{ marginTop: 8, marginBottom: 8 }}>
            <div className="skeleton-line w-90"></div>
            <div className="skeleton-line w-75"></div>
            <div className="skeleton-line w-55"></div>
          </div>
        )}

        {/* ── NEW: UI blocks BEFORE prose ── */}
        {message.uiBlocks?.filter(b => b.position === "before").map((block, i) => (
          <UIBlockRenderer key={`before-${i}`} block={block} onAction={onAction} />
        ))}

        {/* Prose — hidden if any block is "replace" */}
        {message.content.length > 0 && !message.uiBlocks?.some(b => b.position === "replace") && (
          <div className="msg-agent jessica-prose" style={{ paddingTop: 0 }}>
            <MarkdownRenderer content={displayed} />
            {message.isStreaming && <span className="cursor" />}
          </div>
        )}

        {/* ── NEW: UI blocks AFTER prose ── */}
        {message.uiBlocks?.filter(b => b.position === "after").map((block, i) => (
          <UIBlockRenderer key={`after-${i}`} block={block} onAction={onAction} />
        ))}

        {/* ── NEW: Contextual follow-up suggestion chips ── */}
        {!message.isStreaming && message.uiHints?.suggestions && message.uiHints.suggestions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {message.uiHints.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onAction(s)}
                style={{
                  padding: "5px 12px", borderRadius: 16, fontSize: 12,
                  background: "var(--surface-2)", border: "1px solid var(--border-med)",
                  color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-med)")}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Actions + timestamp */}
        {!message.isStreaming && message.content && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 10, color: "var(--text-dim)", marginRight: 4 }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button className={`action-btn ${liked ? "liked" : ""}`} onClick={() => setLiked((l) => !l)} style={{ color: liked ? "var(--brand-2)" : undefined }}>
              <ThumbsUp size={11} fill={liked ? "currentColor" : "none"} />
            </button>
            <CopyButton text={message.content} />
            <button className="action-btn" onClick={onRegenerate}><RefreshCw size={11} /></button>
            <button className="action-btn"><Share2 size={11} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FilePreview
// ─────────────────────────────────────────────
function FilePreview({ file, previewUrl, onRemove }: { file: File; previewUrl: string | null; onRemove: () => void }) {
  if (previewUrl) {
    return (
      <div style={{ position: "relative", width: 64, height: 64, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-med)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", flexShrink: 0 }}>
        <Image src={previewUrl} alt="Preview" fill className="object-cover" />
        <button onClick={onRemove} style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", padding: 3, cursor: "pointer", color: "white", display: "flex" }}>
          <X size={9} />
        </button>
      </div>
    );
  }
  return (
    <span className="file-chip">
      <Paperclip size={11} />
      {file.name}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-2)", padding: 0, lineHeight: 1, display: "flex" }}>
        <X size={11} />
      </button>
    </span>
  );
}

// ─────────────────────────────────────────────
// ChatArea  (main export)
// ─────────────────────────────────────────────
export interface ChatAreaProps {
  threadId: string;
  userId: string;
  userName?: string;
  onFirstMessage?: (text: string) => void;
}

export default function ChatArea({ threadId, userId, userName, onFirstMessage }: ChatAreaProps) {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [webSearch, setWebSearch] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isFirstMsg = messages.length === 0;

  // ── NEW: derive input mode from last agent message ──
  const lastAgentMsg = [...messages].reverse().find(m => m.role === "jessica" && !m.isStreaming) as ExtendedChatMessage | undefined;
  const currentInputMode = lastAgentMsg?.inputMode ?? "text";
  const currentChoices = lastAgentMsg?.uiBlocks?.find(b => b.type === "action_buttons")?.data?.actions as
    | { label: string; value: string; style?: "primary" | "danger" | "ghost" }[]
    | undefined;

  // ── Load thread history ──────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const history = await fetchThreadHistory(threadId);
      if (cancelled) return;
      if (history.length > 0) {
        setMessages(history.map((h) => ({ id: crypto.randomUUID(), role: h.role as MessageRole, content: h.content, timestamp: Date.now() })));
      } else {
        setMessages([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [threadId]);

  // ── Auto scroll ──────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Textarea auto-resize ─────────────────────
  const resizeTextarea = () => {
    if (!inputRef.current) return;
    inputRef.current.style.height = "auto";
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 180)}px`;
  };

  // ── File handling ────────────────────────────
  const attachFile = useCallback((file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file.type.startsWith("image/")) setPreviewUrl(URL.createObjectURL(file));
    else setPreviewUrl(null);
  }, [previewUrl]);

  const clearFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => { attachFile(e.target.files?.[0] ?? null); };
  const handlePaste = (e: React.ClipboardEvent) => {
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      if (e.clipboardData.items[i].type.startsWith("image/")) { attachFile(e.clipboardData.items[i].getAsFile()); break; }
    }
  };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); attachFile(e.dataTransfer.files?.[0] ?? null); };

  // ── Send message ─────────────────────────────
  const sendMessage = useCallback(
    async (text?: string) => {
      let msg = (text ?? input).trim();
      if ((!msg && !selectedFile) || isStreaming || isUploading) return;

      setError(null);
      setIsUploading(true);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";

      const fileToUpload = selectedFile;
      clearFile();

      if (fileToUpload) {
        try {
          const res = await uploadFile(fileToUpload);
          msg = `${msg}\n\n[Attached file: ${res.path}]`.trim();
        } catch {
          msg = `${msg}\n\n[Failed to attach: ${fileToUpload.name}]`.trim();
        }
      }
      setIsUploading(false);
      if (!msg) return;

      if (isFirstMsg) onFirstMessage?.(msg);

      const userMsg: ExtendedChatMessage = { id: crypto.randomUUID(), role: "user", content: msg, timestamp: Date.now() };
      const agentId = crypto.randomUUID();
      const agentMsg: ExtendedChatMessage = { id: agentId, role: "jessica", content: "", timestamp: Date.now(), statusSteps: [], toolEvents: [], isStreaming: true, uiBlocks: [], uiHints: undefined, inputMode: undefined };

      setMessages((prev) => [...prev, userMsg, agentMsg]);
      setIsStreaming(true);
      abortRef.current = false;
      abortControllerRef.current = new AbortController();

      try {
        for await (const event of streamChat(msg, threadId, userId, abortControllerRef.current.signal)) {
          if (abortRef.current) break;

          if (event.type === "status") {
            const d = event.data as { phase: string; detail: string; tool?: string };
            const step: StatusStep = { phase: d.phase as StatusStep["phase"], detail: d.detail, tool: d.tool, timestamp: Date.now() };
            setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, statusSteps: [...(m.statusSteps ?? []), step] } : m));

          } else if (event.type === "tool") {
            const toolEvent = event.data as unknown as ToolEvent;
            setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, toolEvents: [...(m.toolEvents ?? []), toolEvent] } : m));

          // ── NEW: handle ui events from the agent ──
          } else if (event.type === "ui") {
            const uiPayload = event.data as {
              type: UIBlock["type"];
              position: UIBlock["position"];
              data: any;
              inputMode?: UIHints["inputMode"];
              suggestions?: string[];
            };
            const newBlock: UIBlock = { type: uiPayload.type, position: uiPayload.position ?? "after", data: uiPayload.data };
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentId
                  ? {
                      ...m,
                      uiBlocks: [...(m.uiBlocks ?? []), newBlock],
                      inputMode: uiPayload.inputMode ?? m.inputMode,
                      uiHints: {
                        ...(m.uiHints ?? {}),
                        inputMode: uiPayload.inputMode ?? m.uiHints?.inputMode,
                        suggestions: uiPayload.suggestions ?? m.uiHints?.suggestions,
                      },
                    }
                  : m
              )
            );

          } else if (event.type === "response") {
            let content = (event.data as string).replace(/created memory [a-f0-9-]+\n?/gi, "");
            setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, content, timestamp: Date.now(), isStreaming: false } : m));

          } else if (event.type === "done") {
            break;

          } else if (event.type === "error") {
            setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, content: `⚠️ ${event.data}`, isStreaming: false } : m));
            setError(String(event.data));
            break;
          }
        }
      } catch (err) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (isAbort) {
          setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, content: m.content || "Generation stopped.", isStreaming: false } : m));
        } else {
          const errMsg = err instanceof Error ? err.message : "Unknown error";
          setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, content: `⚠️ Connection error: ${errMsg}`, isStreaming: false } : m));
          setError(errMsg);
        }
      } finally {
        setMessages((prev) => prev.map((m) => m.id === agentId ? { ...m, isStreaming: false } : m));
        setIsStreaming(false);
        inputRef.current?.focus();
      }
    },
    [input, isStreaming, isUploading, isFirstMsg, onFirstMessage, threadId, userId, selectedFile, clearFile]
  );

  // ── Sidebar trigger ──────────────────────────
  useEffect(() => {
    const handler = (e: any) => { if (e.detail) sendMessage(e.detail); };
    window.addEventListener("jessica-trigger-research", handler);
    return () => window.removeEventListener("jessica-trigger-research", handler);
  }, [sendMessage]);

  // ── Regenerate ───────────────────────────────
  const regenerateLast = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((prev) => prev.slice(0, -1));
    sendMessage(lastUser.content);
  }, [messages, sendMessage]);

  // ── Keyboard handler ─────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)", position: "relative", overflow: "hidden" }}>

      {/* ── Messages ── */}
      <div className={`custom-scrollbar ${isFirstMsg ? "overflow-hidden" : "overflow-y-auto"} relative z-10 w-full flex-1`} style={{ overflowAnchor: "none", display: isFirstMsg ? "flex" : "block", flexDirection: "column" }}>
        <div 
          style={isFirstMsg ? {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            width: "100%",
            maxWidth: 680,
            margin: "0 auto",
            padding: "16px 24px 4px",
            boxSizing: "border-box"
          } : {
            width: "100%",
            maxWidth: 680,
            margin: "0 auto",
            padding: "24px 24px 8px",
            boxSizing: "border-box"
          }}
        >
          {isFirstMsg ? (
            (() => {
              const gv = pickGreeting();
              const GreetingComp = gv.C;
              const gData = getTimeGreeting();
              return <GreetingComp data={gData} userName={userName} onSend={(text: string) => sendMessage(text)} />;
            })()
          ) : (
            messages.map((m, idx) => (
              <Message
                key={m.id}
                message={m}
                isLatest={idx === messages.length - 1}
                onRegenerate={regenerateLast}
                onEdit={(newText) => {
                  setMessages((prev) => {
                    const i = prev.findIndex((x) => x.id === m.id);
                    return i === -1 ? prev : prev.slice(0, i);
                  });
                  sendMessage(newText);
                }}
                onAction={(text) => sendMessage(text)} // ← NEW
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, margin: "0 16px 10px", maxWidth: 680, alignSelf: "center", width: "100%" }}>
          <AlertTriangle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "#ef4444", flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 0 }}><X size={13} /></button>
        </div>
      )}

      {/* ── Input area ── */}
      <div 
        className="px-4 md:px-6 w-full max-w-[680px] mx-auto relative z-10 chat-input-container"
        style={isFirstMsg ? { marginBottom: "26vh", transition: "margin-bottom 0.28s ease" } : { marginBottom: "0px", transition: "margin-bottom 0.28s ease" }}
      >
        {selectedFile && (
          <div style={{ marginBottom: 10, animation: "fade-in 0.25s ease" }}>
            <FilePreview file={selectedFile} previewUrl={previewUrl} onRemove={clearFile} />
          </div>
        )}

        <div className={`jessica-input-wrap ${selectedFile ? "has-file" : ""}`} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          {/* Top row: toggles */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px 5px" }}>
            <button onClick={() => setWebSearch((v) => !v)} className={`action-btn ${webSearch ? "active-web" : ""}`} style={{ fontSize: 11, padding: "3px 8px" }} title="Toggle web search">
              <Globe size={11} />
              Web {webSearch ? "on" : "off"}
            </button>
          </div>

          {/* ── NEW: context-aware input body ── */}
          {currentInputMode === "choices" && currentChoices && currentChoices.length > 0 ? (
            // Agent requested a choice input — replace textarea with buttons
            <div style={{ padding: "4px 14px 12px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "var(--text-dim)" }}>Choose an option:</p>
              <ActionButtons actions={currentChoices} onSelect={(val) => sendMessage(val)} />
            </div>
          ) : currentInputMode === "confirm" ? (
            // Agent wants a yes/no confirm
            <div style={{ padding: "4px 14px 12px" }}>
              <ActionButtons
                actions={[
                  { label: "Yes, continue", value: "Yes, continue", style: "primary" },
                  { label: "No, cancel", value: "No, cancel", style: "danger" },
                ]}
                onSelect={(val) => sendMessage(val)}
              />
            </div>
          ) : (
            // Default: normal textarea
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "0 14px 11px" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={isUploading ? "Uploading…" : "Ask Jessica to research anything…"}
                disabled={isStreaming || isUploading}
                rows={1}
                style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontSize: 14, color: "var(--text)", lineHeight: 1.65, minHeight: 24, maxHeight: 180, fontFamily: "inherit" }}
              />
              <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFileInput} accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,image/*" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isUploading || isStreaming}
                title="Attach file"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0, color: "var(--text-muted)", borderRadius: 7, marginBottom: 1, transition: "color 0.15s", opacity: isStreaming ? 0.4 : 1 }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <Paperclip size={15} />
              </button>
              {isStreaming ? (
                <button className="send-btn stop" onClick={() => { abortRef.current = true; abortControllerRef.current?.abort(); }} title="Stop generation">
                  <Square size={13} />
                </button>
              ) : (
                <button className="send-btn go" onClick={() => sendMessage()} disabled={!input.trim() && !selectedFile} title="Send">
                  <Send size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        <p style={{ fontSize: 10.5, color: "var(--text-dim)", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
          Jessica may display inaccurate info — always verify important results.
        </p>
      </div>
    </div>
  );
}