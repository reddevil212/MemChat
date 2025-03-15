"use client"

import { useState, useEffect, useRef } from "react"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/lib_firebase"
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { User, Chat, Message } from "./types/types_chat"
import { chatService } from "./services/lib_services_chat"
import { CallProvider, useCall, CallContext } from "./contexts/contexts_CallContext"
import { CallInterface } from './call/components_call_CallInterface'
import { IncomingCallDialog } from './call/components_call_IncomingCallDialog'
import { FilePreview } from "./chat/components_chat_FilePreview"
import { ChatHeader } from "./chat/components_chat_ChatHeader"
import { MessageInput } from "./chat/components_chat_MessageInput"
import { MessageList } from "./chat/components_chat_MessageList"
import { ChatSidebar } from "./chat/components_chat_ChatSidebar"
import { WelcomeScreen } from "./chat/components_chat_WelcomeScreen"


function ChatContent() {
  const { toast } = useToast()
  const isMobile = useMobile()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State management
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const { callState, startCall, endCall } = useCall()


  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as User
          setCurrentUser({
            ...userData,
            displayName: userData.displayName || user.displayName || "Unknown User",
            photoURL: userData.photoURL || user.photoURL || null,
          })

          await updateDoc(doc(db, "users", user.uid), {
            lastSeen: serverTimestamp(),
            status: "online"
          })
        } else {
          handleSignOut()
        }
      } else {
        document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        window.location.reload()
      }
    })

    return () => unsubscribe()
  }, [])

  // Load users effect
  useEffect(() => {
    if (!currentUser) return

    const q = query(
      collection(db, "users"),
      where("uid", "!=", currentUser.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: User[] = []
      snapshot.forEach((doc) => {
        usersData.push(doc.data() as User)
      })
      setUsers(usersData)
    })

    return () => unsubscribe()
  }, [currentUser])

  // Load chats effect
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = chatService.listenToChats(currentUser.uid, setChats)
    return () => unsubscribe()
  }, [currentUser])

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }

    const unsubscribe = chatService.listenToMessages(
      selectedChat.id,
      setMessages,
      async (messageId) => {
        if (currentUser) {
          await updateDoc(doc(db, "chats", selectedChat.id, "messages", messageId), {
            read: true,
          })
        }
      }
    )

    return () => unsubscribe()
  }, [selectedChat, currentUser])

  // Get selected chat user effect
  useEffect(() => {
    if (!selectedChat || !currentUser || !users.length) {
      setSelectedChatUser(null)
      return
    }

    const otherUserId = selectedChat.participants.find(
      (id) => id !== currentUser.uid
    )
    if (otherUserId) {
      const chatUser = users.find((user) => user.uid === otherUserId) || null
      setSelectedChatUser(chatUser)
    }
  }, [selectedChat, currentUser, users])

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSignOut = async () => {
    try {
      if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          lastSeen: serverTimestamp(),
          status: "offline"
        })
      }
      await signOut(auth)
      document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const startNewChat = async (userId: string) => {
    if (!currentUser) return

    try {
      const chat = await chatService.createOrGetChat(currentUser.uid, userId)
      setSelectedChat(chat)
      if (isMobile) {
        setSidebarOpen(false)
      }
    } catch (error) {
      toast({
        title: "Error starting chat",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return

    try {
      await chatService.sendMessage(selectedChat.id, {
        senderId: currentUser.uid,
        text: newMessage,
        timestamp: new Date().toISOString(),
        read: false,
      })
      setNewMessage("")
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file || !selectedChat || !currentUser) return

    try {
      setIsUploading(true)
      const downloadURL = await chatService.uploadFile(file, selectedChat.id)

      await chatService.sendMessage(selectedChat.id, {
        senderId: currentUser.uid,
        text: `Sent ${file.type.split('/')[0]}`,
        fileUrl: downloadURL,
        fileType: file.type,
        fileName: file.name,
        timestamp: new Date().toISOString(),
        read: false,
      })

      toast({
        title: "File uploaded",
        description: "File has been sent successfully.",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: "Could not upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = () => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*, video/*, audio/*, .pdf, .doc, .docx, .txt"
    fileInput.click()

    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    }
  }

  const filteredUsers = users.filter((user) =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )



  return (
    <div className="flex h-screen bg-[#1e1d1d] lg:max-w-[1700px] sm:max-w-[320px]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}>


      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        users={filteredUsers}
        chats={chats}
        selectedChat={selectedChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSignOut={handleSignOut}
        onChatSelect={(chat) => {
          setSelectedChat(chat)
          setSidebarOpen(false)
        }}
        onStartChat={startNewChat}
      />

      {/* Chat Area */}
      <div className={`${sidebarOpen ? "hidden" : "flex"} md:flex flex-1 flex-col h-full`}>
        {selectedChat && selectedChatUser ? (
          <>
            <ChatHeader
              user={selectedChatUser}
              onOpenSidebar={() => setSidebarOpen(true)}
              showMenuButton={true}
              onCall={(callType: 'audio' | 'video') => startCall(selectedChatUser.uid, callType)} // Pass "video" or "audio" as needed
            />

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-3 lg:max-w-full max-w-[420px] space-y-3 bg-[#0d1121]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='0,50 50,0 100,50 50,100' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E")`,
                backgroundSize: "150px",
              }}
            >
              <MessageList
                messages={messages}
                currentUser={currentUser}
                formatTime={(timestamp) => new Date((timestamp as any).seconds * 1000).toLocaleTimeString()}
              />
              <div ref={messagesEndRef} />
            </div>

            <MessageInput
              message={newMessage}
              isUploading={isUploading}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onFileSelect={handleFileSelect}
            />
          </>
        ) : (
          <WelcomeScreen
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </div>

      {/* Call UI Components */}
      <CallContext.Consumer>
        {(callContext) => {
          if (!callContext) return null
          const { callState, endCall } = callContext

          if (callState.isIncomingCall && !callState.callAccepted) {
            const caller = users.find(user => user.uid === callState.callerId)
            return (
              <IncomingCallDialog
                callerName={caller?.displayName || 'Unknown Caller'}
              />
            )
          }

          if (callState.isOutgoingCall || callState.callAccepted) {
            const otherUser = users.find(
              user => user.uid === (callState.calleeId || callState.callerId)
            )
            return (
              <CallInterface
                recipientName={otherUser?.displayName || 'Unknown User'}
              />
            )
          }

          return null
        }}
      </CallContext.Consumer>
    </div>
  )
}

export default function ChatInterface() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as User
          setCurrentUser({
            ...userData,
            displayName: userData.displayName || user.displayName || "Unknown User",
            lastSeen: new Date().toISOString(),
            photoURL: userData.photoURL || user.photoURL || null,
          })
        }
      }
    })

    return () => unsubscribe()
  }, [])

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e1d1d] animate-fadeIn">
        <div className="text-center relative">
          {/* Blurred Background */}
          <div className="absolute inset-0 bg-[#1e1d1d] blur-lg opacity-50"></div>

          {/* Loading Message */}
          <h1 className="text-4xl font-semibold text-white mb-4 animate-pulse">
            Be patient, your conversations are loading...
          </h1>

          {/* Loading Spinner */}
          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto"></div>

          {/* Optional Subtext */}
          <p className="text-gray-400 mt-4">
            This might take a few moments. Thanks for your patience!
          </p>
        </div>
      </div>
    );
  }


  return (
    <CallProvider currentUser={currentUser}>
      <ChatContent />
    </CallProvider>
  )
}