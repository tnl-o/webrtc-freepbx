import React from 'react';

function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CallTypeIcon({ type }) {
  if (type === 'incoming') {
    return (
      <svg
        className="w-4 h-4 text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-label="Incoming call"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15M19.5 4.5H8.25M19.5 4.5v11.25" />
      </svg>
    );
  }
  if (type === 'outgoing') {
    return (
      <svg
        className="w-4 h-4 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-label="Outgoing call"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15M4.5 19.5V8.25M4.5 19.5h11.25" />
      </svg>
    );
  }
  // missed
  return (
    <svg
      className="w-4 h-4 text-red-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-label="Missed call"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15M19.5 4.5H8.25M19.5 4.5v11.25" />
    </svg>
  );
}

const TYPE_LABEL = {
  incoming: 'Incoming',
  outgoing: 'Outgoing',
  missed: 'Missed',
};

export default function CallHistory({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-10 h-10 text-slate-600 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0l6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z"
          />
        </svg>
        <p className="text-slate-500 text-sm">No call history yet</p>
        <p className="text-slate-600 text-xs mt-1">Your recent calls will appear here</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Recent Calls
      </h2>

      <ul className="space-y-1" role="list" aria-label="Call history">
        {history.map((call, idx) => (
          <li
            key={idx}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-colors duration-100"
          >
            {/* Icon */}
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <CallTypeIcon type={call.type} />
            </div>

            {/* Number + type */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{call.number}</p>
              <p
                className={[
                  'text-xs',
                  call.type === 'missed'
                    ? 'text-red-400'
                    : call.type === 'outgoing'
                    ? 'text-blue-400'
                    : 'text-emerald-400',
                ].join(' ')}
              >
                {TYPE_LABEL[call.type] ?? call.type}
              </p>
            </div>

            {/* Duration + time */}
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <span className="text-xs font-mono text-slate-300">{call.duration}</span>
              <span className="text-xs text-slate-500">{relativeTime(call.timestamp)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
