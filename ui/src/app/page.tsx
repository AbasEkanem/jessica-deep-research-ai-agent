"use client";

import { useState, useCallback, useEffect } from "react";
import { Menu, PenSquare, Sun, Moon, LogOut } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import { LoginScreen } from "@/components/LoginScreen";
import { Thread } from "@/types/chat";
import { useTheme } from "@/context/ThemeContext";

/** Generate or retrieve a persistent user ID scoped to this browser. */
function getOrCreateUserId(): string {
  const key = "jessica_user_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function HomePage() {
  const [threads, setThreads]               = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [userId, setUserId]                 = useState<string>("");
  const [userEmail, setUserEmail]           = useState<string>("");
  const [userName, setUserName]             = useState<string>("");
  const [isLoggedIn, setIsLoggedIn]         = useState(false);
  const [hydrated, setHydrated]             = useState(false);
  const { theme, toggle }                   = useTheme();
  const isDark = theme === "dark";

  // On mount: check for existing session
  useEffect(() => {
    const savedEmail = localStorage.getItem("jessica_user_email");
    const savedName = localStorage.getItem("jessica_user_name");
    const savedUserId = localStorage.getItem("jessica_user_id");

    if (savedEmail && savedUserId) {
      setUserEmail(savedEmail);
      setUserName(savedName || "");
      setUserId(savedUserId);
      setIsLoggedIn(true);

      // Load threads for this user
      const savedThreads = localStorage.getItem(`jessica_threads_${savedUserId}`);
      const savedActive = localStorage.getItem(`jessica_active_${savedUserId}`);
      if (savedThreads) {
        try { setThreads(JSON.parse(savedThreads)); } catch {}
      }
      setActiveThreadId(savedActive ?? crypto.randomUUID());
    }
    setHydrated(true);
  }, []);

  // Persist threads per user
  useEffect(() => {
    if (!userId || threads.length === 0) return;
    localStorage.setItem(`jessica_threads_${userId}`, JSON.stringify(threads));
  }, [threads, userId]);

  useEffect(() => {
    if (!userId || !activeThreadId) return;
    localStorage.setItem(`jessica_active_${userId}`, activeThreadId);
  }, [activeThreadId, userId]);

  const handleNewThread = useCallback(() => {
    setActiveThreadId(crypto.randomUUID());
    setSidebarOpen(false);
  }, []);

  const handleFirstMessage = useCallback((text: string) => {
    const title = text.length > 52 ? text.slice(0, 49) + "…" : text;
    setThreads(prev => {
      const exists = prev.find(t => t.id === activeThreadId);
      if (exists) {
        return prev.map(t => t.id === activeThreadId
          ? { ...t, title, preview: text.slice(0, 90), timestamp: Date.now(), messageCount: t.messageCount + 1 }
          : t);
      }
      return [{ id: activeThreadId, title, preview: text.slice(0, 90), timestamp: Date.now(), messageCount: 1 }, ...prev];
    });
  }, [activeThreadId]);

  const handleDeleteThread = useCallback((id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (id === activeThreadId) setActiveThreadId(crypto.randomUUID());
  }, [activeThreadId]);

  const handleLogin = useCallback((email: string, firstName: string, lastName: string) => {
    const uid = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    localStorage.setItem("jessica_user_email", email);
    localStorage.setItem("jessica_user_name", firstName + (lastName ? " " + lastName : ""));
    localStorage.setItem("jessica_user_id", uid);
    setUserEmail(email);
    setUserName(firstName + (lastName ? " " + lastName : ""));
    setUserId(uid);
    setActiveThreadId(crypto.randomUUID());
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("jessica_user_email");
    localStorage.removeItem("jessica_user_name");
    localStorage.removeItem("jessica_user_id");
    setIsLoggedIn(false);
    setUserEmail("");
    setUserName("");
    setUserId("");
    setThreads([]);
    setActiveThreadId("");
  }, []);

  const currentThread = threads.find(t => t.id === activeThreadId);

  const iconBtnStyle: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    padding: 8, borderRadius: "50%", color: "var(--text-muted)",
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 40, height: 40, transition: "background 0.15s, color 0.15s",
    flexShrink: 0,
  };

  // Don't render until hydrated
  if (!hydrated) return null;

  // Show login screen if not authenticated
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!userId || !activeThreadId) return null;

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "var(--bg)", position: "relative" }}>

      {/* ── Overlay (closes sidebar on outside click) ── */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Desktop Rail (56px, always visible ≥640px) ── */}
      <div className="desktop-rail" style={{
        width: 56, flexDirection: "column", height: "100%",
        flexShrink: 0, background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)",
      }}>
        {/* Top: hamburger + new chat */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", gap: 2 }}>
          <button
            onClick={() => setSidebarOpen(v => !v)} title="Toggle sidebar"
            style={iconBtnStyle}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <Menu size={20} />
          </button>
          <button
            onClick={handleNewThread} title="New chat"
            style={{ ...iconBtnStyle, color: "var(--text)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <PenSquare size={19} />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Bottom: logout + theme toggle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0 16px", gap: 2 }}>
          <button
            onClick={handleLogout} title="Sign out"
            style={{ ...iconBtnStyle, color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <LogOut size={18} />
          </button>
          <button
            onClick={toggle} title={isDark ? "Light mode" : "Dark mode"}
            style={{ ...iconBtnStyle, color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Top Bar (hidden ≥640px) ── */}
      <div className="mobile-top-bar" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
        height: 52, alignItems: "center", justifyContent: "space-between",
        padding: "0 8px",
        background: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border)",
      }}>
        <button onClick={() => setSidebarOpen(v => !v)} title="Menu" style={iconBtnStyle}>
          <Menu size={21} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 650, color: "var(--text)", letterSpacing: "-0.02em" }}>
          Jessica
        </span>
        <button onClick={handleNewThread} title="New chat" style={{ ...iconBtnStyle, color: "var(--text)" }}>
          <PenSquare size={19} />
        </button>
      </div>

      {/* ── Full Sidebar Panel (slides in) ── */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 50, height: "100%",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: sidebarOpen ? "auto" : "none",
        }}
      >
        <Sidebar
          threads={threads}
          activeThreadId={activeThreadId}
          isCollapsed={false}
          onSelectThread={(id) => { setActiveThreadId(id); setSidebarOpen(false); }}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(v => !v)}
        />
      </div>

      {/* ── Main area ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, width: "100%", height: "100%", overflow: "hidden" }}>

        {/* Mobile spacer — prevents content hiding under fixed top bar */}
        <div className="mobile-top-bar" style={{ height: 52, flexShrink: 0, pointerEvents: "none", border: "none", background: "transparent" }} />

        {/* Desktop header bar */}
        <header className="desktop-rail" style={{
          alignItems: "center", padding: "0 16px", flexShrink: 0,
          background: "var(--bg)", borderBottom: "1px solid var(--border)",
          height: 48,
        }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
              {currentThread?.title ?? ""}
            </span>
          </div>
          {/* Live status dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 40, justifyContent: "flex-end" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div className="ping" style={{ position: "absolute", width: 7, height: 7, borderRadius: "50%", background: "var(--green)", opacity: 0.4 }} />
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)" }} />
            </div>
          </div>
        </header>

        {/* Chat area — takes all remaining height */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <ChatArea
            key={activeThreadId}
            threadId={activeThreadId}
            userId={userId}
            userName={userName}
            onFirstMessage={handleFirstMessage}
          />
        </div>
      </main>
    </div>
  );
}
