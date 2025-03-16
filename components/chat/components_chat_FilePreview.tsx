"use client"

import { useState, useEffect, useRef } from "react"
import { Message } from "../types/types_chat"
import { FileText, Film, FileMusic, ImageIcon } from "lucide-react"
import dynamic from 'next/dynamic'
import { AudioPlayer } from "./AudioPlayer"

// Import Shadcn components
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[180px] bg-muted/30 animate-pulse rounded-md flex items-center justify-center">
      <Film className="h-8 w-8 text-muted-foreground/50" />
    </div>
  )
})

interface FilePreviewProps {
  message: Message
}

export const FilePreview = ({ message }: FilePreviewProps) => {
  const { fileUrl, fileType, fileName, text } = message
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load audio duration if this is an audio file and duration isn't already provided
  useEffect(() => {
    if (fileType?.startsWith('audio/') && !message.duration && fileUrl) {
      // Create a temporary audio element to get the duration
      const audio = new Audio(fileUrl)
      audioRef.current = audio

      // The loadedmetadata event fires when duration is available
      const handleLoadedMetadata = () => {
        setAudioDuration(audio.duration)
      }

      audio.addEventListener('loadedmetadata', handleLoadedMetadata)

      // Clean up
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.src = '' // Clear source
      }
    }
  }, [fileUrl, fileType, message.duration])

  if (!fileUrl || !fileType) {
    return null
  }

  if (fileType.startsWith('image/')) {
    return (
      <Card className="my-2 overflow-hidden">
        <CardContent className="p-0">
          <AspectRatio ratio={4 / 3}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={fileName || text}
              className="object-cover w-full h-full rounded-t-md"
            />
          </AspectRatio>
        </CardContent>
        <CardFooter className="p-2 flex items-center justify-between bg-muted/20">
          <CardDescription className="text-xs flex items-center">
            <ImageIcon size={12} className="mr-1" /> {fileName || "Image"}
          </CardDescription>
          <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              Open
            </a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (fileType.startsWith('video/')) {
    return (
      <Card className="my-2 overflow-hidden">
        <CardContent className="p-0">
          <AspectRatio ratio={16 / 9}>
            <ReactPlayer
              url={fileUrl}
              controls={true}
              width="100%"
              height="100%"
              className="react-player"
            />
          </AspectRatio>
        </CardContent>
        <CardFooter className="p-2 flex items-center justify-between bg-muted/20">
          <CardDescription className="text-xs flex items-center">
            <Film size={12} className="mr-1" /> {fileName || "Video"}
          </CardDescription>
          <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              Download
            </a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (fileType.startsWith('audio/')) {
    // Show loading state while getting audio duration
    if (!message.duration && !audioDuration) {
      return (
        <Card className="my-2">
          <CardContent className="p-4">
            <div className="rounded-lg bg-muted/20 p-2">
              <div className="flex items-center justify-center py-4">
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
            <CardFooter className="px-0 pt-2 pb-0 flex items-center justify-between">
              <CardDescription className="text-xs flex items-center">
                <FileMusic size={12} className="mr-1" /> {fileName || "Audio"}
              </CardDescription>
              <Skeleton className="h-6 w-16" />
            </CardFooter>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="my-2">
        <CardContent className="p-4 ">
          <div className="rounded-lg bg-muted/20 p-2">
            {/* Use our custom AudioPlayer with the duration we got */}
            <AudioPlayer
              src={fileUrl}
              initialDuration={message.duration || audioDuration || 0}
              className="w-full"
            />
          </div>
          <CardFooter className="px-0 pt-2 pb-0 flex items-center justify-between">
            <CardDescription className="text-xs flex items-center">
              <FileMusic size={12} className="mr-1" /> {fileName || "Audio"}
            </CardDescription>
            <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                Download
              </a>
            </Button>
          </CardFooter>
        </CardContent>
      </Card>
    )
  }

  // For document or other file types
  return (
    <Card className="my-2">
      <CardContent className="p-4">
        <Button variant="outline" className="w-full justify-start" asChild>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 rounded-lg"
          >
            <FileText className="mr-2 h-6 w-6 text-primary" />
            <div className="overflow-hidden flex-1">
              <p className="font-medium text-sm truncate">{fileName || text}</p>
              <p className="text-xs text-muted-foreground">Click to open</p>
            </div>
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}