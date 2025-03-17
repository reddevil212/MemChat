"use client"

import { useState, useEffect, useRef } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, limit } from "firebase/firestore"
import { auth, db } from "@/lib/lib_firebase"
import { User, Chat, Message, Reaction } from "./types/types_chat"
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
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { IncomingCallDialog } from './call/components_call_IncomingCallDialog'
import { CallInterface } from './call/components_call_CallInterface'
import { AnimatePresence } from "framer-motion"

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

  // State for WhatsApp-like features
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  // Track panel sizes
  const [sidebarSize, setSidebarSize] = useState(isMobile ? 0 : 25)
  const [chatSize, setChatSize] = useState(isMobile ? 100 : 75)

  const callContext = useCall()
  const { callState, startCall, endCall } = callContext

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

  // Handle sidebar visibility in mobile view
  useEffect(() => {
    if (isMobile) {
      if (sidebarOpen) {
        setSidebarSize(100)
        setChatSize(0)
      } else {
        setSidebarSize(0)
        setChatSize(100)
      }
    } else {
      if (!sidebarOpen) {
        setSidebarSize(0)
        setChatSize(100)
      } else {
        setSidebarSize(25)
        setChatSize(75)
      }
    }
  }, [sidebarOpen, isMobile])

  // Clear editing/replying state when chat changes
  useEffect(() => {
    setEditingMessage(null)
    setReplyingTo(null)
    setNewMessage("")
  }, [selectedChat])

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
      toast("Error signing out", {
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
      toast("Error starting chat", {
        description: "Please try again",
      })
    }
  }

  // WhatsApp-like features handler methods
  const handleStartEditMessage = (messageId: string, text: string) => {
    const message = messages.find(m => m.id === messageId)
    if (message) {
      setEditingMessage(message)
      setNewMessage(text)
      setReplyingTo(null) // Clear any reply when editing
    }
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setNewMessage("")
  }

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message)
    setEditingMessage(null) // Clear any editing when replying
    // Focus on the input after a short delay to allow UI to update
    setTimeout(() => {
      const inputElement = document.querySelector('textarea')
      if (inputElement) {
        inputElement.focus()
      }
    }, 100)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      if (editingMessage && editingMessage.id) {
        // Handle edited message
        await handleEditMessage(editingMessage.id, newMessage);
        setEditingMessage(null);
      } else if (replyingTo && replyingTo.id) {
        // Handle reply message
        await chatService.sendReplyMessage(
          selectedChat.id,
          {
            senderId: currentUser.uid,
            text: newMessage,
            timestamp: new Date().toISOString(),
            read: false,
            replyToId: replyingTo.id,
            replyToText: replyingTo.text || "Media message",
            replyToFileUrl: replyingTo.fileUrl || undefined, // Change null to undefined
          },
          replyingTo
        );
        setReplyingTo(null);
      } else {
        // Send regular message
        await chatService.sendMessage(selectedChat.id, {
          senderId: currentUser.uid,
          text: newMessage,
          timestamp: new Date().toISOString(),
          read: false,
        });
      }
      setNewMessage("");
    } catch (error) {
      toast("Error sending message", {
        description: "Please try again",
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !selectedChat || !currentUser) return

    try {
      setIsUploading(true)
      const downloadURL = await chatService.uploadFile(file, selectedChat.id)

      const messageData: Partial<Message> = {
        senderId: currentUser.uid,
        text: `Sent ${file.type.split('/')[0]}`,
        fileUrl: downloadURL,
        fileType: file.type,
        fileName: file.name,
        timestamp: new Date().toISOString(),
        read: false,
      }

      // If replying, include reply data
      if (replyingTo && replyingTo.id) {
        messageData.replyToId = replyingTo.id
        messageData.replyToText = replyingTo.text || "Media message"

        await chatService.sendReplyMessage(
          selectedChat.id,
          messageData as Message,
          replyingTo
        )
        setReplyingTo(null)
      } else {
        await chatService.sendMessage(selectedChat.id, messageData as Message)
      }

      toast("File uploaded", {
        description: "File has been sent successfully.",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast("Upload failed", {
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

      const messageData: Partial<Message> = {
        senderId: currentUser.uid,
        text: "Sent a voice message",
        fileUrl: downloadURL,
        fileType: "audio/wav",
        duration: duration,
        fileName: "voice_message.wav",
        timestamp: new Date().toISOString(),
        read: false,
      }

      // If replying, include reply data
      if (replyingTo && replyingTo.id) {
        messageData.replyToId = replyingTo.id
        messageData.replyToText = replyingTo.text || "Media message"

        await chatService.sendReplyMessage(
          selectedChat.id,
          messageData as Message,
          replyingTo
        )
        setReplyingTo(null)
      } else {
        await chatService.sendMessage(selectedChat.id, messageData as Message)
      }

      toast("Voice message sent", {
        description: "Voice message has been sent successfully.",
      })
    } catch (error) {
      console.error("Error sending voice message:", error)
      toast("Send failed", {
        description: "Could not send voice message. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Message action handlers
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!selectedChat || !currentUser) return;

    try {
      const message = messages.find(m => m.id === messageId);

      // Only allow editing own messages
      if (message && message.senderId === currentUser.uid) {
        await chatService.editMessage(selectedChat.id, messageId, newText);

        toast("Message edited", {
          description: "Your message has been updated",
        });
      }
    } catch (error) {
      console.error("Error editing message:", error);
      toast("Edit failed", {
        description: "Could not edit the message. Please try again.",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string, isLastMessage: boolean) => {
    if (!selectedChat || !currentUser) return;

    try {
      const message = messages.find(m => m.id === messageId);

      // Only allow deleting own messages
      if (message && message.senderId === currentUser.uid) {
        await chatService.deleteMessage(selectedChat.id, messageId, isLastMessage);

        toast("Message deleted", {
          description: "Your message has been removed",
        });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      toast("Delete failed", {
        description: "Could not delete the message. Please try again.",
      });
    }
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!selectedChat || !currentUser) return;

    try {
      // Use the simplified toggle reaction function
      await chatService.toggleReaction(
        selectedChat.id,
        messageId,
        currentUser.uid,
        emoji
      );
    } catch (error) {
      console.error("Error reacting to message:", error);
      toast("Reaction failed", {
        description: "Could not react to the message. Please try again.",
      });
    }
  };

  const filteredUsers = users.filter((user) =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <Card className="h-screen bg-black lg:max-w-[1700px] sm:max-w-[320px] overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}>

      <ResizablePanelGroup
        direction="horizontal"
        className="h-full bg-black rounded-lg border-0"
        onLayout={(sizes) => {
          if (!isMobile) {
            setSidebarSize(sizes[0]);
            setChatSize(sizes[1]);
          }
        }}
      >
        {/* Sidebar Panel */}
        <ResizablePanel
          defaultSize={sidebarSize}
          minSize={isMobile ? 0 : 20}
          maxSize={isMobile ? 100 : 40}
          collapsible={!isMobile}
          collapsedSize={0}
          onCollapse={() => {
            setSidebarOpen(false);
          }}
          onExpand={() => {
            setSidebarOpen(true);
          }}
          className={`${isMobile && !sidebarOpen ? 'hidden' : ''}`}
        >
          <div className="h-full ">
            <ChatSidebar
              isOpen={true} // Always true as the ResizablePanel handles visibility
              onClose={() => setSidebarOpen(false)}
              currentUser={currentUser}
              users={filteredUsers}
              chats={chats}
              selectedChat={selectedChat}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSignOut={handleSignOut}
              onChatSelect={(chat) => {
                setSelectedChat(chat);
                if (isMobile) setSidebarOpen(false);
              }}
              onStartChat={startNewChat}
            />
          </div>
        </ResizablePanel>

        {/* Resizable Handle */}
        {(!isMobile || sidebarOpen) && <ResizableHandle />}

        {/* Chat Area Panel */}
        <ResizablePanel
          defaultSize={chatSize}
          minSize={30}
          className={`${isMobile && sidebarOpen ? 'hidden' : ''}`}
        >
          <div className="flex flex-col h-full">
            {selectedChat && selectedChatUser ? (
              <>
                <ChatHeader
                  user={selectedChatUser}
                  onOpenSidebar={toggleSidebar}
                  showMenuButton={true}
                  onCall={(callType: 'audio' | 'video') => startCall(selectedChatUser.uid, callType)}
                />

                {/* Messages Area */}
                <div className="flex-1 scrollbar-thin overflow-y-auto p-4">
                  <AnimatePresence initial={false}>
                    <MessageList
                      messages={messages}
                      currentUser={currentUser}
                      formatTime={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                      onEditMessage={handleStartEditMessage}
                      onDeleteMessage={handleDeleteMessage}
                      onReactToMessage={handleReactToMessage}
                      onReplyToMessage={handleReplyToMessage}
                    />
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                <MessageInput
                  message={newMessage}
                  isUploading={isUploading}
                  replyingTo={replyingTo}
                  editingMessage={editingMessage}
                  onMessageChange={setNewMessage}
                  onSendMessage={handleSendMessage}
                  onFileSelect={handleFileSelect}
                  onVoiceMessageSend={handleVoiceMessageSend}
                  onCancelReply={handleCancelReply}
                  onCancelEdit={handleCancelEdit}
                />
              </>
            ) : (
              <WelcomeScreen
                onOpenSidebar={toggleSidebar}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Call UI Components */}
      <CallContext.Consumer>
        {(callContext) => {
          if (!callContext) return null
          const { callState, endCall } = callContext

          if (callState.isIncomingCall && !callState.callAccepted) {
            const caller = users.find(user => user.uid === callState.callerId);
            return (
              <IncomingCallDialog
                callerName={caller?.displayName || 'Unknown Caller'}
              />
            );
          }

          if (callState.isOutgoingCall || callState.callAccepted) {
            const otherUser = users.find(
              user => user.uid === (callState.calleeId || callState.callerId)
            );
            return (
              <CallInterface
                recipientName={otherUser?.displayName || 'Unknown User'}
              />
            );
          }

          return null;
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
      <Card className="flex items-center justify-center min-h-screen bg-black animate-fadeIn border-0">
        <CardContent className="text-center bg-black relative w-full">
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