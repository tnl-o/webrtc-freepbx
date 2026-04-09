import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import api from '../api/index.js';
import useSIP from '../hooks/useSIP.js';
import StatusBar from '../components/StatusBar.jsx';
import Dialpad from '../components/Dialpad.jsx';
import ActiveCall from '../components/ActiveCall.jsx';
import IncomingCall from '../components/IncomingCall.jsx';
import CallHistory from '../components/CallHistory.jsx';

export default function PhonePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sipConfig, setSipConfig] = useState(null);
  const [configError, setConfigError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch SIP config on mount
  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (cancelled) return;
        if (data.space) {
          setSipConfig({
            extension: data.space.extension,
            sipPassword: data.space.sipPassword,
            pbxWssUrl: data.space.pbxWssUrl,
          });
        } else {
          setConfigError('No SIP space assigned to your account. Contact an administrator.');
        }
      })
      .catch(() => {
        if (!cancelled) setConfigError('Failed to load SIP configuration.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    status,
    currentCall,
    incomingCall,
    isMuted,
    isOnHold,
    callHistory,
    makeCall,
    answerCall,
    rejectCall,
    hangup,
    sendDTMF,
    toggleMute,
    toggleHold,
  } = useSIP(sipConfig);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow shadow-blue-600/40">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
            </div>
            <span className="font-bold text-white text-sm hidden sm:block">
              WebRTC FreePBX
            </span>
          </div>

          {/* Status + User info */}
          <div className="flex items-center gap-3 flex-1 justify-center sm:justify-end">
            <StatusBar status={status} />
            {sipConfig && (
              <span className="hidden md:block text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-md">
                Ext. {sipConfig.extension}
              </span>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-100">{user?.login}</span>
              <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
            </div>

            {user?.role === 'admin' && (
              <div className="flex gap-1">
                <Link
                  to="/admin/users"
                  className="btn-ghost text-xs px-2 py-1"
                  title="Manage Users"
                >
                  Users
                </Link>
                <Link
                  to="/admin/spaces"
                  className="btn-ghost text-xs px-2 py-1"
                  title="Manage Spaces"
                >
                  Spaces
                </Link>
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-ghost text-xs px-2 py-1"
              title="Sign out"
            >
              {loggingOut ? (
                <span className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-4">
        {/* Config error */}
        {configError && (
          <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-300 text-sm">
            {configError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {/* Incoming call panel */}
            {incomingCall && (
              <IncomingCall
                session={incomingCall}
                onAnswer={answerCall}
                onReject={rejectCall}
              />
            )}

            {/* Active call panel */}
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

            {/* Dialpad — always visible */}
            <Dialpad status={status} onCall={makeCall} currentCall={currentCall} />
          </div>

          {/* Right column */}
          <div>
            <CallHistory history={callHistory} />
          </div>
        </div>
      </main>
    </div>
  );
}
