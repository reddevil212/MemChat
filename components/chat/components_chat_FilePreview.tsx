import { Message } from "../types/types_chat"
import { FileText, Film, FileMusic, ImageIcon } from "lucide-react"
import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false })

interface FilePreviewProps {
  message: Message
}

export const FilePreview = ({ message }: FilePreviewProps) => {
  const { fileUrl, fileType, fileName, text } = message

  if (!fileUrl || !fileType) {
    return null
  }

  if (fileType.startsWith('image/')) {
    return (
      <div className="image-preview my-2">
        <div className="relative max-h-60 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl}
            alt={fileName || text}
            className="w-full h-auto max-h-60 object-cover"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 flex items-center">
          <ImageIcon size={12} className="mr-1" /> {fileName || "Image"}
        </p>
      </div>
    )
  }

  if (fileType.startsWith('video/')) {
    return (
      <div className="video-preview my-2">
        <div className="rounded-lg overflow-hidden">
          <ReactPlayer
            url={fileUrl}
            controls={true}
            width="100%"
            height="100%"
            className="react-player"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 flex items-center">
          <Film size={12} className="mr-1" /> {fileName || "Video"}
        </p>
      </div>
    )
  }

  if (fileType.startsWith('audio/')) {
    return (
      <div className="audio-preview my-2">
        <div className="rounded-lg bg-gray-700 bg-opacity-30 p-2">
          <audio controls className="w-full">
            <source src={fileUrl} type={fileType} />
            Your browser does not support the audio element.
          </audio>
        </div>
        <p className="text-xs text-gray-500 mt-1 flex items-center">
          <FileMusic size={12} className="mr-1" /> {fileName || "Audio"}
        </p>
      </div>
    )
  }

  return (
    <div className="file-link my-2">
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center p-3 rounded-lg bg-gray-700 bg-opacity-30 hover:bg-opacity-40 transition-all"
      >
        <FileText className="mr-2 h-6 w-6" />
        <div className="overflow-hidden">
          <p className="font-medium text-sm truncate">{fileName || text}</p>
          <p className="text-xs text-gray-400">Click to open</p>
        </div>
      </a>
    </div>
  )
}