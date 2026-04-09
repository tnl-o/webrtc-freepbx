import { SIPProvider, useSIPContext } from './context/SIPContext.jsx';
import QuickConnect from './components/QuickConnect.jsx';
import PhoneScreen from './pages/PhonePage.jsx';
import usePhone from './hooks/usePhone.js';

function AppContent() {
  const { config, isConnected, connect, disconnect } = useSIPContext();
  const sip = usePhone(isConnected ? config : null);

  // Show phone screen when connected
  if (isConnected && config) {
    return (
      <PhoneScreen
        status={sip.status}
        currentCall={sip.currentCall}
        incomingCall={sip.incomingCall}
        isMuted={sip.isMuted}
        isOnHold={sip.isOnHold}
        callDuration={sip.callDuration}
        callHistory={sip.callHistory}
        makeCall={sip.makeCall}
        answerCall={sip.answerCall}
        rejectCall={sip.rejectCall}
        hangup={sip.hangup}
        sendDTMF={sip.sendDTMF}
        toggleMute={sip.toggleMute}
        toggleHold={sip.toggleHold}
        onDisconnect={disconnect}
      />
    );
  }

  // Show connect screen when not connected
  return <QuickConnect onConnect={connect} />;
}

export default function App() {
  return (
    <SIPProvider>
      <AppContent />
    </SIPProvider>
  );
}
