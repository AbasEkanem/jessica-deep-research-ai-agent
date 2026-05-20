import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, Zap, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamAsk, getHistory } from '../services/api';

// ── Helpers ─────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

const TOOL_LABELS = {
  websearcher:   '🌐 Web Search',
  email_agent:   '📧 Email Agent',
  coding_agent:  '💻 Code Agent',
  tavily_search: '🔍 Tavily',
  exa_search:    '🔭 Exa',
  serper_search: '📡 Serper',
  serpapi:       '📊 SerpAPI',
  manage_memory: '🧠 Memory',
  search_memory: '🧠 Memory',
  get_current_datetime: '🕐 DateTime',
  write_file:    '📝 Write File',
  read_file:     '📂 Read File',
  render_metric_row:       '📊 Metrics',
  render_comparison_table: '📋 Table',
  render_action_buttons:   '🔘 Actions',
};

function toolLabel(name) {
  return TOOL_LABELS[name] || `⚙️ ${name.replace(/_/g, ' ')}`;
}

// ── Status phase labels ─────────────────────────────────────────
const PHASE_LABELS = {
  thinking:  '🧠 Thinking…',
  searching: '🔍 Searching…',
  reading:   '📖 Reading sources…',
  writing:   '✍️ Composing response…',
  memory:    '🧠 Accessing memory…',
  subagent:  '🤖 Sub-agent working…',
};

// ── UI Block Components ─────────────────────────────────────────
function MetricRowBlock({ metrics }) {
  if (!metrics?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0' }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          flex: '1 1 110px', padding: '10px 14px', borderRadius: 10,
          border: '1px solid rgba(139,92,246,0.15)', background: 'rgba(18,18,31,0.6)',
        }}>
          <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{m.label}</p>
          <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{m.value}</p>
          {m.delta && (
            <p style={{ margin: 0, fontSize: '0.68rem', marginTop: 3, color: m.positive ? '#34d399' : '#f87171' }}>
              {m.positive ? '▲' : '▼'} {m.delta}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ComparisonTableBlock({ columns, rows }) {
  if (!columns?.length || !rows?.length) return null;
  return (
    <div style={{ overflowX: 'auto', margin: '10px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.78rem' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: '7px 12px', textAlign: 'left', fontWeight: 600,
                borderBottom: '1px solid rgba(139,92,246,0.15)', color: 'var(--text-primary)',
                fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                background: 'rgba(18,18,31,0.4)',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionButtonsBlock({ actions, onSelect }) {
  if (!actions?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => onSelect?.(a.value)}
          style={{
            padding: '6px 14px', borderRadius: 16, fontSize: '0.78rem', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
            background: a.style === 'primary' ? 'rgba(124,58,237,0.2)' : a.style === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(18,18,31,0.6)',
            border: a.style === 'primary' ? '1px solid rgba(124,58,237,0.4)' : a.style === 'danger' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(139,92,246,0.15)',
            color: a.style === 'primary' ? '#a78bfa' : a.style === 'danger' ? '#f87171' : 'var(--text-secondary)',
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

const UI_BLOCK_MAP = {
  metric_row: MetricRowBlock,
  comparison_table: ComparisonTableBlock,
  action_buttons: ActionButtonsBlock,
};

// ── Thinking indicator ──────────────────────────────────────────
function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '10px 0', alignItems: 'center' }}>
      <div className="thinking-dot" />
      <div className="thinking-dot" />
      <div className="thinking-dot" />
    </div>
  );
}

// ── Status indicator ────────────────────────────────────────────
function StatusIndicator({ phase }) {
  if (!phase) return null;
  const label = PHASE_LABELS[phase] || `⚙️ ${phase}…`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', marginBottom: 4 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: '#a78bfa',
        animation: 'onlinePulse 1s infinite',
      }} />
      <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Single message bubble ───────────────────────────────────────
function MessageBubble({ message, isStreaming, onActionSelect }) {
  const isUser = message.role === 'user';

  return (
    <div
      className="msg-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 6,
        marginBottom: 20,
      }}
    >
      {/* Tool pills */}
      {!isUser && message.tools?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, paddingLeft: 2 }}>
          {message.tools.map((t, i) => (
            <span key={i} className="tool-pill">
              <Zap size={9} /> {toolLabel(t)}
            </span>
          ))}
        </div>
      )}

      {/* Status phase indicator */}
      {!isUser && isStreaming && message.statusPhase && (
        <StatusIndicator phase={message.statusPhase} />
      )}

      {/* UI blocks BEFORE prose */}
      {!isUser && message.uiBlocks?.filter(b => b.position === 'before').map((block, i) => {
        const Comp = UI_BLOCK_MAP[block.type];
        return Comp ? <Comp key={`before-${i}`} {...block.data} onSelect={onActionSelect} /> : null;
      })}

      {/* Bubble */}
      <div
        style={{
          maxWidth: '80%',
          padding: isUser ? '10px 16px' : '12px 16px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser
            ? 'linear-gradient(135deg, #7c3aed, #3b82f6)'
            : 'rgba(18, 18, 31, 0.85)',
          border: isUser ? 'none' : '1px solid rgba(139,92,246,0.15)',
          color: 'var(--text-primary)',
          boxShadow: isUser
            ? '0 4px 20px rgba(124,58,237,0.3)'
            : '0 2px 12px rgba(0,0,0,0.3)',
          backdropFilter: isUser ? 'none' : 'blur(12px)',
        }}
      >
        {isUser ? (
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{message.content}</p>
        ) : message.isError ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#f87171' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '0.88rem' }}>{message.content}</p>
          </div>
        ) : (
          <div className="jessica-prose">
            {isStreaming && !message.content ? (
              <ThinkingDots />
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
            {isStreaming && message.content && <span className="typing-cursor" />}
          </div>
        )}
      </div>

      {/* UI blocks AFTER prose */}
      {!isUser && message.uiBlocks?.filter(b => b.position === 'after').map((block, i) => {
        const Comp = UI_BLOCK_MAP[block.type];
        return Comp ? <Comp key={`after-${i}`} {...block.data} onSelect={onActionSelect} /> : null;
      })}

      {/* Timestamp */}
      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0 }}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

// ── Welcome screen ──────────────────────────────────────────────
function WelcomeScreen() {
  const suggestions = [
    'Research the latest AI breakthroughs in 2025',
    'Analyze the competitive landscape for EVs',
    'Summarize recent developments in quantum computing',
    'Find and compare top open-source LLMs',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px', gap: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'white', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
          J
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 600, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Jessica 3.0
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Deep Research Intelligence Agent · Multi-source · Real-time
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 480 }}>
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="glass glass-hover"
            style={{ padding: '12px 14px', cursor: 'default', borderRadius: 12 }}
          >
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ChatInterface ──────────────────────────────────────────
export default function ChatInterface({ threadId, onTodosUpdate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // Load history on mount / thread change
  useEffect(() => {
    if (!threadId) return;
    getHistory(threadId).then(({ messages: hist }) => {
      if (!hist?.length) return;
      setMessages(
        hist.map((m) => ({
          id: uid(),
          role: m.role === 'jessica' ? 'assistant' : m.role,
          content: m.content,
          timestamp: new Date().toISOString(),
          tools: [],
        }))
      );
    });
  }, [threadId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');

    const userMsg = { id: uid(), role: 'user', content: text, timestamp: new Date().toISOString(), tools: [], uiBlocks: [], statusPhase: null };
    const assistantId = uid();
    const assistantMsg = { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(), tools: [], uiBlocks: [], statusPhase: null };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setStreamingId(assistantId);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAsk(
        text,
        threadId || 'default',
        'default',
        (event) => {
          if (event.type === 'token') {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: m.content + event.data } : m)
            );
          } else if (event.type === 'tool') {
            const toolName = typeof event.data === 'object' ? event.data.name : event.data;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId && !m.tools.includes(toolName)
                  ? { ...m, tools: [...m.tools, toolName] }
                  : m
              )
            );
          } else if (event.type === 'status') {
            // Update the status phase indicator
            const phase = typeof event.data === 'object' ? event.data.phase : event.data;
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, statusPhase: phase } : m)
            );
          } else if (event.type === 'ui') {
            // Accumulate UI blocks on the assistant message
            const uiPayload = event.data;
            if (uiPayload && uiPayload.type) {
              const newBlock = {
                type: uiPayload.type,
                position: uiPayload.position || 'after',
                data: uiPayload.data || {},
              };
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, uiBlocks: [...(m.uiBlocks || []), newBlock] }
                    : m
                )
              );
            }
          } else if (event.type === 'response') {
            // Full response from backend (non-streaming mode)
            const content = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content, statusPhase: null } : m)
            );
          } else if (event.type === 'todo') {
            onTodosUpdate?.(event.data);
          } else if (event.type === 'error') {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantId ? { ...m, content: event.data, isError: true, statusPhase: null } : m)
            );
          }
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: err.message, isError: true } : m)
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingId(null);
      abortRef.current = null;
    }
  }, [input, isStreaming, threadId, onTodosUpdate]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px 12px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isStreaming && msg.id === streamingId}
              onActionSelect={(text) => {
                setInput(text);
                handleSubmit();
              }}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="glass"
        style={{
          margin: '0 16px 16px',
          padding: '12px 14px',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            className="jessica-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Jessica to research anything…"
            rows={1}
            disabled={isStreaming}
            style={{ flex: 1, minHeight: 44, maxHeight: 140 }}
          />

          {isStreaming ? (
            <button
              onClick={handleStop}
              className="send-btn"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
              title="Stop"
            >
              <X size={18} color="#f87171" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="send-btn"
              disabled={!input.trim()}
              title="Send (Enter)"
            >
              <Send size={16} />
            </button>
          )}
        </div>

        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            ↵ Send · Shift+↵ New line
          </span>
          {isStreaming && (
            <span style={{ fontSize: '0.7rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'onlinePulse 1s infinite' }} />
              Jessica is researching…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
