"use client"

import { Message, User } from "../types/types_chat"
import { AnimatePresence } from "framer-motion"
import { MessageItem } from "./components_chat_components_chat_MessageItem"

interface MessageListProps {
  messages: Message[]
  currentUser: User | null
  formatTime: (timestamp: string) => string
  onEditMessage: (messageId: string, newText: string) => Promise<void>
  onDeleteMessage: (messageId: string, isLastMessage: boolean) => Promise<void>
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>
  onReplyToMessage: (message: Message) => void
}

export const MessageList = ({
  messages,
  currentUser,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onReplyToMessage
}: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Send a message to start the conversation</p>
        </div>
      </div>
    )
  }

  // Helper function to find the original message being replied to
  const findReplyMessage = (replyToId: string | undefined | null) => {
    if (!replyToId) return null
    return messages.find(m => m.id === replyToId)
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => {
          const replyToMessage = findReplyMessage(message.replyToId)

          return (
            <MessageItem
              key={message.id || index}
              message={message}
              currentUser={currentUser}
              isLastMessage={index === messages.length - 1}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
              onReactToMessage={onReactToMessage}
              onReplyToMessage={onReplyToMessage}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}