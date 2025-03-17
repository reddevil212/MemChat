"use client"

import { useState } from "react"
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion"
import { Message, User } from "../types/types_chat"
import { FilePreview } from "./components_chat_FilePreview"
import { formatMessageTime } from "../utils/lib_utils (1)"
import { MoreHorizontal, Edit, Trash2, Reply, Smile, Copy } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

interface MessageItemProps {
  message: Message
  currentUser: User | null
  isLastMessage: boolean
  onEditMessage: (messageId: string, newText: string) => Promise<void>
  onDeleteMessage: (messageId: string, isLastMessage: boolean) => Promise<void>
  onReplyToMessage: (message: Message) => void
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>
}

const ReactionEmojis = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sad" },
  { emoji: "🙏", label: "Thank you" }
]

export const MessageItem = ({
  message,
  currentUser,
  isLastMessage,
  onEditMessage,
  onDeleteMessage,
  onReplyToMessage,
  onReactToMessage
}: MessageItemProps) => {
  const [showOptions, setShowOptions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const isCurrentUser = currentUser && message.senderId === currentUser.uid
  const canModify = isCurrentUser

  const getReactionGroups = () => {
    if (!message.reactions || message.reactions.length === 0) return {}

    return message.reactions.reduce((acc: Record<string, { count: number, hasCurrentUser: boolean }>, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = { count: 0, hasCurrentUser: false }
      }
      acc[reaction.emoji].count++
      if (currentUser && reaction.userId === currentUser.uid) {
        acc[reaction.emoji].hasCurrentUser = true
      }
      return acc
    }, {})
  }

  const reactionGroups = getReactionGroups()

  const copyMessageText = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text)
      toast.success("Copied to clipboard")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex mb-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => {
        setShowOptions(false)
        setShowReactions(false)
      }}
    >

      {message.replyToId && (
        <div
          className={`absolute -top-4 ${isCurrentUser ? "right-4" : "left-4"} 
          text-xs text-muted-foreground cursor-pointer`}
          onClick={() => {
            const element = document.getElementById(`message-${message.replyToId}`)
            if (element) element.scrollIntoView({ behavior: "smooth", block: "center" })
          }}
        >

        </div>
      )}

      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted/80 text-foreground"}`}
        id={`message-${message.id}`}
      >
        {message.replyToId && message.replyToText && (
          <div className={`mb-1 pb-1 text-xs ${isCurrentUser ? "border-b border-primary-foreground/20" : "border-b border-foreground/20"}`}>
            <div className="opacity-70 font-medium flex items-center space-x-2">
              {message.replyToFileUrl && (
                <Image
                  src={message.replyToFileUrl}
                  alt="Replied media"
                  width={50}
                  height={10}
                  className="object-cover rounded cursor-pointer"
                  style={{ width: 'auto', height: 'auto' }}
                  onClick={() => {
                    const element = document.getElementById(`message-${message.replyToId}`)
                    if (element) element.scrollIntoView({ behavior: "smooth", block: "center" })
                  }}
                />
              )}
              <span>{message.replyToText}</span>
            </div>
          </div>
        )}

        {message.fileUrl && message.fileType && (
          <FilePreview message={message} />
        )}

        <p className="text-sm whitespace-pre-wrap break-words">
          {message.text}
          {message.isEdited && (
            <span className="text-[10px] opacity-70 ml-1">(edited)</span>
          )}
        </p>

        <div className={`text-[10px] mt-1 flex items-center justify-end
          ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
        >
          {formatMessageTime(message.timestamp)}
          {isCurrentUser && (
            <span className="ml-1">
              {message.read ? "✓✓" : "✓"}
            </span>
          )}
        </div>

        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap mt-1 gap-1">
            {Object.entries(reactionGroups).map(([emoji, { count, hasCurrentUser }]) => (
              <div
                key={emoji}
                className={`text-xs rounded-full px-1 py-0.5 flex items-center gap-0.5 ${hasCurrentUser
                    ? isCurrentUser
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/20 text-primary"
                    : isCurrentUser
                      ? "bg-primary-foreground/10 text-primary-foreground/80"
                      : "bg-muted-foreground/10 text-muted-foreground"
                  }`}
              >
                <span>{emoji}</span>
                {count > 1 && <span>{count}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute -top-5 ${isCurrentUser ? "right-0" : "left-0"} 
              bg-background rounded-full shadow-md p-0.5 flex items-center gap-0.5 z-10`}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onReplyToMessage(message)}
                    className="p-1.5 hover:bg-muted rounded-full"
                  >
                    <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Reply</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Popover open={showReactions} onOpenChange={setShowReactions}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        className="p-1.5 hover:bg-muted rounded-full"
                      >
                        <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">React</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent className="p-1 flex gap-0.5" side="top">
                  {ReactionEmojis.map((item) => {
                    const hasReacted = message.reactions?.some(
                      r => r.emoji === item.emoji && r.userId === currentUser?.uid
                    )

                    return (
                      <TooltipProvider key={item.emoji}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                onReactToMessage(message.id!, item.emoji)
                                setShowReactions(false)
                              }}
                              className={`p-1.5 rounded-full transition-colors ${hasReacted ? "bg-primary/20" : "hover:bg-muted"
                                }`}
                            >
                              {item.emoji}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </PopoverContent>
              </Popover>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-muted rounded-full">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
                <DropdownMenuItem onClick={copyMessageText}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>

                {canModify && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (message.id) {
                          onEditMessage(message.id, message.text || "")
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (message.id) {
                          onDeleteMessage(message.id, isLastMessage)
                        }
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 mr-2" />
                      <p className="text-red-600">Delete</p>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
