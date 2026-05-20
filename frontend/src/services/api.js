/**
 * Jessica 3.0 — API Service
 * Correct endpoints wired to fastAPI.py
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Health ──────────────────────────────────────────────────────
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}

// ── Thread history ──────────────────────────────────────────────
export async function getHistory(threadId) {
  const res = await fetch(`${API_BASE}/api/threads/${encodeURIComponent(threadId)}/history`);
  if (!res.ok) return { messages: [] };
  return res.json();
}

// ── Upload file ─────────────────────────────────────────────────
export async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

// ── SSE streaming ask ───────────────────────────────────────────
/**
 * Stream a message to Jessica.
 * Calls onEvent with each parsed SSE event object:
 *   { type: 'token' | 'tool' | 'todo' | 'error', data: any }
 * Resolves when stream is complete.
 */
export async function streamAsk(message, threadId, userId, onEvent, signal) {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, thread_id: threadId, user_id: userId }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete last line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const raw = trimmed.slice(5).trim();
      if (raw === '[DONE]') return;

      try {
        const event = JSON.parse(raw);
        onEvent(event);
      } catch {
        // ignore malformed frames
      }
    }
  }
}

// Legacy named export for health check (used in App.jsx)
export const ragAPI = { healthCheck };
