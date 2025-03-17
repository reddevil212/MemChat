"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Smile, Paperclip, Send, Mic, StopCircle, Trash2, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { AudioPlayer } from "./AudioPlayer"
import { toast } from "sonner"
import { Message } from "../types/types_chat"
import { motion, AnimatePresence } from "framer-motion"

const EmojiPicker = ({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) => {
  const commonEmojis = ["😊", "😂", "❤️", "👍", "🙌", "🎉", "🔥", "👏", "🤔", "😍"]
  return (
    <div className="grid grid-cols-5 gap-2 p-2">
      {commonEmojis.map((emoji) => (
        <button
          key={emoji}
          className="h-8 w-8 p-0"
          onClick={() => onEmojiSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

interface MessageInputProps {
  message: string
  isUploading: boolean
  replyingTo?: Message | null
  editingMessage?: Message | null
  onMessageChange: (message: string) => void
  onSendMessage: () => void
  onFileSelect: () => void
  onVoiceMessageSend: (audioBlob: Blob, duration?: number) => void
  onCancelReply?: () => void
  onCancelEdit?: () => void
}

export const MessageInput = ({
  message,
  isUploading,
  replyingTo = null,
  editingMessage = null,
  onMessageChange,
  onSendMessage,
  onFileSelect,
  onVoiceMessageSend,
  onCancelReply = () => { },
  onCancelEdit = () => { }
}: MessageInputProps) => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingStartTimeRef = useRef<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      adjustTextareaHeight()
    }
  }, [message, replyingTo, editingMessage])

  if (isUploading && uploadProgress < 100) {
    setTimeout(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 100))
    }, 300)
  } else if (!isUploading && uploadProgress !== 0) {
    setUploadProgress(0)
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioURL = URL.createObjectURL(audioBlob)
        setAudioURL(audioURL)
      }

      mediaRecorder.start()
      setIsRecording(true)
      recordingStartTimeRef.current = Date.now()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast.error("Could not access microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      mediaStreamRef.current = null
    }
    if (recordingStartTimeRef.current) {
      const endTime = Date.now()
      const duration = (endTime - recordingStartTimeRef.current) / 1000
      setAudioDuration(duration)
      recordingStartTimeRef.current = null
    }
    setIsRecording(false)
  }

  const sendVoiceMessage = () => {
    if (audioURL && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      onVoiceMessageSend(audioBlob, audioDuration)
      setAudioURL(null)
      audioChunksRef.current = []
      setAudioDuration(0)
    }
  }

  const discardRecording = () => {
    setAudioURL(null)
    audioChunksRef.current = []
    setAudioDuration(0)
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      mediaStreamRef.current = null
    }
  }

  const getPlaceholderText = () => {
    if (isUploading) return "Uploading file..."
    if (editingMessage) return "Edit your message"
    if (replyingTo) return "Type your reply"
    return "Type a message"
  }

  return (
    <Card className="rounded-none border-x-0 border-b-0 shadow-none">
      <CardContent className="p-3">
        <AnimatePresence>
          {(replyingTo || editingMessage) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-3 p-2 bg-muted/30 rounded-md"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {editingMessage
                    ? "Editing message"
                    : `Replying to ${replyingTo?.senderId === "reddevil212" ? "yourself" : ""}`
                  }
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={editingMessage ? onCancelEdit : onCancelReply}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="text-sm text-foreground/80 truncate max-w-[90%]">
                {replyingTo?.fileUrl ? (
                  <div className="flex items-center space-x-2">
                    <img src={replyingTo.fileUrl} alt="Replied media" className="w-10 h-10 object-cover rounded" />
                    <span>{replyingTo.fileName || "Media file"}</span>
                  </div>
                ) : (
                  replyingTo?.text || "Media message"
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {audioURL && (
          <div className="mb-3 p-2 bg-muted/30 rounded-md">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Voice Message Preview
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" onClick={sendVoiceMessage} className="h-7 px-2">
                  <Send className="h-3.5 w-3.5 text-primary mr-1" />
                  <span className="text-xs">Send</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={discardRecording} className="h-7 px-2">
                  <Trash2 className="h-3.5 w-3.5 text-destructive mr-1" />
                  <span className="text-xs">Discard</span>
                </Button>
              </div>
            </div>
            <AudioPlayer src={audioURL} initialDuration={audioDuration} />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Popover>
              <PopoverTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Smile className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="dark: bg-black dark:text-white">Add emoji</p></TooltipContent>
                </Tooltip>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0">
                <EmojiPicker onEmojiSelect={(emoji) => onMessageChange(message + emoji)} />
              </PopoverContent>
            </Popover>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFileSelect}
                  disabled={isUploading || !!editingMessage}
                  className={`text-muted-foreground ${isUploading || !!editingMessage ? "opacity-50" : ""}`}
                >
                  <Paperclip
                    className={`h-5 w-5 ${isUploading ? "text-primary animate-pulse" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="dark: bg-black dark:text-white">
                  {editingMessage ? "Can't attach files when editing" : "Attach file"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder={getPlaceholderText()}
              className="w-full resize-none min-h-[40px] max-h-[120px] text-sm bg-muted/50"
              value={message}
              onChange={(e) => {
                onMessageChange(e.target.value)
                adjustTextareaHeight()
              }}
              disabled={isUploading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSendMessage()
                }
              }}
              rows={1}
            />
          </div>

          <TooltipProvider>
            {message.trim() || editingMessage ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSendMessage}
                    disabled={isUploading}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="dark: bg-black dark:text-white">
                    {editingMessage ? "Save edit" : "Send message"}
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!!editingMessage}
                    className={`text-muted-foreground ${isRecording ? "text-red-500 animate-pulse" : ""} ${editingMessage ? "opacity-50" : ""}`}
                  >
                    {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="dark: bg-black dark:text-white">
                    {editingMessage
                      ? "Can't record when editing"
                      : (isRecording ? "Stop recording" : "Record voice message")}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>

        {isUploading && (
          <div className="mt-2">
            <Progress value={uploadProgress} className="h-1" />
            <p className="text-xs text-primary mt-1 text-center">
              Uploading file... {uploadProgress}%
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
};