import React, { useState, useEffect, useCallback } from 'react';

const DTMF_KEYS = ['1','2','3','4','5','6','7','8','9','*','0','#'];

function useCallTimer() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const ss = (elapsed % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function ControlBtn({ onClick, active, activeColor, icon, label, danger }) {
  const base = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '4px', padding: '12px 8px', borderRadius: '1rem',
    cursor: 'pointer', transition: 'all 0.15s ease', border: '1px solid',
    minWidth: 0,
  };
  const style = danger
    ? { ...base, background: 'linear-gradient(135deg, #fb7185, #e11d48)', borderColor: 'rgba(251,113,133,0.4)', boxShadow: '0 4px 16px rgba(251,113,133,0.35)', color: '#fff' }
    : active
    ? { ...base, background: `rgba(${activeColor}, 0.15)`, borderColor: `rgba(${activeColor}, 0.4)`, color: `rgb(${activeColor})` }
    : { ...base, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(232,121,249,0.15)', color: 'rgba(216,180,254,0.7)' };

  return (
    <button style={style} onClick={onClick}
      onMouseEnter={(e) => { if (!danger && !active) { e.currentTarget.style.background = 'rgba(232,121,249,0.1)'; e.currentTarget.style.borderColor = 'rgba(232,121,249,0.35)'; e.currentTarget.style.color = '#f0abfc'; } }}
      onMouseLeave={(e) => {
        if (!danger && !active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.borderColor = 'rgba(232,121,249,0.15)';
          e.currentTarget.style.color = 'rgba(216,180,254,0.7)';
        }
      }}
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
    </button>
  );
}

export default function ActiveCall({ session, isMuted, isOnHold, onHangup, onToggleMute, onToggleHold, onSendDTMF }) {
  const [showDTMF, setShowDTMF] = useState(false);
  const duration = useCallTimer();

  const remoteNumber =
    session?.remote_identity?.uri?.user ??
    session?.remote_identity?.display_name ??
    'Unknown';

  const handleDTMF = useCallback((k) => onSendDTMF(k), [onSendDTMF]);

  return (
    <div
      className="animate-slide-up rounded-3xl p-5 relative overflow-hidden"
      style={{
        background: 'rgba(52,211,153,0.07)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(52,211,153,0.25)',
        boxShadow: '0 8px 32px rgba(52,211,153,0.15)',
      }}
    >
      {/* Glow top */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(52,211,153,0.12), transparent)' }} />

      {/* Header */}
      <div className="relative flex items-center gap-4 mb-5">
        {/* Pulsing avatar */}
        <div className="relative flex-shrink-0">
          <span className="absolute -inset-1 rounded-full animate-ping opacity-25"
            style={{ background: 'rgba(52,211,153,0.6)' }} />
          <div className="relative w-12 h-12 rounded-full flex items-center justify-center text-lg font-display font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #34d399, #059669)', boxShadow: '0 0 20px rgba(52,211,153,0.4)' }}>
            {remoteNumber.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
            style={{ color: 'rgba(110,231,183,0.7)' }}>Active Call</p>
          <p className="text-base font-semibold text-white truncate">{remoteNumber}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-base font-semibold" style={{ color: '#34d399' }}>
            {duration}
          </span>
          {isOnHold && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
              Hold
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-4 gap-2 relative">
        <ControlBtn onClick={onToggleMute} active={isMuted} activeColor="251,113,133" label={isMuted ? 'Unmute' : 'Mute'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isMuted
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              }
            </svg>
          }
        />

        <ControlBtn onClick={onToggleHold} active={isOnHold} activeColor="251,191,36" label={isOnHold ? 'Resume' : 'Hold'}
          icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              {isOnHold ? <path d="M8 5v14l11-7z" /> : <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />}
            </svg>
          }
        />

        <ControlBtn onClick={() => setShowDTMF((v) => !v)} active={showDTMF} activeColor="129,140,248" label="DTMF"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          }
        />

        <ControlBtn onClick={onHangup} danger label="End"
          icon={
            <svg className="w-5 h-5 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          }
        />
      </div>

      {/* DTMF pad */}
      {showDTMF && (
        <div className="mt-4 pt-4 relative" style={{ borderTop: '1px solid rgba(232,121,249,0.15)' }}>
          <div className="grid grid-cols-4 gap-1.5">
            {DTMF_KEYS.map((k) => (
              <button key={k} onClick={() => handleDTMF(k)}
                className="h-10 rounded-xl font-semibold text-sm text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(232,121,249,0.15)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,121,249,0.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              >
                {k}
              </button>
            ))}
            <button onClick={() => setShowDTMF(false)}
              className="col-span-4 h-8 rounded-xl text-xs transition-all"
              style={{ color: 'rgba(216,180,254,0.5)', background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f0abfc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(216,180,254,0.5)'; }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
