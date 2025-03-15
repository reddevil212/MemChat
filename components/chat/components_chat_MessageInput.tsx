import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smile, Paperclip, Send, Mic } from "lucide-react"

interface MessageInputProps {
  message: string
  isUploading: boolean
  onMessageChange: (message: string) => void
  onSendMessage: () => void
  onFileSelect: () => void
}

export const MessageInput = ({
  message,
  isUploading,
  onMessageChange,
  onSendMessage,
  onFileSelect
}: MessageInputProps) => {
  return (
    <div className="p-3 bg-[#1e1d1d] border-t border-gray-800">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="text-gray-400">
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFileSelect}
          disabled={isUploading}
          className="text-gray-400"
        >
          <Paperclip
            className={`h-5 w-5 ${isUploading ? "text-blue-400 animate-pulse" : ""}`}
          />
        </Button>
        <div className="flex-1">
          <Input
            placeholder={isUploading ? "Uploading file..." : "Type a message"}
            className="w-full text-sm bg-[#2a2a2a] border-gray-700 text-white focus:ring-1 focus:ring-gray-600"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            disabled={isUploading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onSendMessage()
              }
            }}
          />
        </div>
        {message.trim() ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSendMessage}
            disabled={isUploading}
            className="text-gray-400"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-gray-400">
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>

      {isUploading && (
        <div className="mt-2 text-center">
          <p className="text-xs text-blue-400">Uploading file, please wait...</p>
        </div>
      )}
    </div>
  )
}