import React, { useState, useEffect, useCallback } from 'react';

const DTMF_KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function useCallTimer() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const ss = (elapsed % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function ActiveCall({
  session,
  isMuted,
  isOnHold,
  onHangup,
  onToggleMute,
  onToggleHold,
  onSendDTMF,
}) {
  const [showDTMF, setShowDTMF] = useState(false);
  const duration = useCallTimer();

  const remoteNumber =
    session?.remote_identity?.uri?.user ??
    session?.remote_identity?.display_name ??
    'Unknown';

  const handleDTMF = useCallback(
    (key) => {
      onSendDTMF(key);
    },
    [onSendDTMF]
  );

  return (
    <div className="card border-emerald-700/50 bg-slate-800 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-600/30 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Active Call</p>
          <p className="text-base font-semibold text-white truncate">{remoteNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-emerald-400 font-mono text-sm font-medium">{duration}</span>
          {isOnHold && (
            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
              On Hold
            </span>
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {/* Mute */}
        <button
          onClick={onToggleMute}
          className={[
            'flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800',
            isMuted
              ? 'bg-red-600/20 border border-red-600/40 text-red-400 focus:ring-red-500'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 focus:ring-slate-500',
          ].join(' ')}
          aria-pressed={isMuted}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
          )}
          <span className="text-[10px] font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Hold */}
        <button
          onClick={onToggleHold}
          className={[
            'flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800',
            isOnHold
              ? 'bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 focus:ring-yellow-500'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 focus:ring-slate-500',
          ].join(' ')}
          aria-pressed={isOnHold}
          title={isOnHold ? 'Resume' : 'Hold'}
        >
          {isOnHold ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
          <span className="text-[10px] font-medium">{isOnHold ? 'Resume' : 'Hold'}</span>
        </button>

        {/* DTMF toggle */}
        <button
          onClick={() => setShowDTMF((v) => !v)}
          className={[
            'flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800',
            showDTMF
              ? 'bg-blue-600/20 border border-blue-600/40 text-blue-400'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300',
          ].join(' ')}
          title="DTMF Pad"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
          </svg>
          <span className="text-[10px] font-medium">DTMF</span>
        </button>

        {/* Hangup */}
        <button
          onClick={onHangup}
          className="flex flex-col items-center gap-1 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          title="Hang up"
        >
          <svg className="w-5 h-5 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          <span className="text-[10px] font-medium">End</span>
        </button>
      </div>

      {/* DTMF pad (collapsible) */}
      {showDTMF && (
        <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-700 animate-fade-in">
          {DTMF_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleDTMF(key)}
              className="h-10 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-semibold rounded-lg transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {key}
            </button>
          ))}
          <button
            onClick={() => setShowDTMF(false)}
            className="col-span-4 h-8 bg-slate-700/50 hover:bg-slate-700 text-slate-400 text-xs rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
