"use client"

import { useState, useEffect, useRef } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from "firebase/firestore"
import { auth, db } from "@/lib/lib_firebase"
import { User, Chat, Message } from "./types/types_chat"
import { CallContext } from "./contexts/contexts_CallContext"
import { chatService } from "./services/lib_services_chat"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { CallProvider, useCall } from "./contexts/contexts_CallContext"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { ChatSidebar } from "./chat/components_chat_ChatSidebar"
import { ChatHeader } from "./chat/components_chat_ChatHeader"
import { MessageInput } from "./chat/components_chat_MessageInput"
import { MessageList } from "./chat/components_chat_MessageList"
import { WelcomeScreen } from "./chat/components_chat_WelcomeScreen"
import { toast } from "sonner"

function ChatContent() {
  
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
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

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
      toast("Error signing out",{
       
        description: "Please try again",
        
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
      toast("Error starting chat",{
       
        description: "Please try again",
       
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
      toast("Error sending message",{
       
        description: "Please try again",
        
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

      toast( "File uploaded",{
      
        description: "File has been sent successfully.",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast("Upload failed",{
       
        description: "Could not upload file. Please try again.",
       
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

  const handleVoiceMessageSend = async (audioBlob: Blob, duration?: number) => {
    if (!selectedChat || !currentUser) return

    try {
      setIsUploading(true)
      const downloadURL = await chatService.uploadFile(audioBlob, selectedChat.id)

      await chatService.sendMessage(selectedChat.id, {
        senderId: currentUser.uid,
        text: "Sent a voice message",
        fileUrl: downloadURL,
        fileType: "audio/wav",
        duration: duration,
        fileName: "voice_message.wav",
        timestamp: new Date().toISOString(),
        read: false,
      })

      toast("Voice message sent",{
        
        description: "Voice message has been sent successfully.",
      })
    } catch (error) {
      console.error("Error sending voice message:", error)
      toast("Send failed",{
       
        description: "Could not send voice message. Please try again.",
        
      })
    } finally {
      setIsUploading(false)
    }
  }

  const filteredUsers = users.filter((user) =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="flex h-screen bg-background lg:max-w-[1700px] sm:max-w-[320px] border-0"
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
      <CardContent className={`${sidebarOpen ? "hidden" : "flex"} md:flex flex-1 flex-col h-full p-0`}>
        {selectedChat && selectedChatUser ? (
          <>
            <ChatHeader
              user={selectedChatUser}
              onOpenSidebar={() => setSidebarOpen(true)}
              showMenuButton={true}
              onCall={(callType: 'audio' | 'video') => startCall(selectedChatUser.uid, callType)}
            />

            {/* Messages Area */}
            <div className="flex-1 scrolbar-thin overflow-y-auto p-4">
              <MessageList
                messages={messages}
                currentUser={currentUser}
                formatTime={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              />
              <div ref={messagesEndRef} />
            </div>

            <MessageInput
              message={newMessage}
              isUploading={isUploading}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              onFileSelect={handleFileSelect}
              onVoiceMessageSend={handleVoiceMessageSend}
            />
          </>
        ) : (
          <WelcomeScreen
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
      </CardContent>

      {/* Call UI Components */}
      <CallContext.Consumer>
        {(callContext) => {
          if (!callContext) return null
          const { callState, endCall } = callContext

          if (callState.isIncomingCall && !callState.callAccepted) {
            // Incoming call UI
          }

          if (callState.isOutgoingCall || callState.callAccepted) {
            // Ongoing call UI
          }

          return null
        }}
      </CallContext.Consumer>
    </Card>
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
      <Card className="flex items-center justify-center min-h-screen bg-muted/30 animate-fadeIn border-0">
        <CardContent className="text-center relative w-full">
          <div className="absolute inset-0 bg-background blur-lg opacity-50"></div>
          <CardTitle className="text-4xl font-semibold text-foreground mb-4 animate-pulse">
            Be patient, your conversations are loading...
          </CardTitle>
          <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
          <CardDescription className="mt-4">
            This might take a few moments. Thanks for your patience!
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <CallProvider currentUser={currentUser}>
      <ChatContent />
    </CallProvider>
  )
}