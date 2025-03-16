"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Smile, Paperclip, Send, Mic, StopCircle, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { AudioPlayer } from "./AudioPlayer"
import { toast } from "sonner" // Import toast from your UI library

// You could use a proper emoji picker library here
// For simplicity, I'm adding a basic placeholder
const EmojiPicker = ({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) => {
  const commonEmojis = ["😊", "😂", "❤️", "👍", "🙌", "🎉", "🔥", "👏", "🤔", "😍"]

  return (
    <div className="grid grid-cols-5 gap-2 p-2">
      {commonEmojis.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onEmojiSelect(emoji)}
        >
          {emoji}
        </Button>
      ))}
    </div>
  )
}

interface MessageInputProps {
  message: string
  isUploading: boolean
  onMessageChange: (message: string) => void
  onSendMessage: () => void
  onFileSelect: () => void
  onVoiceMessageSend: (audioBlob: Blob) => void
}

export const MessageInput = ({
  message,
  isUploading,
  onMessageChange,
  onSendMessage,
  onFileSelect,
  onVoiceMessageSend
}: MessageInputProps) => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingStartTimeRef = useRef<number | null>(null)

  // Simulate upload progress
  if (isUploading && uploadProgress < 100) {
    setTimeout(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 100))
    }, 300)
  } else if (!isUploading && uploadProgress !== 0) {
    setUploadProgress(0)
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
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    // Stop all audio tracks to release the microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      mediaStreamRef.current = null
    }

    // Calculate recording duration
    if (recordingStartTimeRef.current) {
      const endTime = Date.now()
      const duration = (endTime - recordingStartTimeRef.current) / 1000 // duration in seconds
      setAudioDuration(duration)
      toast(`Audio duration: ${duration} seconds`)
      recordingStartTimeRef.current = null
    }

    setIsRecording(false)
  }

  const sendVoiceMessage = () => {
    if (audioURL && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      onVoiceMessageSend(audioBlob, audioDuration)

      // Clear audio state after sending
      setAudioURL(null)
      audioChunksRef.current = []
      setAudioDuration(0)
    }
  }

  const discardRecording = () => {
    setAudioURL(null)
    audioChunksRef.current = []
    setAudioDuration(0)

    // Also ensure any active stream is stopped when discarding
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      mediaStreamRef.current = null
    }
  }

  return (
    <Card className="rounded-none border-x-0 border-b-0 shadow-none">
      <CardContent className="p-3">
        {/* Audio Preview */}
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
                  disabled={isUploading}
                  className={`text-muted-foreground ${isUploading ? "opacity-50" : ""}`}
                >
                  <Paperclip
                    className={`h-5 w-5 ${isUploading ? "text-primary animate-pulse" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="dark: bg-black dark:text-white">Attach file</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1">
            <Textarea
              placeholder={isUploading ? "Uploading file..." : "Type a message"}
              className="w-full resize-none min-h-[40px] max-h-[120px] text-sm bg-muted/50"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
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
            {message.trim() ? (
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
                <TooltipContent><p className="dark: bg-black dark:text-white">Send message</p></TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`text-muted-foreground ${isRecording ? "text-red-500 animate-pulse" : ""}`}
                  >
                    {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                  <TooltipContent><p className="dark: bg-black dark:text-white">{isRecording ? "Stop recording" : "Record voice message"}</p></TooltipContent>
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
}