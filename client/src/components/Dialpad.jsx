import React, { useState, useCallback } from 'react';

const KEYS = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' },
];

export default function Dialpad({ status, onCall, currentCall }) {
  const [number, setNumber] = useState('');

  const isRegistered = status === 'Registered';
  const canCall = isRegistered && number.trim().length > 0 && !currentCall;

  const handleKey = useCallback((digit) => {
    setNumber((prev) => prev + digit);
  }, []);

  const handleBackspace = useCallback(() => {
    setNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(() => {
    if (!canCall) return;
    const trimmed = number.trim();
    setNumber('');
    onCall(trimmed);
  }, [canCall, number, onCall]);

  const handleKeyDown = useCallback(
    (e) => {
      if (/^[0-9*#]$/.test(e.key)) {
        handleKey(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleCall();
      }
    },
    [handleKey, handleBackspace, handleCall]
  );

  return (
    <div className="card animate-slide-up">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Dialpad
      </h2>

      {/* Number display */}
      <div className="relative mb-4">
        <input
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/[^0-9*#+]/g, ''))}
          onKeyDown={handleKeyDown}
          placeholder="Enter number…"
          className="input-field text-center text-xl font-mono tracking-widest pr-10"
          aria-label="Phone number"
        />
        {number && (
          <button
            onClick={handleBackspace}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Backspace"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
            </svg>
          </button>
        )}
      </div>

      {/* Key grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {KEYS.map(({ digit, sub }) => (
          <button
            key={digit}
            onClick={() => handleKey(digit)}
            className="flex flex-col items-center justify-center h-14 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-xl transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-blue-500 select-none"
            aria-label={digit}
          >
            <span className="text-lg font-semibold text-white leading-none">{digit}</span>
            {sub && (
              <span className="text-[9px] text-slate-400 tracking-widest mt-0.5">{sub}</span>
            )}
          </button>
        ))}
      </div>

      {/* Call button */}
      <button
        onClick={handleCall}
        disabled={!canCall}
        className="w-full flex items-center justify-center gap-2 h-14 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        aria-label="Make call"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        </svg>
        {!isRegistered ? 'Not Registered' : currentCall ? 'In Call' : 'Call'}
      </button>
    </div>
  );
}
