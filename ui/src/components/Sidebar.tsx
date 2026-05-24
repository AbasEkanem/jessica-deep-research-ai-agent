"use client";
import { useState, useEffect } from "react";
import {
  Plus, MessageSquare, Trash2, X, Sun, Moon,
  Sparkles, BrainCircuit, Globe, Mail,
  FlaskConical, FileText, Settings, Zap, PenSquare,
  Search, LayoutGrid, History
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

  // ── Collapsed state — Gemini icon strip (gemini_ui.png) ──────
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
            <Image
              src="/jessica-avatar.png"
              alt="Jessica"
              width={28}
              height={28}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "top",
                border: "1.5px solid rgba(217,115,85,0.25)",
              }}
            />
          </div>
          {/* Top icons: pen, search, grid */}
          <IconBtn title="New chat" onClick={onNewThread}>
            <PenSquare size={16} />
          </IconBtn>
          <IconBtn title="Search chats" onClick={() => {}}>
            <Search size={16} />
          </IconBtn>
          <IconBtn title="Library" onClick={() => {}}>
            <LayoutGrid size={16} />
          </IconBtn>

          <div style={{ flex: 1 }} />

          {/* Bottom icons: activity, settings+dot, avatar */}
          <IconBtn title="Activity" onClick={() => {}}>
            <History size={16} />
          </IconBtn>
          <div style={{ position: "relative" }}>
            <IconBtn title="Settings" onClick={() => setShowSettings(true)}>
              <Settings size={16} />
            </IconBtn>
            <span style={{
              position: "absolute", top: 6, right: 6,
              width: 7, height: 7, borderRadius: "50%",
              background: "#3b82f6",
              border: "1.5px solid var(--bg-sidebar)",
              pointerEvents: "none",
            }} />
          </div>
          <IconBtn title="Toggle theme" onClick={toggle}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </IconBtn>
        </aside>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </>
    );
  }

  // ── Expanded state — Gemini open sidebar (side_bar_toggled_open.png) ──
  return (
    <>
      <aside style={{
        width: 260, flexShrink: 0,
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        height: "100%", overflow: "hidden",
      }}>

        {/* ── Header: logo + wordmark + collapse toggle ── */}
        <div style={{
          padding: "14px 8px 8px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image
              src="/jessica-avatar.png"
              alt="Jessica"
              width={26}
              height={26}
              style={{
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "top",
                border: "1.5px solid rgba(217,115,85,0.25)",
                flexShrink: 0,
              }}
            />
            <span style={{
              fontSize: 16, fontWeight: 600, color: "var(--text)",
              fontFamily: "var(--font-body)", letterSpacing: "-0.02em",
            }}>Jessica</span>
          </div>
          {/* Panel collapse icon — □ with vertical divider, matches Gemini */}
          {onClose && (
            <button
              onClick={onClose}
              title="Close sidebar"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 6, borderRadius: 8,
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── Nav items: New chat / Search chats / Library ── */}
        {/* Full-width pill shape, "New chat" always has filled bg (Gemini default) */}
        <nav style={{ padding: "2px 8px 4px", flexShrink: 0 }}>
          {[
            { icon: <PenSquare size={18} strokeWidth={1.8} />, label: "New chat", onClick: onNewThread, alwaysFilled: true },
            { icon: <Search size={18} strokeWidth={1.8} />,    label: "Search chats", onClick: () => {}, alwaysFilled: false },
            { icon: <LayoutGrid size={18} strokeWidth={1.8} />,label: "Library", onClick: () => {}, alwaysFilled: false },
          ].map(({ icon, label, onClick, alwaysFilled }) => (
            <GeminiNavItem key={label} icon={icon} label={label} onClick={onClick} alwaysFilled={alwaysFilled} />
          ))}
        </nav>

        {/* ── Notebooks section ── */}
        <div style={{ padding: "6px 8px 0", flexShrink: 0 }}>
          <p style={{
            fontSize: 12, color: "var(--text-dim)", fontWeight: 400,
            fontFamily: "var(--font-body)", padding: "0 8px", marginBottom: 2,
          }}>Notebooks</p>
          <button
            onClick={() => {}}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "8px 8px", borderRadius: 8,
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 13.5, color: "var(--text-2)", fontFamily: "var(--font-body)",
              transition: "background 0.12s", textAlign: "left",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Plus size={15} strokeWidth={2} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
            New notebook
          </button>
        </div>

        {/* ── Recents label ── */}
        <div style={{ padding: "10px 16px 4px", flexShrink: 0 }}>
          <p style={{
            fontSize: 12, color: "var(--text-dim)", fontWeight: 400,
            fontFamily: "var(--font-body)",
          }}>Recents</p>
        </div>

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
            /* Flat list — no time-group headers, plain text rows like Gemini */
            threads.map((thread) => {
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
                      width: "100%", display: "flex", alignItems: "center",
                      padding: "7px 8px", borderRadius: 8, textAlign: "left",
                      background: isActive  ? "var(--surface-active)"  :
                                  isHovered ? "var(--surface-hover)"    : "transparent",
                      border: "none", cursor: "pointer",
                      transition: "background 0.12s",
                      paddingRight: isHovered ? 34 : 8,
                    }}
                  >
                    <span style={{
                      fontSize: 13.5,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "var(--text)" : "var(--text-2)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                      fontFamily: "var(--font-body)",
                    }}>{thread.title}</span>
                  </button>
                  {isHovered && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id); }}
                      style={{
                        position: "absolute", right: 4, top: "50%",
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
            })
          )}
        </div>

        {/* ── Bottom: Activity + user row ── */}
        <div style={{ flexShrink: 0, padding: "0 8px 12px" }}>
          {/* Activity nav item */}
          <GeminiNavItem
            icon={<History size={18} strokeWidth={1.8} />}
            label="Activity"
            onClick={() => {}}
            alwaysFilled={false}
          />

          {/* User row: avatar + name + settings gear with blue dot */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 24,
              cursor: "pointer",
              background: userRowHover ? "var(--surface-hover)" : "transparent",
              transition: "background var(--t)",
              marginTop: 2,
            }}
            onMouseEnter={() => setUserRowHover(true)}
            onMouseLeave={() => setUserRowHover(false)}
          >
            {/* Avatar circle */}
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent, #C96442), #F59E0B)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 600, flexShrink: 0,
              boxShadow: "0 2px 6px var(--brand-glow)",
            }}>
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>

            {/* Name only — matches Gemini screenshot */}
            <div style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 500, color: "var(--text)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                fontFamily: "var(--font-body)",
              }}>
                {userName || "You"}
              </div>
              <div style={{
                fontSize: 11, color: "var(--text-muted)", marginTop: 1,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                fontFamily: "var(--font-body)",
              }}>
                {userEmail || "Deep Researcher"}
              </div>
            </div>

            {/* Settings gear + blue dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                title="Settings"
                onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 5, borderRadius: 7, color: "var(--text-dim)",
                  display: "flex", alignItems: "center",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "var(--surface-active)";
                  e.currentTarget.style.color = "var(--text)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--text-dim)";
                }}
              >
                <Settings size={16} strokeWidth={1.8} />
              </button>
              <span style={{
                position: "absolute", top: 4, right: 4,
                width: 7, height: 7, borderRadius: "50%",
                background: "#3b82f6",
                border: "1.5px solid var(--bg-sidebar)",
                pointerEvents: "none",
              }} />
            </div>
          </div>

          {/* Theme toggle — kept from original */}
          <FooterBtn
            icon={isDark ? <Sun size={15} /> : <Moon size={15} />}
            label={isDark ? "Light mode" : "Dark mode"}
            onClick={toggle}
          />
        </div>
      </aside>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

// ── Gemini pill nav item ──────────────────────────────────────
function GeminiNavItem({ icon, label, onClick, alwaysFilled }: {
  icon: React.ReactNode; label: string; onClick: () => void; alwaysFilled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "10px 12px", borderRadius: 24,
        background: alwaysFilled || hovered ? "var(--surface-hover)" : "transparent",
        border: "none", cursor: "pointer",
        fontSize: 14, fontWeight: alwaysFilled ? 500 : 400,
        color: "var(--text)",
        fontFamily: "var(--font-body)",
        transition: "background 0.12s",
        textAlign: "left",
      }}
    >
      <span style={{ color: "var(--text-dim)", display: "flex", alignItems: "center", flexShrink: 0 }}>
        {icon}
      </span>
      {label}
    </button>
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