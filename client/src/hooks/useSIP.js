import { useState, useEffect, useRef, useCallback } from 'react';
import JsSIP from 'jssip';
import api from '../api/index.js';

const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS  = 30000;

/**
 * useSIP — manages a JsSIP UA instance for WebRTC SIP calls.
 *
 * @param {{ extension: string, sipPassword: string, pbxWssUrl: string } | null} config
 * @param {Function} [onCallSaved] — called after a call record is persisted to the API
 */
export default function useSIP(config, onCallSaved) {
  const [status,       setStatus]      = useState('Initializing');
  const [currentCall,  setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall]= useState(null);
  const [isMuted,      setIsMuted]     = useState(false);
  const [isOnHold,     setIsOnHold]    = useState(false);

  const uaRef          = useRef(null);
  const retryTimerRef  = useRef(null);
  const retryCountRef  = useRef(0);
  const callStartRef   = useRef(null); // epoch ms when call was answered
  const remoteAudioRef = useRef(
    typeof document !== 'undefined' ? document.createElement('audio') : null
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getBackoffDelay = () => {
    const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCountRef.current), BACKOFF_MAX_MS);
    retryCountRef.current += 1;
    return delay;
  };

  const attachRemoteStream = useCallback((session) => {
    session.connection.addEventListener('track', (e) => {
      if (e.streams?.[0] && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.autoplay  = true;
        remoteAudioRef.current.play().catch(() => {});
      }
    });
  }, []);

  /** Persist a call record to the backend (non-blocking, failure is silent). */
  const saveCall = useCallback(async (direction, number, durationSec) => {
    try {
      await api.post('/calls', { direction, number, duration: durationSec });
      if (typeof onCallSaved === 'function') onCallSaved();
    } catch {
      // Non-critical — don't surface to user
    }
  }, [onCallSaved]);

  const onSessionEnded = useCallback(
    (session, callType, wasAnswered) => {
      const durationSec = callStartRef.current
        ? Math.floor((Date.now() - callStartRef.current) / 1000)
        : 0;

      const direction = callType === 'incoming' && !wasAnswered ? 'missed' : callType;
      const number    = session.remote_identity?.uri?.user ?? 'Unknown';

      saveCall(direction, number, durationSec);

      callStartRef.current = null;
      setCurrentCall(null);
      setIncomingCall(null);
      setIsMuted(false);
      setIsOnHold(false);
    },
    [saveCall]
  );

  // ── UA lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!config?.extension || !config?.sipPassword || !config?.pbxWssUrl) {
      setStatus('Initializing');
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      JsSIP.debug.disable('JsSIP:*');
    }

    const socket = new JsSIP.WebSocketInterface(config.pbxWssUrl);
    const domain = new URL(config.pbxWssUrl).hostname;

    const ua = new JsSIP.UA({
      sockets:           [socket],
      uri:               `sip:${config.extension}@${domain}`,
      password:          config.sipPassword,
      display_name:      config.extension,
      register:          true,
      register_expires:  300,
      session_timers:    false,
      no_answer_timeout: 60,
      user_agent:        'WebRTC-FreePBX/1.0',
    });

    uaRef.current = ua;
    setStatus('Registering');

    ua.on('registered', () => {
      setStatus('Registered');
      retryCountRef.current = 0;
      clearTimeout(retryTimerRef.current);
    });

    ua.on('unregistered', () => setStatus('Unregistered'));

    ua.on('registrationFailed', (e) => {
      setStatus(`Failed: ${e.cause || 'Unknown'}`);
    });

    ua.on('disconnected', () => {
      setStatus('Unregistered');
      const delay = getBackoffDelay();
      retryTimerRef.current = setTimeout(() => {
        if (uaRef.current) {
          setStatus('Registering');
          uaRef.current.start();
        }
      }, delay);
    });

    ua.on('newRTCSession', ({ session, originator }) => {
      const callType = originator === 'remote' ? 'incoming' : 'outgoing';
      let answered   = false;

      if (callType === 'incoming') {
        setIncomingCall(session);
      } else {
        callStartRef.current = Date.now();
        setCurrentCall(session);
        attachRemoteStream(session);
      }

      session.on('accepted', () => {
        answered = true;
        callStartRef.current = Date.now();
        if (callType === 'incoming') {
          setIncomingCall(null);
          setCurrentCall(session);
          attachRemoteStream(session);
        }
      });

      session.on('confirmed', () => {
        answered = true;
        if (!callStartRef.current) callStartRef.current = Date.now();
      });

      session.on('ended',  () => onSessionEnded(session, callType, answered));
      session.on('failed', () => onSessionEnded(session, callType, answered));

      session.on('hold',    () => setIsOnHold(true));
      session.on('unhold',  () => setIsOnHold(false));
      session.on('muted',   () => setIsMuted(true));
      session.on('unmuted', () => setIsMuted(false));
    });

    ua.start();

    return () => {
      clearTimeout(retryTimerRef.current);
      try { ua.stop(); } catch { /* ignore */ }
      uaRef.current = null;
      setStatus('Initializing');
      setCurrentCall(null);
      setIncomingCall(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.extension, config?.sipPassword, config?.pbxWssUrl]);

  // ── Call actions ──────────────────────────────────────────────────────────────
  const makeCall = useCallback((number) => {
    if (!uaRef.current || status !== 'Registered') return;
    const domain = new URL(uaRef.current.configuration.sockets[0]._url).hostname;
    uaRef.current.call(`sip:${number}@${domain}`, {
      mediaConstraints:    { audio: true, video: false },
      rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
      // No STUN/TURN needed for LAN-only deployments.
      // To traverse NAT add: iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      pcConfig: { iceServers: [] },
    });
  }, [status]);

  const answerCall = useCallback(() => {
    if (!incomingCall) return;
    incomingCall.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig:         { iceServers: [] },
    });
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    incomingCall.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
    setIncomingCall(null);
  }, [incomingCall]);

  const hangup = useCallback(() => {
    if (!currentCall) return;
    try { currentCall.terminate(); } catch { setCurrentCall(null); }
  }, [currentCall]);

  const sendDTMF = useCallback((tone) => {
    if (!currentCall) return;
    try { currentCall.sendDTMF(tone, { duration: 100, interToneGap: 70 }); } catch { /* ignore */ }
  }, [currentCall]);

  const toggleMute = useCallback(() => {
    if (!currentCall) return;
    isMuted ? currentCall.unmute({ audio: true }) : currentCall.mute({ audio: true });
    setIsMuted((v) => !v);
  }, [currentCall, isMuted]);

  const toggleHold = useCallback(() => {
    if (!currentCall) return;
    isOnHold ? currentCall.unhold() : currentCall.hold();
    setIsOnHold((v) => !v);
  }, [currentCall, isOnHold]);

  return {
    status,
    currentCall,
    incomingCall,
    isMuted,
    isOnHold,
    makeCall,
    answerCall,
    rejectCall,
    hangup,
    sendDTMF,
    toggleMute,
    toggleHold,
  };
}
