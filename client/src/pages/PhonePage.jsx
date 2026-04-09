import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import useSIP from '../hooks/useSIP.js';
import StatusBar from '../components/StatusBar.jsx';
import Dialpad from '../components/Dialpad.jsx';
import ActiveCall from '../components/ActiveCall.jsx';
import IncomingCall from '../components/IncomingCall.jsx';
import CallHistory from '../components/CallHistory.jsx';

export default function PhonePage() {
  const { user, sipConfig, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut,   setLoggingOut]   = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const configError = !sipConfig
    ? 'No SIP space assigned. Contact an administrator.'
    : '';

  const handleCallSaved = useCallback(() => {
    setRefreshToken((t) => t + 1);
  }, []);

  const { status, currentCall, incomingCall, isMuted, isOnHold,
          makeCall, answerCall, rejectCall, hangup, sendDTMF, toggleMute, toggleHold }
    = useSIP(sipConfig, handleCallSaved);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-app min-h-screen flex flex-col relative overflow-hidden">
      {/* Bokeh orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header
        className="relative z-10 px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(232,121,249,0.12)',
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                boxShadow: '0 0 12px rgba(168,85,247,0.5)',
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <span className="font-display text-lg font-semibold text-white hidden sm:block"
              style={{ letterSpacing: '-0.02em' }}>
              Velvet Voice
            </span>
          </div>

          {/* Status + ext */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <StatusBar status={status} />
            {sipConfig && (
              <span className="hidden md:block text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(232,121,249,0.1)',
                  border: '1px solid rgba(232,121,249,0.2)',
                  color: 'rgba(216,180,254,0.7)',
                }}>
                Ext. {sipConfig.extension}
              </span>
            )}
          </div>

          {/* User + nav + logout */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-white">{user?.login}</span>
              <span className="text-xs capitalize" style={{ color: 'rgba(216,180,254,0.45)' }}>
                {user?.role}
              </span>
            </div>

            {user?.role === 'admin' && (
              <div className="flex gap-1">
                {[['Users','/admin/users'],['Spaces','/admin/spaces']].map(([label, to]) => (
                  <Link key={to} to={to}
                    className="text-xs font-medium px-2.5 py-1 rounded-xl transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(232,121,249,0.15)',
                      color: 'rgba(216,180,254,0.6)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,121,249,0.12)'; e.currentTarget.style.color = '#f0abfc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(216,180,254,0.6)'; }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(232,121,249,0.15)',
                color: 'rgba(216,180,254,0.55)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,113,133,0.12)'; e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(216,180,254,0.55)'; e.currentTarget.style.borderColor = 'rgba(232,121,249,0.15)'; }}
              title="Sign out"
            >
              {loggingOut
                ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* Config error */}
        {configError && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-sm animate-fade-in"
            style={{
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.3)',
              color: '#fbbf24',
            }}>
            {configError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left */}
          <div className="space-y-5">
            {incomingCall && (
              <IncomingCall session={incomingCall} onAnswer={answerCall} onReject={rejectCall} />
            )}
            {currentCall && (
              <ActiveCall
                session={currentCall}
                isMuted={isMuted}
                isOnHold={isOnHold}
                onHangup={hangup}
                onToggleMute={toggleMute}
                onToggleHold={toggleHold}
                onSendDTMF={sendDTMF}
              />
            )}
            <Dialpad status={status} onCall={makeCall} currentCall={currentCall} />
          </div>

          {/* Right */}
          <div>
            <CallHistory refreshToken={refreshToken} />
          </div>
        </div>
      </main>
    </div>
  );
}
