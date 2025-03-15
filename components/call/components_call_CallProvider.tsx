"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { db } from '../firebase-config'
import {
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  getDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore'
import { User } from '../types/types_chat'

interface CallState {
  isIncomingCall: boolean
  isOutgoingCall: boolean
  remoteStream: MediaStream | null
  localStream: MediaStream | null
  callType: 'audio' | 'video' | null
  callerId: string | null
  calleeId: string | null
  connectionState: RTCPeerConnectionState | null
  error: string | null
}

interface CallContextType {
  callState: CallState
  startCall: (recipientId: string, type: 'audio' | 'video') => Promise<void>
  answerCall: () => Promise<void>
  rejectCall: () => Promise<void>
  endCall: () => Promise<void>
}

const INITIAL_CALL_STATE: CallState = {
  isIncomingCall: false,
  isOutgoingCall: false,
  remoteStream: null,
  localStream: null,
  callType: null,
  callerId: null,
  calleeId: null,
  connectionState: null,
  error: null
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
}

const TIMESTAMP = "2025-03-15 03:30:05" // Using the provided timestamp

const CallContext = createContext<CallContextType | null>(null)

export const useCall = () => {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}

interface CallProviderProps {
  children: React.ReactNode
  currentUser: User | null
}

export const CallProvider: React.FC<CallProviderProps> = ({ children, currentUser }) => {
  const [callState, setCallState] = useState<CallState>(INITIAL_CALL_STATE)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const pendingCandidates = useRef<RTCIceCandidate[]>([])

  const cleanup = async () => {
    try {
      // Stop all tracks
      callState.localStream?.getTracks().forEach(track => {
        track.stop()
        callState.localStream?.removeTrack(track)
      })
      callState.remoteStream?.getTracks().forEach(track => {
        track.stop()
        callState.remoteStream?.removeTrack(track)
      })

      // Close and cleanup peer connection
      if (peerConnection.current) {
        peerConnection.current.onicecandidate = null
        peerConnection.current.ontrack = null
        peerConnection.current.oniceconnectionstatechange = null
        peerConnection.current.onsignalingstatechange = null
        peerConnection.current.close()
        peerConnection.current = null
      }

      // Cleanup Firestore documents
      if (currentUser) {
        if (callState.calleeId) {
          await deleteDoc(doc(db, `calls/${callState.calleeId}`))
          await deleteDoc(doc(db, `calls/${callState.calleeId}/candidates/${currentUser.uid}`))
        }
        if (callState.callerId) {
          await deleteDoc(doc(db, `calls/${callState.callerId}`))
          await deleteDoc(doc(db, `calls/${callState.callerId}/candidates/${currentUser.uid}`))
        }
      }

      setCallState(INITIAL_CALL_STATE)
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  const handleICECandidate = async (event: RTCPeerConnectionIceEvent) => {
    if (!event.candidate || !currentUser) return

    try {
      const targetId = callState.isOutgoingCall ? callState.calleeId : callState.callerId
      if (!targetId) return

      await setDoc(
        doc(db, `calls/${targetId}/candidates/${currentUser.uid}`),
        {
          candidate: event.candidate.toJSON(),
          timestamp: serverTimestamp()
        },
        { merge: true }
      )
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  const setupPeerConnection = async () => {
    try {
      peerConnection.current = new RTCPeerConnection(ICE_SERVERS)

      // Setup connection monitoring
      peerConnection.current.oniceconnectionstatechange = () => {
        console.log('ICE Connection State:', peerConnection.current?.iceConnectionState)
        setCallState(prev => ({
          ...prev,
          connectionState: peerConnection.current?.iceConnectionState || null
        }))

        if (peerConnection.current?.iceConnectionState === 'failed') {
          cleanup()
        }
      }

      peerConnection.current.onicecandidate = handleICECandidate

      // Handle incoming tracks
      peerConnection.current.ontrack = (event) => {
        setCallState(prev => ({
          ...prev,
          remoteStream: new MediaStream([event.track])
        }))
      }

      // Get local stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callState.callType === 'video'
      })

      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream)
      })

      setCallState(prev => ({
        ...prev,
        localStream: stream
      }))

      return peerConnection.current
    } catch (error) {
      console.error('Error setting up peer connection:', error)
      throw error
    }
  }

  const startCall = async (recipientId: string, type: 'audio' | 'video') => {
    if (!currentUser) return
    await cleanup() // Ensure clean state

    try {
      const pc = await setupPeerConnection()

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Save the offer
      await setDoc(doc(db, `calls/${recipientId}`), {
        type: 'offer',
        offer,
        callerId: currentUser.uid,
        mediaType: type,
        timestamp: TIMESTAMP
      })

      setCallState(prev => ({
        ...prev,
        isOutgoingCall: true,
        callType: type,
        calleeId: recipientId
      }))

      // Listen for answer
      onSnapshot(doc(db, `calls/${recipientId}`), async (snapshot) => {
        const data = snapshot.data()
        if (!data) return

        if (data.type === 'answer' && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
        }
      })

    } catch (error) {
      console.error('Error starting call:', error)
      cleanup()
    }
  }

  const answerCall = async () => {
    if (!currentUser || !callState.callerId) return
    await cleanup() // Ensure clean state

    try {
      const pc = await setupPeerConnection()

      // Get the offer
      const callDoc = await getDoc(doc(db, `calls/${currentUser.uid}`))
      const callData = callDoc.data()

      if (!callData?.offer) {
        throw new Error('No offer found')
      }

      // Set remote description (offer)
      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer))

      // Create and set local description (answer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Save the answer
      await setDoc(doc(db, `calls/${callState.callerId}`), {
        type: 'answer',
        answer,
        timestamp: TIMESTAMP
      }, { merge: true })

      setCallState(prev => ({
        ...prev,
        isIncomingCall: false
      }))

    } catch (error) {
      console.error('Error answering call:', error)
      cleanup()
    }
  }

  const rejectCall = async () => {
    if (!currentUser || !callState.callerId) return

    try {
      await setDoc(doc(db, `calls/${callState.callerId}`), {
        type: 'rejected',
        timestamp: TIMESTAMP
      }, { merge: true })

      await cleanup()
    } catch (error) {
      console.error('Error rejecting call:', error)
    }
  }

  const endCall = async () => {
    try {
      if (currentUser && (callState.calleeId || callState.callerId)) {
        const targetId = callState.isOutgoingCall ? callState.calleeId : callState.callerId
        if (targetId) {
          await setDoc(doc(db, `calls/${targetId}`), {
            type: 'ended',
            timestamp: TIMESTAMP
          }, { merge: true })
        }
      }
      await cleanup()
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  // Listen for incoming calls and call state changes
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = onSnapshot(
      doc(db, `calls/${currentUser.uid}`),
      async (snapshot) => {
        const data = snapshot.data()
        if (!data) return

        switch (data.type) {
          case 'offer':
            if (!callState.isIncomingCall && !callState.isOutgoingCall) {
              setCallState(prev => ({
                ...prev,
                isIncomingCall: true,
                callType: data.mediaType,
                callerId: data.callerId
              }))
            }
            break
          case 'rejected':
          case 'ended':
            cleanup()
            break
        }
      }
    )

    return () => {
      unsubscribe()
      cleanup()
    }
  }, [currentUser])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return (
    <CallContext.Provider
      value={{
        callState,
        startCall,
        answerCall,
        rejectCall,
        endCall
      }}
    >
      {children}
    </CallContext.Provider>
  )
}