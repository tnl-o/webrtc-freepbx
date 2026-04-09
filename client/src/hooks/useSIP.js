import { useState, useEffect, useRef, useCallback } from 'react';
import JsSIP from 'jssip';

const MAX_HISTORY = 10;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * useSIP — manages a JsSIP UA instance for WebRTC SIP calls.
 *
 * @param {{ extension: string, sipPassword: string, pbxWssUrl: string } | null} config
 */
export default function useSIP(config) {
  const [status, setStatus] = useState('Initializing');
  const [currentCall, setCurrentCall] = useState(null); // active RTCSession
  const [incomingCall, setIncomingCall] = useState(null); // pending RTCSession
  const [callHistory, setCallHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);

  const uaRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const callStartTimeRef = useRef(null);
  const remoteAudioRef = useRef(
    typeof document !== 'undefined' ? document.createElement('audio') : null
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pushHistory = useCallback((entry) => {
    setCallHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const getBackoffDelay = () => {
    const delay = Math.min(
      BACKOFF_BASE_MS * Math.pow(2, retryCountRef.current),
      BACKOFF_MAX_MS
    );
    retryCountRef.current += 1;
    return delay;
  };

  const attachRemoteStream = useCallback((session) => {
    session.connection.addEventListener('track', (e) => {
      if (e.streams && e.streams[0] && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.autoplay = true;
        remoteAudioRef.current.play().catch(() => {});
      }
    });
  }, []);

  const onSessionEnded = useCallback(
    (session, type, wasAnswered) => {
      const duration = callStartTimeRef.current
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : 0;

      const historyType =
        type === 'incoming' && !wasAnswered ? 'missed' : type;

      pushHistory({
        type: historyType,
        number:
          type === 'incoming'
            ? session.remote_identity?.uri?.user ?? 'Unknown'
            : session.remote_identity?.uri?.user ?? 'Unknown',
        duration: formatDuration(duration),
        timestamp: new Date().toISOString(),
      });

      callStartTimeRef.current = null;
      setCurrentCall(null);
      setIncomingCall(null);
      setIsMuted(false);
      setIsOnHold(false);
    },
    [pushHistory]
  );

  // ── UA setup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!config?.extension || !config?.sipPassword || !config?.pbxWssUrl) {
      setStatus('Initializing');
      return;
    }

    // Silence JsSIP debug output in production
    JsSIP.debug.disable('JsSIP:*');

    const socket = new JsSIP.WebSocketInterface(config.pbxWssUrl);

    const ua = new JsSIP.UA({
      sockets: [socket],
      uri: `sip:${config.extension}@${new URL(config.pbxWssUrl).hostname}`,
      password: config.sipPassword,
      display_name: config.extension,
      register: true,
      register_expires: 300,
      session_timers: false,
      no_answer_timeout: 60,
      user_agent: 'WebRTC-FreePBX/1.0',
    });

    uaRef.current = ua;
    setStatus('Registering');

    // ── UA Events ────────────────────────────────────────────────────────────
    ua.on('registered', () => {
      setStatus('Registered');
      retryCountRef.current = 0;
      clearTimeout(retryTimerRef.current);
    });

    ua.on('unregistered', () => {
      setStatus('Unregistered');
    });

    ua.on('registrationFailed', (e) => {
      const cause = e.cause || 'Unknown';
      setStatus(`Failed: ${cause}`);
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
      let answered = false;

      if (callType === 'incoming') {
        setIncomingCall(session);
      } else {
        callStartTimeRef.current = Date.now();
        setCurrentCall(session);
        attachRemoteStream(session);
      }

      session.on('accepted', () => {
        answered = true;
        callStartTimeRef.current = Date.now();
        if (callType === 'incoming') {
          setIncomingCall(null);
          setCurrentCall(session);
          attachRemoteStream(session);
        }
      });

      session.on('confirmed', () => {
        answered = true;
        if (!callStartTimeRef.current) {
          callStartTimeRef.current = Date.now();
        }
      });

      session.on('ended', () => {
        onSessionEnded(session, callType, answered);
      });

      session.on('failed', () => {
        onSessionEnded(session, callType, answered);
      });

      session.on('hold', () => setIsOnHold(true));
      session.on('unhold', () => setIsOnHold(false));
      session.on('muted', () => setIsMuted(true));
      session.on('unmuted', () => setIsMuted(false));
    });

    ua.start();

    return () => {
      clearTimeout(retryTimerRef.current);
      try {
        ua.stop();
      } catch {
        // Ignore errors during cleanup
      }
      uaRef.current = null;
      setStatus('Initializing');
      setCurrentCall(null);
      setIncomingCall(null);
    };
  }, [config?.extension, config?.sipPassword, config?.pbxWssUrl, attachRemoteStream, onSessionEnded]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const makeCall = useCallback((number) => {
    if (!uaRef.current || status !== 'Registered') return;
    const ua = uaRef.current;
    const target = `sip:${number}@${new URL(
      ua.configuration.sockets[0]._url
    ).hostname}`;

    ua.call(target, {
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
      pcConfig: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      },
    });
  }, [status]);

  const answerCall = useCallback(() => {
    if (!incomingCall) return;
    incomingCall.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      },
    });
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    incomingCall.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
    setIncomingCall(null);
  }, [incomingCall]);

  const hangup = useCallback(() => {
    if (!currentCall) return;
    try {
      currentCall.terminate();
    } catch {
      setCurrentCall(null);
    }
  }, [currentCall]);

  const sendDTMF = useCallback(
    (tone) => {
      if (!currentCall) return;
      try {
        currentCall.sendDTMF(tone, { duration: 100, interToneGap: 70 });
      } catch {
        // Ignore DTMF errors
      }
    },
    [currentCall]
  );

  const toggleMute = useCallback(() => {
    if (!currentCall) return;
    if (isMuted) {
      currentCall.unmute({ audio: true });
    } else {
      currentCall.mute({ audio: true });
    }
    setIsMuted((v) => !v);
  }, [currentCall, isMuted]);

  const toggleHold = useCallback(() => {
    if (!currentCall) return;
    if (isOnHold) {
      currentCall.unhold();
    } else {
      currentCall.hold();
    }
    setIsOnHold((v) => !v);
  }, [currentCall, isOnHold]);

  return {
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
  };
}
