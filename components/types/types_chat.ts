


export interface User {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  status: string
  lastSeen: string
}

export interface Chat {
  id: string
  participants: string[]
  lastMessage: {
    text: string
    timestamp: string
  } | null
  unreadCount: number
}

export interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
  read: boolean
  fileUrl?: string
  fileType?: string
  fileName?: string
  duration?: number;
}
// ... existing types ...

export interface CallData {
  callerId: string
  calleeId: string
  type: 'incoming' | 'outgoing'
  mediaType: 'audio' | 'video'
  status: 'ringing' | 'accepted' | 'rejected' | 'ended'
  timestamp: string
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
}

export interface ICECandidate {
  candidate: RTCIceCandidateInit
  userId: string
  timestamp: string
}


export interface ChatHeaderProps {
  user: User;
  onOpenSidebar: () => void;
  showMenuButton: boolean;
  onCall: () => Promise<void>;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}