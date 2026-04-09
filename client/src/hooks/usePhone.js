import { useState, useEffect, useRef, useCallback } from 'react';
import JsSIP from 'jssip';

const MAX_HISTORY = 20;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 30000;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Standalone SIP hook — no AuthContext, no backend API.
 * Connects directly to the SIP/WebSocket endpoint of your PBX.
 *
 * @param {{ extension: string, sipPassword: string, pbxWssUrl: string } | null} config
 * @returns SIP state and actions
 */
export default function useSIP(config) {
  const [status, setStatus] = useState('idle');       // idle | connecting | registered | failed | unregistering
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const uaRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const callStartTimeRef = useRef(null);
  const durationTimerRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // ── Audio element setup ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document !== 'undefined' && !remoteAudioRef.current) {
      const audio = document.createElement('audio');
      audio.id = 'remote-audio';
      audio.autoplay = true;
      audio.style.display = 'none';
      document.body.appendChild(audio);
      remoteAudioRef.current = audio;
    }
    return () => {
      if (remoteAudioRef.current?.parentNode) {
        remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
        remoteAudioRef.current = null;
      }
    };
  }, []);

  // ── Duration timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentCall && callStartTimeRef.current) {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      clearInterval(durationTimerRef.current);
      setCallDuration(0);
    };
  }, [currentCall]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pushHistory = useCallback((entry) => {
    const entryWithId = { ...entry, id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2) };
    setCallHistory((prev) => [entryWithId, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const getBackoffDelay = () => {
    const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCountRef.current), BACKOFF_MAX_MS);
    retryCountRef.current += 1;
    return delay;
  };

  const endCall = useCallback((session, type, wasAnswered) => {
    clearInterval(durationTimerRef.current);
    const duration = callStartTimeRef.current
      ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      : 0;

    pushHistory({
      type: type === 'incoming' && !wasAnswered ? 'missed' : type,
      number: session.remote_identity?.uri?.user ?? 'Unknown',
      duration: formatDuration(duration),
      timestamp: new Date().toISOString(),
    });

    callStartTimeRef.current = null;
    setCurrentCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsOnHold(false);
  }, [pushHistory]);

  // ── UA setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!config?.extension || !config?.sipPassword || !config?.pbxWssUrl) {
      setStatus('idle');
      return;
    }

    JsSIP.debug.disable('JsSIP:*');

    let hostname;
    try {
      hostname = new URL(config.pbxWssUrl).hostname;
    } catch {
      setStatus('failed');
      return;
    }

    const socket = new JsSIP.WebSocketInterface(config.pbxWssUrl);

    const ua = new JsSIP.UA({
      sockets: [socket],
      uri: `sip:${config.extension}@${hostname}`,
      password: config.sipPassword,
      display_name: config.extension,
      register: true,
      register_expires: 300,
      session_timers: false,
      no_answer_timeout: 60,
    });

    uaRef.current = ua;
    setStatus('connecting');

    // ── UA Events ────────────────────────────────────────────────────────────
    ua.on('connected', () => setStatus('connecting'));
    ua.on('disconnected', () => {
      setStatus('failed');
      // Auto-reconnect
      const delay = getBackoffDelay();
      retryTimerRef.current = setTimeout(() => {
        if (uaRef.current && !uaRef.current.isStopped()) {
          uaRef.current.start();
        }
      }, delay);
    });

    ua.on('registered', () => {
      setStatus('registered');
      retryCountRef.current = 0;
      clearTimeout(retryTimerRef.current);
    });

    ua.on('unregistered', () => setStatus('idle'));
    ua.on('registrationFailed', () => setStatus('failed'));

    ua.on('newRTCSession', ({ session, originator }) => {
      const callType = originator === 'remote' ? 'incoming' : 'outgoing';
      let answered = false;

      if (callType === 'incoming') {
        setIncomingCall(session);
      } else {
        callStartTimeRef.current = Date.now();
        setCurrentCall(session);
      }

      session.on('accepted', () => {
        answered = true;
        callStartTimeRef.current = Date.now();
        if (callType === 'incoming') {
          setIncomingCall(null);
          setCurrentCall(session);
        }
      });

      session.on('confirmed', () => {
        answered = true;
        if (!callStartTimeRef.current) callStartTimeRef.current = Date.now();
      });

      session.on('ended', () => endCall(session, callType, answered));
      session.on('failed', () => endCall(session, callType, answered));
      session.on('hold', () => setIsOnHold(true));
      session.on('unhold', () => setIsOnHold(false));
      session.on('muted', () => setIsMuted(true));
      session.on('unmuted', () => setIsMuted(false));
    });

    ua.start();

    return () => {
      clearTimeout(retryTimerRef.current);
      try { ua.stop(); } catch { /* ignore */ }
      uaRef.current = null;
      setStatus('idle');
      setCurrentCall(null);
      setIncomingCall(null);
    };
  }, [config?.extension, config?.sipPassword, config?.pbxWssUrl, endCall]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const makeCall = useCallback((number) => {
    if (!uaRef.current || status !== 'registered') return;
    const ua = uaRef.current;
    const hostname = new URL(ua.configuration.sockets[0]._url).hostname;
    ua.call(`sip:${number}@${hostname}`, {
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
    });
  }, [status]);

  const answerCall = useCallback(() => {
    if (!incomingCall) return;
    incomingCall.answer({
      mediaConstraints: { audio: true, video: false },
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
    currentCall[isMuted ? 'unmute' : 'mute']({ audio: true });
    setIsMuted((v) => !v);
  }, [currentCall, isMuted]);

  const toggleHold = useCallback(() => {
    if (!currentCall) return;
    currentCall[isOnHold ? 'unhold' : 'hold']();
    setIsOnHold((v) => !v);
  }, [currentCall, isOnHold]);

  return {
    status,
    currentCall,
    incomingCall,
    isMuted,
    isOnHold,
    callHistory,
    callDuration,
    makeCall,
    answerCall,
    rejectCall,
    hangup,
    sendDTMF,
    toggleMute,
    toggleHold,
  };
}
