import { Message, User } from "../types/types_chat"
import { FilePreview } from "./components_chat_FilePreview"
import { formatMessageTime } from "../utils/lib_utils (1)"

interface MessageListProps {
  messages: Message[]
  currentUser: User | null
  formatTime: (timestamp: string) => string
}

export const MessageList = ({ messages, currentUser, formatTime }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Send a message to start the conversation</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {messages.map((message) => {
        const isCurrentUser = message.senderId === currentUser?.uid

        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 ${isCurrentUser
                ? "bg-blue-500 text-white"
                : "bg-[#2a2a2a] text-white"
                }`}
            >
              {message.fileUrl && message.fileType && (
                <FilePreview message={message} />
              )}

              {message.text && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}

              <div
                className={`text-[10px] mt-1 flex items-center justify-end
                ${isCurrentUser ? "text-blue-100" : "text-gray-400"}`}
              >
                {formatMessageTime(message.timestamp)}
                {isCurrentUser && (
                  <span className="ml-1">
                    {message.read ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}