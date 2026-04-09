import React from 'react';

export default function IncomingCall({ session, onAnswer, onReject }) {
  const callerNumber =
    session?.remote_identity?.uri?.user ??
    session?.remote_identity?.display_name ??
    'Unknown';
  const callerName = session?.remote_identity?.display_name;
  const displayName = callerName && callerName !== callerNumber ? callerName : callerNumber;

  return (
    <div
      className="animate-slide-up rounded-3xl p-6 text-center relative overflow-hidden"
      style={{
        background: 'rgba(139, 92, 246, 0.1)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 8px 40px rgba(139,92,246,0.25), 0 0 0 0.5px rgba(255,255,255,0.05) inset',
      }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(168,85,247,0.2), transparent)',
        }}
      />

      {/* Avatar ring */}
      <div className="relative inline-flex mb-4">
        {/* Outer rings */}
        <span className="absolute -inset-4 rounded-full animate-ping opacity-20"
          style={{ background: 'rgba(168, 85, 247, 0.5)' }} />
        <span className="absolute -inset-2 rounded-full animate-ping opacity-30"
          style={{ background: 'rgba(168, 85, 247, 0.4)', animationDelay: '0.2s' }} />

        {/* Avatar circle */}
        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center text-2xl font-display font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            boxShadow: '0 0 30px rgba(168,85,247,0.5)',
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'rgba(196,181,253,0.7)' }}>
        Incoming Call
      </p>
      <p className="text-2xl font-display font-semibold text-white mb-0.5">{displayName}</p>
      {callerName && callerName !== callerNumber && (
        <p className="text-sm mb-0" style={{ color: 'rgba(196,181,253,0.6)' }}>{callerNumber}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-150"
          style={{
            background: 'linear-gradient(135deg, #fb7185, #e11d48)',
            boxShadow: '0 4px 16px rgba(251,113,133,0.4)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(251,113,133,0.55)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(251,113,133,0.4)'; }}
          aria-label="Reject call"
        >
          <svg className="w-4 h-4 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          Decline
        </button>

        <button
          onClick={onAnswer}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all duration-150"
          style={{
            background: 'linear-gradient(135deg, #34d399, #059669)',
            boxShadow: '0 4px 16px rgba(52,211,153,0.4)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(52,211,153,0.55)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(52,211,153,0.4)'; }}
          aria-label="Answer call"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          Answer
        </button>
      </div>
    </div>
  );
}
