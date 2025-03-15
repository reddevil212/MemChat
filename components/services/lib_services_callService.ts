import { db } from '@/lib/lib_firebase'
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'

export const callService = {
  // Create a new call session
  createCall: async (callerId: string, calleeId: string, type: 'audio' | 'video') => {
    const callDoc = doc(db, `calls/${calleeId}`)
    await setDoc(callDoc, {
      callerId,
      type: 'incoming',
      mediaType: type,
      timestamp: new Date().toISOString(),
    })
  },

  // Update call status
  updateCallStatus: async (userId: string, status: string) => {
    const callDoc = doc(db, `calls/${userId}`)
    await setDoc(callDoc, { status }, { merge: true })
  },

  // End call
  endCall: async (userId: string) => {
    const callDoc = doc(db, `calls/${userId}`)
    await deleteDoc(callDoc)
  },

  // Listen for call updates
  onCallUpdates: (userId: string, callback: (data: any) => void) => {
    const callDoc = doc(db, `calls/${userId}`)
    return onSnapshot(callDoc, (snapshot) => {
      callback(snapshot.data())
    })
  }
}