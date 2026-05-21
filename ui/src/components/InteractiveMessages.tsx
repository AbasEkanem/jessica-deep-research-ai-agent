"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// ── Chevron icon ─────────────────────────────────────────────────
const ChevronDown = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CheckIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 20 4 15" />
  </svg>
);
const CopyIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const PreviewIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const ThumbUp = ({ filled = false, size = 13 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);
const ThumbDown = ({ filled = false, size = 13 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);

// 1. Thinking / reasoning block
export function ThinkingBlock() {
  const [open, setOpen] = useState(false);
  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <button
        className={`im-thinking-toggle ${open ? "open" : ""}`}
        onClick={() => setOpen(o => !o)}
        style={{ gap: "10px" }}
      >
        <span className="im-thinking-dot" />
        <span style={{ flex: 1, textAlign: "left" }}>
          {open ? "Reasoning" : "Thought for 4 seconds"}
        </span>
        <ChevronDown className={`im-chevron ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="im-thinking-body im-fade-in">
          The user is asking about quantum entanglement. Let me think through this carefully.
          First, I should establish what entanglement actually is — the correlation of quantum states
          between particles such that measuring one instantly determines the state of the other,
          regardless of distance. This is often misunderstood as &ldquo;faster-than-light communication,&rdquo;
          but that&apos;s incorrect — no information is transferred. I&apos;ll clarify this distinction…
        </div>
      )}
      <div style={{ padding: "12px 16px", fontSize: 14, lineHeight: 1.75, color: "var(--text-muted)" }}>
        Quantum entanglement is a phenomenon where two particles become correlated so that the quantum state of each cannot be described independently — measuring one instantly determines the other&apos;s state, no matter the distance.
      </div>
    </div>
  );
}

// 2. Multiple choice / quiz
export interface QuizOption { letter: string; text: string; }
export interface MultipleChoiceProps { question: string; options: QuizOption[]; correct: string; }

export function MultipleChoice({ question, options, correct }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const getClass = (letter: string) => {
    if (!revealed) return selected === letter ? "selected" : "";
    if (letter === correct) return "correct";
    if (letter === selected && selected !== correct) return "wrong";
    return "";
  };

  // Normalize options in case LLM outputs strings instead of objects
  const normalizedOptions: QuizOption[] = (Array.isArray(options) ? options : []).map((o, i) => {
    if (typeof o === "string") {
      return { letter: String.fromCharCode(65 + i), text: o };
    }
    return {
      letter: o?.letter || String.fromCharCode(65 + i),
      text: o?.text || JSON.stringify(o)
    };
  });

  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div style={{ padding: "12px 16px 4px", fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
        {question}
      </div>
      <div className="im-options-list">
        {normalizedOptions.map(o => (
          <button
            key={o.letter}
            className={`im-option-btn ${getClass(o.letter)}`}
            onClick={() => { if (!revealed) setSelected(o.letter); }}
          >
            <span className="im-option-letter">{o.letter}</span>
            <span className="im-option-text">{o.text}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: "0 16px 14px", display: "flex", gap: 8 }}>
        <button
          className="im-btn-primary"
          style={{ fontSize: 12, padding: "6px 14px" }}
          disabled={!selected}
          onClick={() => setRevealed(true)}
        >
          Check answer
        </button>
        {revealed && (
          <span className="im-fade-in" style={{ fontSize: 12.5, color: selected === correct ? "var(--green)" : "var(--red)", display: "flex", alignItems: "center", gap: 5 }}>
            {selected === correct ? "✓ Correct!" : `✗ The answer is ${correct}`}
          </span>
        )}
      </div>
    </div>
  );
}

// 3. Code artifact with copy / preview
const CODE = `<span class="im-token-kw">async function</span> <span class="im-token-fn">fetchWeather</span>(city) {
  <span class="im-token-kw">const</span> url = <span class="im-token-str">\`https://api.weather.com/v1/\${city}\`</span>;
  <span class="im-token-kw">const</span> res = <span class="im-token-kw">await</span> <span class="im-token-fn">fetch</span>(url);
  <span class="im-token-cm">// Throw on non-200 status codes</span>
  <span class="im-token-kw">if</span> (!res.ok) <span class="im-token-kw">throw new</span> <span class="im-token-fn">Error</span>(<span class="im-token-str">\`HTTP \${res.status}\`</span>);
  <span class="im-token-kw">return</span> res.<span class="im-token-fn">json</span>();
}`;

const RAW_CODE = `async function fetchWeather(city) {
  const url = \`https://api.weather.com/v1/\${city}\`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}`;

export function CodeArtifact() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(RAW_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div style={{ padding: "8px 16px 8px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
        Here&apos;s the fetch utility:
      </div>
      <div style={{ margin: "0 0 0 0", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginLeft: 16, marginRight: 16, marginBottom: 14 }}>
        <div className="im-artifact-header">
          <span className="im-artifact-lang">JavaScript</span>
          <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>fetchWeather.js</span>
          <div className="im-artifact-actions">
            <button className={`im-icon-btn ${copied ? "copied" : ""}`} onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button className="im-icon-btn">
              <PreviewIcon />
              Preview
            </button>
          </div>
        </div>
        <pre className="im-code-body" dangerouslySetInnerHTML={{ __html: CODE }} />
      </div>
    </div>
  );
}

// 4. Tabbed response
export interface TabItem { id: string; label: string; content: string; }
export interface TabbedResponseProps { tabs: TabItem[]; }

export function TabbedResponse({ tabs }: TabbedResponseProps) {
  const [active, setActive] = useState(tabs[0]?.id || "");
  const tab = tabs.find(t => t.id === active) || tabs[0];
  
  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div className="im-tab-bar">
        {tabs.map(t => (
          <button key={t.id} className={`im-tab-btn ${active === t.id ? "active" : ""}`} onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="im-tab-content im-fade-in" key={active}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {tab.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// 5. Comparison table
const ROWS = [
  { name: "GPT-4o", ctx: "128k", multimodal: true, speed: "Fast", open: false },
  { name: "Claude 3.5", ctx: "200k", multimodal: true, speed: "Fast", open: false },
  { name: "Gemini 1.5", ctx: "1M", multimodal: true, speed: "Medium", open: false },
  { name: "Llama 3 70B", ctx: "8k", multimodal: false, speed: "Fast", open: true },
];

export function ComparisonTable() {
  const [sort, setSort] = useState<string | null>(null);
  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div style={{ padding: "10px 16px 4px", fontSize: 13.5, color: "var(--text-muted)" }}>
        Here&apos;s a comparison of leading LLMs:
      </div>
      <div style={{ overflowX: "auto", padding: "0 0 14px" }}>
        <table className="im-compare-table">
          <thead>
            <tr>
              {["Model","Context","Multimodal","Speed","Open-source"].map(h => (
                <th key={h} style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setSort(h === sort ? null : h)}>
                  {h}{sort === h ? " ▲" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(r => (
              <tr key={r.name}>
                <td style={{ fontWeight: 600, color: "var(--text)" }}>{r.name}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{r.ctx}</td>
                <td><span className={`im-badge ${r.multimodal ? "green" : "red"}`}>{r.multimodal ? "✓ Yes" : "✗ No"}</span></td>
                <td><span className={`im-badge ${r.speed === "Fast" ? "green" : "yellow"}`}>{r.speed}</span></td>
                <td><span className={`im-badge ${r.open ? "green" : "red"}`}>{r.open ? "✓ Yes" : "✗ No"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 6. Inline citation with tooltip
export function InlineCitation() {
  const [tooltip, setTooltip] = useState<{ id: number; x: number; y: number } | null>(null);
  const refs: Record<number, { title: string; desc: string }> = {
    1: { title: "Nature, 574, 505–510 (2019)", desc: "Arute et al. — Google's quantum supremacy demonstration using a 53-qubit Sycamore processor." },
    2: { title: "Quantum, 2, 79 (2018)", desc: "Preskill — coined the term NISQ era; discusses near-term quantum devices and their limitations." },
  };
  const show = (e: React.MouseEvent, id: number) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTooltip({ id, x: r.left, y: r.bottom + 6 });
  };
  return (
    <div className="im-card" onClick={() => setTooltip(null)}>
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div className="im-prose">
        Google claimed quantum supremacy in 2019 when their Sycamore processor solved a sampling task
        in 200 seconds that would take a classical supercomputer ~10,000 years{" "}
        <a className="im-cite" onClick={e => { e.stopPropagation(); show(e, 1); }}>1</a>.
        This milestone marked the beginning of what Preskill termed the{" "}
        <em>Noisy Intermediate-Scale Quantum</em> (NISQ) era{" "}
        <a className="im-cite" onClick={e => { e.stopPropagation(); show(e, 2); }}>2</a>,
        where devices have 50–1000 qubits but are still too error-prone for fault-tolerant computation.
      </div>
      {tooltip && (
        <div className="im-cite-tooltip im-fade-in" style={{ left: Math.min(tooltip.x, (typeof window !== "undefined" ? window.innerWidth : 800) - 300), top: tooltip.y }}>
          <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4, fontSize: 11.5 }}>
            [{tooltip.id}] {refs[tooltip.id].title}
          </div>
          {refs[tooltip.id].desc}
        </div>
      )}
    </div>
  );
}

// 7. Step-by-step process
export interface StepItem { title: string; desc: string; }
export interface StepByStepProps { title?: string; steps: StepItem[]; }

export function StepByStep({ title = "Here's my recommended approach — click a step to focus it:", steps }: StepByStepProps) {
  const [activeStep, setActiveStep] = useState(0);
  
  if (!steps || steps.length === 0) return null;

  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div style={{ padding: "10px 16px 4px", fontSize: 13.5, color: "var(--text-muted)" }}>
        {title}
      </div>
      <div className="im-steps-list">
        {steps.map((s, i) => {
          const state = i < activeStep ? "done" : i === activeStep ? "active" : "idle";
          return (
            <div key={i} className="im-step-row" onClick={() => setActiveStep(i)} style={{ cursor: "pointer" }}>
              <div className="im-step-spine">
                <div className={`im-step-num ${state}`}>
                  {state === "done" ? <CheckIcon size={12} /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className="im-step-line" />}
              </div>
              <div className="im-step-content">
                <div className="im-step-title" style={{ color: state === "active" ? "var(--text)" : state === "done" ? "var(--green)" : "var(--text-muted)" }}>
                  {s.title}
                </div>
                {state === "active" && (
                  <div className="im-step-desc im-fade-in">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {s.desc}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 8. Reaction / feedback bar
export function ReactionBar() {
  const [vote, setVote] = useState<string | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const EMOJIS = [
    { id: "helpful", label: "Helpful", emoji: "👍" },
    { id: "interesting", label: "Interesting", emoji: "✨" },
    { id: "unclear", label: "Unclear", emoji: "🤔" },
    { id: "wrong", label: "Wrong", emoji: "✗" },
  ];
  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div style={{ padding: "12px 16px 8px", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
        The time complexity of merge sort is O(n log n) in all cases — best, average, and worst.
        Space complexity is O(n) due to the auxiliary array used during merging.
      </div>
      <div className="im-reaction-bar">
        <button className={`im-reaction-btn ${vote === "up" ? "active" : ""}`} onClick={() => setVote(v => v === "up" ? null : "up")}
          style={vote === "up" ? { color: "var(--green)", borderColor: "var(--green)", background: "rgba(52,211,153,.08)" } : {}}>
          <ThumbUp filled={vote === "up"} />
        </button>
        <button className={`im-reaction-btn ${vote === "down" ? "active" : ""}`} onClick={() => setVote(v => v === "down" ? null : "down")}
          style={vote === "down" ? { color: "var(--red)", borderColor: "var(--red)", background: "rgba(248,113,113,.08)" } : {}}>
          <ThumbDown filled={vote === "down"} />
        </button>
        <div className="im-reaction-sep" />
        {EMOJIS.map(e => (
          <button key={e.id} className={`im-reaction-btn ${reaction === e.id ? "active" : ""}`}
            onClick={() => setReaction(r => r === e.id ? null : e.id)} title={e.label}>
            <span style={{ fontSize: 13 }}>{e.emoji}</span>
            <span className="im-reaction-count" style={{ fontSize: 11 }}>{e.label}</span>
          </button>
        ))}
        {(vote || reaction) && (
          <span className="im-fade-in" style={{ fontSize: 11.5, color: "var(--text-dim)", marginLeft: "auto" }}>
            Thanks for the feedback
          </span>
        )}
      </div>
    </div>
  );
}

// 9. Confirm / action prompt
export function ConfirmAction() {
  const [state, setState] = useState<"idle" | "sending" | "edit" | "cancel">("idle");
  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div className="im-confirm-body">
        {state === "idle" && <>
          <p className="im-confirm-msg">
            I&apos;m ready to send the research report to <strong style={{ color: "var(--text)" }}>team@company.com</strong>.
            It includes 14 pages and 3 charts. Should I proceed?
          </p>
          <div className="im-confirm-actions">
            <button className="im-btn-primary" onClick={() => setState("sending")}>Yes, send it</button>
            <button className="im-btn-ghost" onClick={() => setState("edit")}>Edit first</button>
            <button className="im-btn-danger" onClick={() => setState("cancel")}>Cancel</button>
          </div>
        </>}
        {state === "sending" && <p className="im-confirm-msg im-fade-in" style={{ color: "var(--green)" }}>✓ Report sent to team@company.com successfully.</p>}
        {state === "edit" && <p className="im-confirm-msg im-fade-in">Sure — what would you like to change before I send it?</p>}
        {state === "cancel" && <p className="im-confirm-msg im-fade-in" style={{ color: "var(--text-dim)" }}>Cancelled. The report wasn&apos;t sent.</p>}
        {state !== "idle" && (
          <button className="im-btn-ghost" style={{ fontSize: 12, marginTop: 8 }} onClick={() => setState("idle")}>← Reset demo</button>
        )}
      </div>
    </div>
  );
}

// 10. Parameter sliders
export function ParameterSliders() {
  const [temp, setTemp] = useState(0.7);
  const [tokens, setTokens] = useState(1024);
  const [topP, setTopP] = useState(0.9);
  return (
    <div className="im-card">
      <div className="im-msg-header"><span className="im-msg-header-dot" /> Jessica</div>
      <div style={{ padding: "10px 16px 4px", fontSize: 13.5, color: "var(--text-muted)" }}>
        Adjust the generation parameters:
      </div>
      <div className="im-slider-wrap">
        {[
          { label: "Temperature", val: temp, set: setTemp, min: 0, max: 2, step: 0.05 },
          { label: "Max tokens", val: tokens, set: setTokens, min: 64, max: 4096, step: 64 },
          { label: "Top-p", val: topP, set: setTopP, min: 0, max: 1, step: 0.05 },
        ].map(s => (
          <div key={s.label} className="im-slider-row">
            <span className="im-slider-label">{s.label}</span>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e => s.set(Number(e.target.value))} />
            <span className="im-slider-val">{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
