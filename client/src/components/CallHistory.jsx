import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/index.js';

function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDur(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const DIR_STYLE = {
  incoming: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'Incoming', arrow: '↙' },
  outgoing: { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', label: 'Outgoing', arrow: '↗' },
  missed:   { color: '#fb7185', bg: 'rgba(251,113,133,0.12)', label: 'Missed',   arrow: '↙' },
};

export default function CallHistory({ refreshToken }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/calls');
      setHistory(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory, refreshToken]);

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(232,121,249,0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(232,121,249,0.1)' }}>
        <h2 className="text-xs font-bold uppercase tracking-widest"
          style={{ color: 'rgba(216,180,254,0.6)' }}>
          Recent Calls
        </h2>
        <button onClick={fetchHistory}
          className="w-7 h-7 flex items-center justify-center rounded-xl transition-all"
          style={{ color: 'rgba(216,180,254,0.4)', background: 'rgba(255,255,255,0.05)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f0abfc'; e.currentTarget.style.background = 'rgba(232,121,249,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(216,180,254,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          title="Refresh"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[28rem] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(232,121,249,0.4)', borderTopColor: '#e879f9' }} />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(232,121,249,0.08)', border: '1px solid rgba(232,121,249,0.15)' }}>
              <svg className="w-6 h-6" style={{ color: 'rgba(216,180,254,0.4)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(216,180,254,0.5)' }}>No calls yet</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(216,180,254,0.3)' }}>Your call history will appear here</p>
          </div>
        ) : (
          <ul>
            {history.map((call, idx) => {
              const ds = DIR_STYLE[call.direction] ?? DIR_STYLE.outgoing;
              return (
                <li key={call.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition-all cursor-default"
                  style={{
                    borderBottom: idx < history.length - 1 ? '1px solid rgba(232,121,249,0.07)' : 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,121,249,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 text-base font-bold"
                    style={{ background: ds.bg, color: ds.color }}>
                    {ds.arrow}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{call.number}</p>
                    <p className="text-xs" style={{ color: ds.color }}>{ds.label}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="font-mono text-xs font-medium" style={{ color: 'rgba(216,180,254,0.7)' }}>
                      {fmtDur(call.duration)}
                    </span>
                    <span className="text-[11px]" style={{ color: 'rgba(216,180,254,0.35)' }}>
                      {relativeTime(call.createdAt)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
