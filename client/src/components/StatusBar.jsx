import React from 'react';

const CONFIGS = {
  Registered: {
    color: '#34d399',
    glow:  'rgba(52, 211, 153, 0.5)',
    label: 'Connected',
    pulse: false,
  },
  Registering: {
    color: '#fbbf24',
    glow:  'rgba(251, 191, 36, 0.5)',
    label: 'Connecting…',
    pulse: true,
  },
  Initializing: {
    color: '#a78bfa',
    glow:  'rgba(167, 139, 250, 0.5)',
    label: 'Starting…',
    pulse: true,
  },
  Unregistered: {
    color: '#fb7185',
    glow:  'rgba(251, 113, 133, 0.5)',
    label: 'Disconnected',
    pulse: false,
  },
};

function getConfig(status) {
  if (CONFIGS[status]) return CONFIGS[status];
  if (status.startsWith('Failed:')) {
    return { color: '#fb7185', glow: 'rgba(251,113,133,0.5)', label: status, pulse: false };
  }
  return { color: '#a78bfa', glow: 'rgba(167,139,250,0.5)', label: status, pulse: true };
}

export default function StatusBar({ status }) {
  const cfg = getConfig(status);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        background: `rgba(${hexToRgb(cfg.color)}, 0.1)`,
        border:     `1px solid rgba(${hexToRgb(cfg.color)}, 0.3)`,
        color:      cfg.color,
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? 'animate-pulse' : ''}`}
        style={{
          background:  cfg.color,
          boxShadow:   `0 0 6px ${cfg.glow}`,
        }}
      />
      {cfg.label}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
