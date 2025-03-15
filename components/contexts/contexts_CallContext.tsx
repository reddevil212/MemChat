import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';

interface User {
  uid: string;
  displayName: string;
  photoURL: string | null;
}

interface CallState {
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  callerId: string | null;
  calleeId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callType: 'audio' | 'video';
  callAccepted: boolean;
}

interface CallContextProps {
  callState: CallState;
  startCall: (calleeId: string, callType: 'audio' | 'video') => void;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
}

const initialCallState: CallState = {
  isIncomingCall: false,
  isOutgoingCall: false,
  callerId: null,
  calleeId: null,
  localStream: null,
  remoteStream: null,
  callType: 'audio',
  callAccepted: false,
};

const CallContext = createContext<CallContextProps | undefined>(undefined);

interface CallProviderProps {
  currentUser: User | null;
  children: ReactNode;
}

export const CallProvider: React.FC<CallProviderProps> = ({ currentUser, children }) => {
  const [callState, setCallState] = useState<CallState>(initialCallState);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [call, setCall] = useState<MediaConnection | null>(null);
  const [dataConnection, setDataConnection] = useState<DataConnection | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const activeTracksRef = useRef<MediaStreamTrack[]>([]);

  const trackMediaTrack = (track: MediaStreamTrack) => {
    activeTracksRef.current.push(track);
    track.addEventListener('ended', () => {
      const index = activeTracksRef.current.indexOf(track);
      if (index > -1) {
        activeTracksRef.current.splice(index, 1);
      }
    });
  };

  const trackStream = (stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      trackMediaTrack(track);
    });
  };

  const stopAllTracks = () => {
    activeTracksRef.current.forEach(track => track.stop());
    activeTracksRef.current = [];
  };

  const forceReleaseDevices = async () => {
    stopAllTracks();

    localStreamRef.current = null;
    remoteStreamRef.current = null;

    const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    tempStream.getTracks().forEach(track => track.stop());

    const largeArray: number[] = [];
    for (let i = 0; i < 10000000; i++) {
      largeArray.push(i);
    }
    largeArray.length = 0;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    setTimeout(() => document.body.removeChild(iframe), 100);
  };

  const startCall = async (calleeId: string, callType: 'audio' | 'video') => {
    if (!peer) return;

    await forceReleaseDevices();

    const stream = await navigator.mediaDevices.getUserMedia({ video: callType === 'video', audio: true });
    trackStream(stream);

    const outgoingCall = peer.call(calleeId, stream, { metadata: { callType } });
    const dataConn = peer.connect(calleeId);

    dataConn.on('open', () => {
      setDataConnection(dataConn);
    });

    dataConn.on('data', (data) => {
      if (data === 'endCall') {
        endCall();
      }
    });

    outgoingCall.on('stream', remoteStream => {
      trackStream(remoteStream);
      remoteStreamRef.current = remoteStream;
      setCallState(prevState => ({ ...prevState, remoteStream }));
    });

    outgoingCall.on('close', () => {
      forceReleaseDevices();
      setCallState(initialCallState);
    });

    setCallState(prevState => ({
      ...prevState,
      isOutgoingCall: true,
      calleeId,
      localStream: stream,
      callType,
      callAccepted: false,
    }));

    localStreamRef.current = stream;
    setCall(outgoingCall);
  };

  const answerCall = async () => {
    if (!call) return;

    await forceReleaseDevices();

    const stream = await navigator.mediaDevices.getUserMedia({ video: callState.callType === 'video', audio: true });
    trackStream(stream);

    call.answer(stream);

    const dataConn = peer.connect(call.peer);

    dataConn.on('open', () => {
      setDataConnection(dataConn);
    });

    dataConn.on('data', (data) => {
      if (data === 'endCall') {
        endCall();
      }
    });

    call.on('stream', remoteStream => {
      trackStream(remoteStream);
      remoteStreamRef.current = remoteStream;
      setCallState(prevState => ({ ...prevState, remoteStream }));
    });

    call.on('close', () => {
      forceReleaseDevices();
      setCallState(initialCallState);
    });

    setCallState(prevState => ({
      ...prevState,
      localStream: stream,
      callAccepted: true,
      isIncomingCall: false,
    }));

    localStreamRef.current = stream;
  };

  const rejectCall = () => {
    if (call) {
      call.close();
    }
    if (dataConnection) {
      dataConnection.send('endCall');
    }
    forceReleaseDevices();
    setCallState(initialCallState);
  };

  const endCall = () => {
    if (call) {
      call.close();
    }
    if (dataConnection) {
      dataConnection.send('endCall');
    }
    forceReleaseDevices();
    setCallState(initialCallState);
  };

  useEffect(() => {
    if (!currentUser) return;

    const peerInstance = new Peer(currentUser.uid);
    peerInstance.on('open', id => console.log('PeerJS connected with ID:', id));

    peerInstance.on('call', incomingCall => {
      setCallState(prevState => ({
        ...prevState,
        isIncomingCall: true,
        callerId: incomingCall.peer,
        callType: incomingCall.metadata?.callType || 'audio',
      }));

      incomingCall.on('close', () => {
        forceReleaseDevices();
        setCallState(initialCallState);
      });
      setCall(incomingCall);
    });

    peerInstance.on('connection', (conn) => {
      conn.on('data', (data) => {
        if (data === 'endCall') {
          endCall();
        }
      });
      setDataConnection(conn);
    });

    peerInstance.on('disconnected', () => {
      forceReleaseDevices();
      setCallState(initialCallState);
    });

    peerInstance.on('error', () => {
      forceReleaseDevices();
      setCallState(initialCallState);
    });

    setPeer(peerInstance);

    return () => {
      if (call) {
        call.close();
      }
      if (dataConnection) {
        dataConnection.close();
      }
      forceReleaseDevices();
      peerInstance.destroy();
    };
  }, [currentUser]);

  return (
    <CallContext.Provider value={{ callState, startCall, answerCall, rejectCall, endCall }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextProps => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export { CallContext };