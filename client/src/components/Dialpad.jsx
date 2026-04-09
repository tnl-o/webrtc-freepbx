import React, { useState, useCallback } from 'react';

const KEYS = [
  { digit: '1', sub: '' },       { digit: '2', sub: 'ABC' },  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },    { digit: '5', sub: 'JKL' },  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },   { digit: '8', sub: 'TUV' },  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },        { digit: '0', sub: '+' },    { digit: '#', sub: '' },
];

export default function Dialpad({ status, onCall, currentCall }) {
  const [number, setNumber] = useState('');

  const isRegistered = status === 'Registered';
  const canCall      = isRegistered && number.trim().length > 0 && !currentCall;

  const handleKey  = useCallback((d) => setNumber((p) => p + d), []);
  const handleBack = useCallback(() => setNumber((p) => p.slice(0, -1)), []);

  const handleCall = useCallback(() => {
    if (!canCall) return;
    let n = number.trim();
    if (n.startsWith('+')) n = '00' + n.slice(1);
    setNumber('');
    onCall(n);
  }, [canCall, number, onCall]);

  const handleKeyDown = useCallback((e) => {
    if (/^[0-9*#]$/.test(e.key)) handleKey(e.key);
    else if (e.key === 'Backspace') handleBack();
    else if (e.key === 'Enter')     handleCall();
  }, [handleKey, handleBack, handleCall]);

  return (
    <div className="glass p-5 animate-slide-up">
      {/* Display */}
      <div className="relative mb-5">
        <div
          className="w-full px-4 py-3.5 rounded-2xl text-center text-2xl font-mono tracking-widest text-white min-h-[3.25rem] flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(232,121,249,0.2)',
          }}
        >
          {/* Shimmer line */}
          <div className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(232,121,249,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
            }}
          />
          <span className="relative z-10">
            {number || <span style={{ color: 'rgba(216,180,254,0.25)', fontSize: '0.875rem', letterSpacing: '0.15em' }}>enter number</span>}
          </span>
        </div>
        {number && (
          <button
            onClick={handleBack}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{ color: 'rgba(216,180,254,0.5)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f0abfc'; e.currentTarget.style.background = 'rgba(232,121,249,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(216,180,254,0.5)'; e.currentTarget.style.background = ''; }}
            aria-label="Backspace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
            </svg>
          </button>
        )}
        {/* Hidden input for keyboard support */}
        <input
          type="tel"
          className="absolute inset-0 opacity-0 w-full cursor-pointer"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/[^0-9*#+]/g, ''))}
          onKeyDown={handleKeyDown}
          aria-label="Phone number"
        />
      </div>

      {/* Key grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {KEYS.map(({ digit, sub }) => (
          <button
            key={digit}
            onClick={() => handleKey(digit)}
            className="dialpad-key"
          >
            <span className="text-lg font-semibold leading-none text-white">{digit}</span>
            {sub && <span className="text-[8px] tracking-widest mt-0.5" style={{ color: 'rgba(216,180,254,0.45)' }}>{sub}</span>}
          </button>
        ))}
      </div>

      {/* Call button */}
      <button
        onClick={handleCall}
        disabled={!canCall}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={canCall ? {
          background: 'linear-gradient(135deg, #34d399, #059669)',
          boxShadow: '0 4px 20px rgba(52,211,153,0.4)',
        } : {
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
        {!isRegistered ? 'Not Connected' : currentCall ? 'In Call' : 'Call'}
      </button>
    </div>
  );
}
