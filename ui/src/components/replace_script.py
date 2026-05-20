import sys

path = r'c:\Users\Bussiness Sensor\Desktop\jessica_project\ui\src\components\ChatArea.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.startswith('// AgentStatusFeed'):
        start_idx = i - 1
    elif start_idx != -1 and line.startswith('// ToolPills'):
        end_idx = i - 1
        break

if start_idx != -1 and end_idx != -1:
    NEW_COMPONENT = """// ─────────────────────────────────────────────
// AgentThoughtProcessFeed — Replaces old timeline card
// ─────────────────────────────────────────────
interface AgentThoughtProcessFeedProps {
  steps: StatusStep[];
  isActive: boolean;
}

const THOUGHT_COLORS: Record<string, { dot: string, bg: string, border: string, icon: string, label: string }> = {
  search: { dot: "#6ee7f7", bg: "rgba(110,231,247,0.08)", border: "rgba(110,231,247,0.18)", icon: "⌕", label: "Web Search" },
  read:   { dot: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.18)", icon: "◈", label: "Reading Sources" },
  reason: { dot: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.18)", icon: "◎", label: "Reasoning" },
  write:  { dot: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.18)", icon: "✦", label: "Synthesizing" },
};

function getStepType(s: StatusStep) {
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
    <div
      style={{
        display: "flex",
        gap: 12,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: `opacity 0.35s ease ${index * 0.06}s, transform 0.35s ease ${index * 0.06}s`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
        <div
          style={{
            width: 20, height: 20, borderRadius: "50%", background: colors.bg, border: `1.5px solid ${colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: colors.dot, flexShrink: 0, marginTop: 1,
          }}
        >
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
          <span style={{ fontSize: 10, color: "#475569", fontFamily: "'DM Mono', monospace" }}>
            +{timeStr}
          </span>
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
        <span className="jessica-status-label jessica-status-dots" style={{ fontSize: 12 }}>
          Thinking
        </span>
      </div>
    );
  }

  const totalMs = steps.length > 1 ? steps[steps.length - 1].timestamp - steps[0].timestamp : 0;
  const totalTime = (totalMs / 1000).toFixed(1);

  const lastStep       = steps[steps.length - 1];
  const isSearching    = isActive && (lastStep?.phase === "searching" || lastStep?.tool?.includes("search"));
  const searchQuery    = isSearching ? lastStep?.detail : undefined;

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
          <span style={{ width: 18, height: 18, borderRadius: "50%", background: isActive ? "linear-gradient(135deg, #6ee7f7 0%, #a78bfa 50%, #34d399 100%)" : "#34d399", backgroundSize: "200% 200%", animation: isActive ? "shimmer-ring 2.5s linear infinite" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {!isActive && <span style={{ color: "#000", fontSize: 10, fontWeight: "bold" }}>✓</span>}
          </span>
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
            {isActive ? "Thinking for " : "Thought for "}
            <span style={{ color: "#cbd5e1", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
              {totalTime}s
            </span>
          </span>
          <svg className={`tp-chevron${open ? " open" : ""}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={`tp-dropdown${open ? " open" : ""}`} ref={containerRef}>
          <div style={{ marginTop: 4, borderRadius: 14, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(148, 163, 184, 0.1)", backdropFilter: "blur(12px)", padding: "18px 20px 16px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                Research Trace
              </span>
              <span style={{ fontSize: 11, color: "#334155", fontFamily: "'DM Mono', monospace" }}>
                {steps.length} steps · {totalTime}s total
              </span>
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
"""
    lines = lines[:start_idx] + [NEW_COMPONENT + '\n'] + lines[end_idx:]
    content = ''.join(lines)
    content = content.replace('<AgentStatusFeed', '<AgentThoughtProcessFeed')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Done")
else:
    print("Could not find start or end index.")
