import { useState, useEffect, useCallback, useRef } from 'react';
import { healthCheck } from './services/api';
import ChatInterface from './components/ChatInterface';
import TodoPanel from './components/TodoPanel';
import DocumentUpload from './components/DocumentUpload';

// ── Generate or retrieve persistent thread ID ────────────────────
function getThreadId() {
  const key = 'jessica_thread_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'thread_' + Math.random().toString(36).slice(2, 12) + '_' + Date.now();
    localStorage.setItem(key, id);
  }
  return id;
}

// ── Header ───────────────────────────────────────────────────────
function Header({ health, threadId, onNewThread }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7,7,14,0.8)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="jessica-logo" style={{ width: 32, height: 32, fontSize: '1rem' }}>J</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              JESSICA
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>3.0</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            Deep Research Intelligence Agent
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Thread ID display */}
        <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
          {threadId?.slice(-8)}
        </span>

        {/* New thread button */}
        <button
          onClick={onNewThread}
          style={{
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '4px 12px',
            color: 'var(--text-secondary)',
            fontSize: '0.72rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(139,92,246,0.22)'; e.target.style.color = '#c4b5fd'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(139,92,246,0.12)'; e.target.style.color = 'var(--text-secondary)'; }}
        >
          + New thread
        </button>

        {/* Status dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: health === 'healthy'   ? '#10b981' :
                          health === 'loading'   ? '#f59e0b' : '#ef4444',
              boxShadow: health === 'healthy'
                ? '0 0 8px rgba(16,185,129,0.7)'
                : health === 'loading'
                ? '0 0 8px rgba(245,158,11,0.7)'
                : '0 0 8px rgba(239,68,68,0.7)',
              transition: 'all 0.4s',
            }}
          />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {health}
          </span>
        </div>
      </div>
    </header>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────
function Sidebar({ todos }) {
  return (
    <aside
      style={{
        width: 230,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 10px',
        borderRight: '1px solid var(--border-subtle)',
        background: 'rgba(7,7,14,0.5)',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <TodoPanel todos={todos} />

      {/* Upload section */}
      <div className="glass" style={{ padding: '12px 12px 14px', flexShrink: 0 }}>
        <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📎</span> Upload Files
        </p>
        <DocumentUpload />
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '8px 4px 0' }}>
        <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
          Built by Ekanem, Abasi-ikpongke<br />
          <span style={{ color: 'rgba(139,92,246,0.4)' }}>Jessica 3.0 · April 2026</span>
        </p>
      </div>
    </aside>
  );
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  const [health, setHealth] = useState('loading');
  const [todos, setTodos] = useState([]);
  const [threadId, setThreadId] = useState(getThreadId);

  // Check backend health
  useEffect(() => {
    healthCheck()
      .then(() => setHealth('healthy'))
      .catch(() => setHealth('offline'));

    const interval = setInterval(() => {
      healthCheck()
        .then(() => setHealth('healthy'))
        .catch(() => setHealth('offline'));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleTodosUpdate = useCallback((newTodos) => {
    setTodos(newTodos);
  }, []);

  const handleNewThread = useCallback(() => {
    const id = 'thread_' + Math.random().toString(36).slice(2, 12) + '_' + Date.now();
    localStorage.setItem('jessica_thread_id', id);
    setThreadId(id);
    setTodos([]);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Header health={health} threadId={threadId} onNewThread={handleNewThread} />

      {/* Offline banner */}
      {health === 'offline' && (
        <div style={{ background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '8px 24px' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#f87171' }}>
            ⚠ Cannot reach backend at <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>localhost:8000</code>. Ensure the FastAPI server is running.
          </p>
        </div>
      )}

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar todos={todos} />

        {/* Main chat area */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            position: 'relative',
          }}
        >
          <ChatInterface
            threadId={threadId}
            onTodosUpdate={handleTodosUpdate}
          />
        </main>
      </div>
    </div>
  );
}
