import React from 'react';

const STATUS_CONFIG = {
  Registered: {
    dot: 'bg-emerald-400 shadow-emerald-400/50',
    text: 'text-emerald-400',
    label: 'Registered',
    pulse: false,
  },
  Registering: {
    dot: 'bg-yellow-400 shadow-yellow-400/50',
    text: 'text-yellow-400',
    label: 'Registering…',
    pulse: true,
  },
  Initializing: {
    dot: 'bg-slate-400',
    text: 'text-slate-400',
    label: 'Initializing…',
    pulse: true,
  },
  Unregistered: {
    dot: 'bg-red-400 shadow-red-400/50',
    text: 'text-red-400',
    label: 'Unregistered',
    pulse: false,
  },
};

function getConfig(status) {
  if (STATUS_CONFIG[status]) return { ...STATUS_CONFIG[status], label: STATUS_CONFIG[status].label };
  if (status.startsWith('Failed:')) {
    return {
      dot: 'bg-red-400 shadow-red-400/50',
      text: 'text-red-400',
      label: status,
      pulse: false,
    };
  }
  return {
    dot: 'bg-slate-400',
    text: 'text-slate-400',
    label: status,
    pulse: false,
  };
}

export default function StatusBar({ status }) {
  const config = getConfig(status);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-full border border-slate-600/50">
      <span
        className={[
          'w-2 h-2 rounded-full shadow-sm',
          config.dot,
          config.pulse ? 'animate-pulse' : '',
        ].join(' ')}
        aria-hidden="true"
      />
      <span className={['text-xs font-medium', config.text].join(' ')}>
        {config.label}
      </span>
    </div>
  );
}
