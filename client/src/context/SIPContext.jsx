import { createContext, useContext, useState, useCallback } from 'react';

/**
 * SIP Context — stores connection credentials in localStorage
 * No backend, no auth, no database. Pure LAN phone.
 */
const SIPContext = createContext(null);

export function useSIPContext() {
  const ctx = useContext(SIPContext);
  if (!ctx) throw new Error('useSIPContext must be used within SIPProvider');
  return ctx;
}

const STORAGE_KEY = 'webrtc-phone-config';

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

export function SIPProvider({ children }) {
  const initialConfig = loadConfig();
  const [config, setConfig] = useState(initialConfig);
  const [isConnected, setIsConnected] = useState(() => !!initialConfig);

  const connect = useCallback((extension, sipPassword, pbxWssUrl) => {
    const cfg = { extension, sipPassword, pbxWssUrl };
    saveConfig(cfg);
    setConfig(cfg);
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    clearConfig();
    setConfig(null);
    setIsConnected(false);
  }, []);

  return (
    <SIPContext.Provider value={{ config, isConnected, connect, disconnect }}>
      {children}
    </SIPContext.Provider>
  );
}
