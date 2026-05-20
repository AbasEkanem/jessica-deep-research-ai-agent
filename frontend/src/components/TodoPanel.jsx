import { CheckCircle2, Clock, Loader2, ListTodo, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

// ── Status config ────────────────────────────────────────────────
const STATUS_CONFIG = {
  'pending': {
    icon: Clock,
    label: 'Pending',
    className: 'badge-pending',
    itemClass: 'pending',
    iconColor: '#6b7280',
  },
  'in-progress': {
    icon: Loader2,
    label: 'In Progress',
    className: 'badge-inprogress',
    itemClass: 'in-progress',
    iconColor: '#f59e0b',
    spin: true,
  },
  'completed': {
    icon: CheckCircle2,
    label: 'Done',
    className: 'badge-completed',
    itemClass: 'completed',
    iconColor: '#10b981',
  },
};

function TodoItem({ todo, index }) {
  const status = todo.task_status || 'pending';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
  const Icon = config.icon;

  return (
    <div
      className={`todo-item ${config.itemClass}`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Icon
          size={13}
          color={config.iconColor}
          style={{
            flexShrink: 0,
            marginTop: 2,
            animation: config.spin ? 'spin 1.5s linear infinite' : 'none',
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            lineHeight: 1.45,
            color: status === 'completed' ? 'var(--text-muted)' : 'var(--text-secondary)',
            textDecoration: status === 'completed' ? 'line-through' : 'none',
            flex: 1,
          }}
        >
          {todo.task_description}
        </p>
      </div>
      <div style={{ marginTop: 5, paddingLeft: 21 }}>
        <span
          className={`${config.className}`}
          style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            padding: '1px 7px',
            borderRadius: 999,
            display: 'inline-block',
          }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

export default function TodoPanel({ todos }) {
  const [collapsed, setCollapsed] = useState(false);

  const pending    = todos.filter(t => t.task_status === 'pending').length;
  const inProgress = todos.filter(t => t.task_status === 'in-progress').length;
  const completed  = todos.filter(t => t.task_status === 'completed').length;

  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        flex: '0 1 auto',
      }}
    >
      {/* Panel header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ListTodo size={14} color="#a78bfa" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Task List
          </span>
          {todos.length > 0 && (
            <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 999, background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', fontWeight: 600 }}>
              {todos.length}
            </span>
          )}
        </div>
        {collapsed
          ? <ChevronDown size={13} color="var(--text-muted)" />
          : <ChevronUp   size={13} color="var(--text-muted)" />
        }
      </button>

      {!collapsed && (
        <>
          {/* Summary pills */}
          {todos.length > 0 && (
            <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              {inProgress > 0 && (
                <span className="badge-inprogress" style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                  ⟳ {inProgress} active
                </span>
              )}
              {completed > 0 && (
                <span className="badge-completed" style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                  ✓ {completed} done
                </span>
              )}
              {pending > 0 && (
                <span className="badge-pending" style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                  ○ {pending} queued
                </span>
              )}
            </div>
          )}

          {/* Todo items */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {todos.length === 0 ? (
              <p style={{ margin: '12px 0', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
                Task list will appear here<br />when Jessica starts working
              </p>
            ) : (
              todos.map((todo, i) => (
                <TodoItem key={i} todo={todo} index={i} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
