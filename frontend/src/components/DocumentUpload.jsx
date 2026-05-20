import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Paperclip } from 'lucide-react';
import { uploadFile } from '../services/api';

export default function DocumentUpload() {
  const [uploads, setUploads] = useState([]);   // { id, name, status, error }
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const processFile = useCallback(async (file) => {
    const id = Math.random().toString(36).slice(2, 8);
    setUploads((prev) => [...prev, { id, name: file.name, status: 'uploading', error: null }]);

    try {
      await uploadFile(file);
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: 'done' } : u))
      );
    } catch (err) {
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: 'error', error: err.message } : u))
      );
    }
  }, []);

  const handleFiles = (files) => {
    Array.from(files).forEach(processFile);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const dismiss = (id) => setUploads((prev) => prev.filter((u) => u.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
      <div
        className={`drag-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          textAlign: 'center',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,.doc,.csv,.json"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Upload size={15} color="#a78bfa" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Upload a file
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            PDF, TXT, MD, DOCX
          </p>
        </div>
      </div>

      {/* File list */}
      {uploads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {uploads.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: u.status === 'error'
                  ? 'rgba(239,68,68,0.08)'
                  : u.status === 'done'
                  ? 'rgba(16,185,129,0.08)'
                  : 'rgba(139,92,246,0.08)',
                border: '1px solid',
                borderColor: u.status === 'error'
                  ? 'rgba(239,68,68,0.2)'
                  : u.status === 'done'
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(139,92,246,0.2)',
              }}
            >
              {u.status === 'uploading' && (
                <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid #a78bfa', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              )}
              {u.status === 'done' && <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0 }} />}
              {u.status === 'error' && <AlertCircle size={13} color="#f87171" style={{ flexShrink: 0 }} />}

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.name}
                </p>
                {u.status === 'error' && (
                  <p style={{ margin: '1px 0 0', fontSize: '0.65rem', color: '#f87171' }}>{u.error}</p>
                )}
              </div>

              <button
                onClick={() => dismiss(u.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
              >
                <X size={11} color="var(--text-muted)" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
