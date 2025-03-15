import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs
} from "firebase/firestore"
import { db, storage } from "../firebase-config"
import { Chat, Message, User } from "../types/types_chat"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export const chatService = {
  listenToChats: (userId: string, callback: (chats: Chat[]) => void) => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageAt", "desc")
    )

    return onSnapshot(q, (snapshot) => {
      const chats: Chat[] = []
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat)
      })
      callback(chats)
    })
  },

  listenToMessages: (
    chatId: string,
    callback: (messages: Message[]) => void,
    onMessageRead?: (messageId: string) => void
  ) => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    )

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = []
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message)
      })
      callback(messages)
    })
  },

  sendMessage: async (chatId: string, messageData: Omit<Message, "id">) => {
    await addDoc(collection(db, "chats", chatId, "messages"), messageData)
    
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: {
        text: messageData.text,
        timestamp: messageData.timestamp,
      },
      lastMessageAt: serverTimestamp(),
    })
  },

  uploadFile: async (file: File, chatId: string) => {
    const storageRef = ref(storage, `chat_files/${chatId}/${Date.now()}_${file.name}`)
    const uploadTask = await uploadBytes(storageRef, file)
    return getDownloadURL(uploadTask.ref)
  },

  createOrGetChat: async (currentUserId: string, otherUserId: string) => {
    const existingChatQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUserId)
    )

    const existingChatsSnapshot = await getDocs(existingChatQuery)
    let existingChat: Chat | null = null

    existingChatsSnapshot.forEach((doc) => {
      const chatData = doc.data() as Chat
      if (chatData.participants.includes(otherUserId)) {
        existingChat = { id: doc.id, ...chatData }
      }
    })

    if (existingChat) {
      return existingChat
    }

    const newChatRef = await addDoc(collection(db, "chats"), {
      participants: [currentUserId, otherUserId],
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
      unreadCount: 0,
    })

    return {
      id: newChatRef.id,
      participants: [currentUserId, otherUserId],
      lastMessage: null,
      unreadCount: 0,
    } as Chat
  }
}