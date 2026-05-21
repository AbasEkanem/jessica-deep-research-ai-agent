"use client";

import { useState, useEffect } from "react";
import {
  Plus, MessageSquare, Trash2, X, Sun, Moon,
  Sparkles, BrainCircuit, Globe, Mail,
  FlaskConical, FileText, Settings, Zap, PenSquare
} from "lucide-react";
import { Thread } from "@/types/chat";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
  userName?: string;
  userEmail?: string;
}

const SUGGESTIONS = [
  { icon: BrainCircuit, title: "Deep Research",   query: "Do a deep research on the latest AI breakthroughs in 2026" },
  { icon: Globe,        title: "Market Analysis", query: "Give me a detailed market analysis report on the EV industry" },
  { icon: FlaskConical, title: "Science Digest",  query: "Summarise the most important scientific discoveries this month" },
  { icon: FileText,     title: "Report Writing",  query: "Write a detailed report on climate change impact on global food security" },
  { icon: Mail,         title: "Email a Report",  query: "Research renewable energy trends and email me a full report" },
];

function groupThreads(threads: Thread[]) {
  const today: Thread[] = [], yesterday: Thread[] = [],
        thisWeek: Thread[] = [], older: Thread[] = [];
  const now = Date.now(), DAY = 86_400_000;

  threads.forEach((t) => {
    const age = now - t.timestamp;
    if      (age < DAY)     today.push(t);
    else if (age < 2*DAY)   yesterday.push(t);
    else if (age < 7*DAY)   thisWeek.push(t);
    else                    older.push(t);
  });
  return { today, yesterday, thisWeek, older };
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(localStorage.getItem("jessica_user_email") || "");
  }, []);

  const handleSave = () => {
    localStorage.setItem("jessica_user_email", email.trim());
    window.dispatchEvent(new Event("jessica-settings-updated"));
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14, width: "100%", maxWidth: 360, padding: "24px 24px 20px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        position: "relative",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "var(--text)", fontFamily: "var(--font-body)", letterSpacing: "-0.01em" }}>
          Settings
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, fontFamily: "var(--font-body)" }}>
          Configure your preferences
        </p>

        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-2)", marginBottom: 6, fontFamily: "var(--font-body)", letterSpacing: "0.01em" }}>
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          style={{
            width: "100%", background: "var(--surface-2)",
            border: "1.5px solid var(--border-2)",
            color: "var(--text)", padding: "9px 12px",
            borderRadius: 8, fontSize: 13,
            outline: "none", marginBottom: 20,
            fontFamily: "var(--font-body)",
            transition: "border-color 0.15s",
            boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--accent)")}
          onBlur={e  => (e.target.style.borderColor = "var(--border-2)")}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
            background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)",
            cursor: "pointer", fontFamily: "var(--font-body)", transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >Cancel</button>
          <button onClick={handleSave} style={{
            padding: "7px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
            background: "var(--accent)", color: "white", border: "none",
            cursor: "pointer", fontFamily: "var(--font-body)",
            boxShadow: "0 1px 8px rgba(var(--accent-rgb),0.35)",
            transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────
export default function Sidebar({
  threads, activeThreadId, onSelectThread, onNewThread, onDeleteThread, onClose, isCollapsed, onToggle,
  userName, userEmail
}: SidebarProps) {
  const [hoveredId, setHoveredId]       = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [userRowHover, setUserRowHover]   = useState(false);
  const { theme, toggle }               = useTheme();
  const isDark = theme === "dark";
  const groups = groupThreads(threads);

  const renderGroup = (label: string, items: Thread[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label} style={{ marginBottom: 16 }}>
        {/* Group label */}
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
          textTransform: "uppercase", color: "var(--text-dim)",
          padding: "0 12px", marginBottom: 2,
          fontFamily: "var(--font-body)",
        }}>{label}</p>

        {items.map((thread) => {
          const isActive  = activeThreadId === thread.id;
          const isHovered = hoveredId === thread.id;

          return (
            <div
              key={thread.id}
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredId(thread.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => onSelectThread(thread.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9,
                  padding: "6px 12px", borderRadius: 6, textAlign: "left",
                  background: isActive  ? "var(--surface-active)"  :
                              isHovered ? "var(--surface-hover)"    : "transparent",
                  border: "none", cursor: "pointer",
                  transition: "background 0.12s",
                  paddingRight: isHovered ? 36 : 12,
                }}
              >
                {/* Subtle left indicator for active */}
                {isActive && (
                  <span style={{
                    width: 3, height: 14, borderRadius: 2,
                    background: "var(--accent)",
                    flexShrink: 0,
                    marginLeft: -4,
                  }} />
                )}
                <MessageSquare
                  size={13}
                  style={{ flexShrink: 0, color: isActive ? "var(--accent)" : "var(--text-dim)", marginLeft: isActive ? 0 : 3 }}
                />
                <span style={{
                  fontSize: 13.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--text)" : "var(--text-2)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                  fontFamily: "var(--font-body)",
                }}>{thread.title}</span>
              </button>

              {/* Delete button — appears on hover */}
              {isHovered && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id); }}
                  style={{
                    position: "absolute", right: 6, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-dim)", padding: "4px 5px",
                    borderRadius: 5, display: "flex", alignItems: "center",
                    transition: "color 0.12s, background 0.12s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = "#e5534b";
                    e.currentTarget.style.background = "rgba(229,83,75,0.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "var(--text-dim)";
                    e.currentTarget.style.background = "none";
                  }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Collapsed state ──
  if (isCollapsed) {
    return (
      <>
        <aside style={{
          width: 52, flexShrink: 0,
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          alignItems: "center", height: "100%",
          padding: "10px 0", gap: 2,
        }}>
          {/* Logo mark */}
          <div style={{ marginBottom: 8, padding: "4px 0" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--accent)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={14} color="white" />
            </div>
          </div>

          {/* New chat */}
          <IconBtn title="New chat" onClick={onNewThread}>
            <PenSquare size={16} />
          </IconBtn>

          <div style={{ flex: 1 }} />

          <IconBtn title="Settings" onClick={() => setShowSettings(true)}>
            <Settings size={16} />
          </IconBtn>
          <IconBtn title="Toggle theme" onClick={toggle}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </IconBtn>
        </aside>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </>
    );
  }

  // ── Expanded state ──
  return (
    <>
      <aside style={{
        width: 260, flexShrink: 0,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        height: "100%", overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "14px 14px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Wordmark + logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: "var(--accent)", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Sparkles size={13} color="white" />
            </div>
            <span style={{
              fontSize: 15, fontWeight: 600, color: "var(--text)",
              fontFamily: "var(--font-body)", letterSpacing: "-0.02em",
            }}>Jessica</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              title="Close sidebar"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 5, borderRadius: 6,
                color: "var(--text-dim)", display: "flex",
                alignItems: "center", transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--surface-hover)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--text-dim)";
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── New chat button ── */}
        <div style={{ padding: "0 10px 12px" }}>
          <button
            onClick={onNewThread}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "8px 12px", borderRadius: "var(--radius-xs)",
              background: "var(--accent)",
              border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 500,
              color: "#fff", fontFamily: "var(--font-body)",
              transition: "background var(--t) var(--ease), transform 0.15s var(--spring), box-shadow var(--t)",
              boxShadow: "0 1px 3px var(--brand-glow)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 8px var(--brand-glow)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--accent)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px var(--brand-glow)";
            }}
          >
            <Plus size={13} color="white" strokeWidth={2.5} style={{ flexShrink: 0 }} />
            New conversation
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 10px 10px" }} />

        {/* ── Thread list ── */}
        <div
          style={{ flex: 1, overflowY: "auto", padding: "0 6px 8px" }}
          className="custom-scrollbar"
        >
          {threads.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 10, padding: "36px 16px", textAlign: "center",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "var(--surface-2)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageSquare size={17} color="var(--text-dim)" />
              </div>
              <p style={{
                fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.55,
                fontFamily: "var(--font-body)",
              }}>
                No conversations yet.<br />Start one above ↑
              </p>
            </div>
          ) : (
            <>
              {renderGroup("Today",     groups.today)}
              {renderGroup("Yesterday", groups.yesterday)}
              {renderGroup("This Week", groups.thisWeek)}
              {renderGroup("Older",     groups.older)}
            </>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 10px 8px" }} />

        {/* ── Footer ── */}
        <div style={{ padding: "4px 10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              background: userRowHover ? "var(--surface-hover)" : "transparent",
              transition: "background var(--t)",
              marginBottom: 4,
            }}
            onMouseEnter={() => setUserRowHover(true)}
            onMouseLeave={() => setUserRowHover(false)}
            onClick={() => setShowSettings(true)}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent, #C96442), #F59E0B)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
                boxShadow: "0 2px 6px var(--brand-glow)",
              }}
            >
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName || "You"}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userEmail || "Deep Researcher"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <FooterBtn icon={<Settings size={15} />} label="Settings"     onClick={() => setShowSettings(true)} />
            <FooterBtn
              icon={isDark ? <Sun size={15} /> : <Moon size={15} />}
              label={isDark ? "Light mode" : "Dark mode"}
              onClick={toggle}
            />
          </div>
        </div>
      </aside>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────

function IconBtn({ title, onClick, children }: {
  title: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 34, height: 34, borderRadius: 7,
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-dim)", display: "flex",
        alignItems: "center", justifyContent: "center",
        transition: "background 0.12s, color 0.12s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "var(--surface-hover)";
        e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = "var(--text-dim)";
      }}
    >
      {children}
    </button>
  );
}

function FooterBtn({ icon, label, onClick }: {
  icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 9,
        padding: "7px 10px", borderRadius: 7,
        background: "none", border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 400,
        color: "var(--text-2)", fontFamily: "var(--font-body)",
        transition: "background 0.12s, color 0.12s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
        (e.currentTarget as HTMLElement).style.color = "var(--text)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "none";
        (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
      }}
    >
      <span style={{ color: "var(--text-dim)", display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      {label}
    </button>
  );
}
