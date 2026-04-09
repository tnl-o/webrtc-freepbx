import React from 'react';

export default function IncomingCall({ session, onAnswer, onReject }) {
  const callerNumber =
    session?.remote_identity?.uri?.user ??
    session?.remote_identity?.display_name ??
    'Unknown';

  const callerName = session?.remote_identity?.display_name;

  return (
    <div className="card border-blue-600/50 bg-slate-800 animate-ring-pulse animate-slide-up">
      {/* Animated ring indicator */}
      <div className="flex flex-col items-center py-2">
        <div className="relative mb-4">
          {/* Outer pulse rings */}
          <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
          <span className="absolute inset-1 rounded-full bg-blue-500/15 animate-ping [animation-delay:0.15s]" />
          {/* Icon */}
          <div className="relative w-16 h-16 bg-blue-600/20 border-2 border-blue-500/50 rounded-full flex items-center justify-center">
            <svg
              className="w-7 h-7 text-blue-400 animate-[ring-pulse_1s_ease-in-out_infinite]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
          </div>
        </div>

        <p className="text-xs font-medium text-blue-400 uppercase tracking-widest mb-1">
          Incoming Call
        </p>

        <p className="text-xl font-bold text-white">
          {callerName && callerName !== callerNumber ? callerName : callerNumber}
        </p>

        {callerName && callerName !== callerNumber && (
          <p className="text-sm text-slate-400 mt-0.5">{callerNumber}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label="Reject call"
        >
          <svg
            className="w-5 h-5 rotate-[135deg]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          Reject
        </button>

        <button
          onClick={onAnswer}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label="Answer call"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
          Answer
        </button>
      </div>
    </div>
  );
}
