import React, { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════
   isDeepResearch(query) → boolean
   ───────────────────────────────────────────────────
   Returns true only when the query looks like a
   deep-research task.  Use this to gate the card.
   ═══════════════════════════════════════════════════ */
export function isDeepResearch(query = "") {
  const q = query.toLowerCase().trim();

  const EXPLICIT  = ["research","deep research","investigate","find out","look up","what do we know","tell me about","search"];
  const ANALYTICAL= ["analys","explain","compare","summarise","summarize","overview","history of","origin of","root of","evolution of","background on","breakdown of","in depth","in-depth","comprehensive"];
  const FACTUAL   = ["is it true","fact check","evidence for","studies on","research on","literature on"];
  const Q_WORDS   = ["who","what","when","where","why","how"];

  if (EXPLICIT.some(k  => q.includes(k))) return true;
  if (ANALYTICAL.some(k => q.includes(k))) return true;
  if (FACTUAL.some(k   => q.includes(k))) return true;

  const words = q.split(/\s+/).filter(Boolean);
  if (words.length >= 5 && Q_WORDS.some(w => words.includes(w))) return true;

  return false;
}

const C = {
  cardBg:     "#242424",
  cardBorder: "#333",
  rowHover:   "#2e2e2e",
  text:       "#e8e6e1",
  muted:      "#888",
  accent:     "#cc785c",
};

/* ── Favicon color map ── */
const FAVI_MAP: Record<string, [string, string]> = {
  "wikipedia.org":  ["W", "#555"],
  "britannica.com": ["B", "#1a5276"],
  "academia.edu":   ["A", "#c0392b"],
  "google.com":     ["G", "#4285F4"],
  "study.com":      ["S", "#2471a3"],
  "reddit.com":     ["R", "#ff4500"],
  "youtube.com":    ["▶", "#cc0000"],
  "github.com":     ["GH","#24292e"],
};

function getFavicon(domain: string) {
  for (const [key, val] of Object.entries(FAVI_MAP)) {
    if (domain?.includes(key)) return val;
  }
  return [domain?.[0]?.toUpperCase() || "•", "#555"];
}

/* ── Icons ── */
function GlobeIcon({ size = 14, color = C.muted }: { size?: number, color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={C.muted} strokeWidth="2.2" strokeLinecap="round"
      style={{ transition: "transform .25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function Spinner({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ animation: "agentSpin 1.8s linear infinite", flexShrink: 0 }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const rad = (i * 45 * Math.PI) / 180;
        return <line key={i} x1="50" y1="50"
          x2={50 + 40 * Math.sin(rad)} y2={50 - 40 * Math.cos(rad)}
          stroke={C.accent} strokeWidth="10" strokeLinecap="round"
          opacity={0.25 + (i / 8) * 0.75}/>;
      })}
    </svg>
  );
}

/* ── Action type → icon SVG path ── */
const ACTION_ICONS: Record<string, { d?: string, isCheck?: boolean }> = {
  think:  { d: "M12 8v4l3 3M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" },
  search: {}, // uses GlobeIcon
  read:   { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" },
  write:  { d: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
  done:   { isCheck: true },
};

function ActionIcon({ type, active }: { type: string, active: boolean }) {
  const color = active ? C.accent : C.muted;
  if (type === "search") return <GlobeIcon size={13} color={color} />;
  const ico = ACTION_ICONS[type] || ACTION_ICONS.think;
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={ico.isCheck ? "#4caf50" : color} strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}>
      {ico.isCheck
        ? <polyline points="20 6 9 17 4 12"/>
        : <path d={ico.d}/>}
    </svg>
  );
}

function Dots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, marginLeft: "auto", flexShrink: 0 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: "50%", background: C.accent,
          animation: `agentDot 1s ease-in-out ${i * .15}s infinite`,
        }}/>
      ))}
    </span>
  );
}

function ActionRow({ action, isActive }: { action: any, isActive: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "5px 2px",
      animation: "agentFadeUp .2s ease",
    }}>
      <ActionIcon type={action.type} active={isActive} />
      <span style={{
        flex: 1, fontSize: 12.5, lineHeight: 1.4,
        color: isActive ? C.text : C.muted,
        fontStyle: isActive ? "italic" : "normal",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        transition: "color .3s",
      }}>
        {action.label}
      </span>
      {isActive  && <Dots />}
      {!isActive && action.done && <CheckIcon />}
    </div>
  );
}

function ResultRow({ result, index }: { result: any, index: number }) {
  const [hov, setHov] = useState(false);
  const [fav, color] = getFavicon(result.domain);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 8px", borderRadius: 8, cursor: "pointer",
        background: hov ? C.rowHover : "transparent",
        animation: `agentFadeUp .2s ease ${index * .04}s both`,
        transition: "background .15s",
      }}>
      <div style={{
        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
        background: color, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700,
      }}>
        {fav}
      </div>
      <span style={{
        flex: 1, fontSize: 12.5, color: C.text,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {result.title}
      </span>
      <span style={{ fontSize: 11.5, color: C.muted, flexShrink: 0, marginLeft: 6 }}>
        {result.domain}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN EXPORT — AgentSearchCard
══════════════════════════════════════ */
export default function AgentSearchCard({ 
  phase = "working", 
  actions = [], 
  results = [], 
  searchQuery = "" 
}: { 
  phase?: string, 
  actions?: any[], 
  results?: any[], 
  searchQuery?: string 
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);

  const isWorking  = ["working", "searching", "reading", "streaming"].includes(phase);
  const isDone     = phase === "done";
  const activeIdx  = actions.findIndex(a => !a.done);
  const activeLabel = actions[activeIdx]?.label ?? "";

  useEffect(() => {
    if (isDone) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setSeconds(parseFloat(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, [isDone]);

  useEffect(() => {
    if (isDone) {
      setFinalDuration(seconds || 0.1);
    }
  }, [isDone]);

  const displaySeconds = isDone ? (finalDuration ?? seconds) : seconds;
  const formattedSeconds = displaySeconds.toFixed(1);

  return (
    <div style={{
      background: C.cardBg,
      border: `1px solid ${C.cardBorder}`,
      borderRadius: 14,
      overflow: "hidden",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      width: "100%",
      marginBottom: 12,
      animation: "fadeUp .35s ease",
    }}>
      <style>{`
        @keyframes agentSpin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes agentDot     { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-4px); opacity:1; } }
        @keyframes agentFadeUp  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Header */}
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 14px",
          borderBottom: (collapsed || (actions.length === 0 && results.length === 0)) ? "none" : `1px solid ${C.cardBorder}`,
          cursor: "pointer", userSelect: "none",
          transition: "border .2s",
        }}>

        {isWorking
          ? <Spinner size={16} />
          : <CheckIcon />
        }

        <span style={{ fontSize: 13.5, fontWeight: 500, color: C.text, flex: 1 }}>
          {isDone ? `thoughts for (${formattedSeconds}s)` : `Thinking (${formattedSeconds}s)…`}
        </span>

        {collapsed && activeLabel && (
          <span style={{
            fontSize: 12, color: C.muted, maxWidth: 220,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {activeLabel}
          </span>
        )}

        {results.length > 0 && (
          <span style={{
            fontSize: 11, color: C.muted,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.cardBorder}`,
            borderRadius: 20, padding: "2px 9px", flexShrink: 0,
          }}>
            {results.length} sources
          </span>
        )}

        {(actions.length > 0 || results.length > 0) && <Chevron open={!collapsed} />}
      </div>

      {/* Body */}
      {(actions.length > 0 || results.length > 0) && (
        <div style={{
          maxHeight: collapsed ? 0 : 520,
          overflow: "hidden",
          transition: "max-height .35s ease",
        }}>
          <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 2 }}>

            {actions.length > 0 && (
              <div style={{ marginBottom: results.length > 0 ? 10 : 0 }}>
                {actions.map((action, i) => (
                  <ActionRow key={i} action={action} isActive={i === activeIdx} />
                ))}
              </div>
            )}

            {results.length > 0 && (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  paddingTop: 10, paddingBottom: 6,
                  borderTop: `1px solid ${C.cardBorder}`,
                }}>
                  <GlobeIcon size={13} />
                  <span style={{
                    flex: 1, fontSize: 12, color: C.muted,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {searchQuery}
                  </span>
                  <span style={{ fontSize: 11.5, color: C.muted, flexShrink: 0 }}>
                    {results.length} results
                  </span>
                </div>

                <div style={{ maxHeight: 210, overflowY: "auto" }}>
                  {results.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
                </div>

                <div style={{
                  height: 20, marginTop: -20, position: "relative",
                  pointerEvents: "none",
                  background: `linear-gradient(transparent, ${C.cardBg})`,
                }}/>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
