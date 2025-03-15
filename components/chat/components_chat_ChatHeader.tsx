"use client"

import { User } from "../types/types_chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Menu, MoreVertical, Phone, Video } from "lucide-react"
import { useCall } from "../contexts/contexts_CallContext"

// Utility function to format the last seen date
const formatLastSeen = (lastSeen: any): string => {
  if (!lastSeen) return "Unknown";

  let date;

  // Handle Firestore Timestamp or string input
  if (lastSeen.seconds) {
    date = new Date(lastSeen.seconds * 1000); // Firestore Timestamp
  } else if (typeof lastSeen === "string") {
    date = new Date(lastSeen); // String input
  } else {
    return "Unknown";
  }

  if (isNaN(date.getTime())) return "Unknown"; // Invalid date fallback

  const now = new Date(); // Current date and time
  const tomorrow = new Date(now); // Create a date object for tomorrow
  tomorrow.setDate(now.getDate() + 1);

  // Format for today
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return `today at ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  // Format for tomorrow
  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return `tomorrow at ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  // Format for any other day
  return `last seen on ${date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })} at ${date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

interface ChatHeaderProps {
  user: User
  onOpenSidebar: () => void
  showMenuButton?: boolean
}

export const ChatHeader = ({ user, onOpenSidebar, showMenuButton = false }: ChatHeaderProps) => {
  const { startCall } = useCall()
 

  return (
    <div className="p-3 bg-[#1e1d1d] border-b border-gray-800 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onOpenSidebar}
          >
            <Menu className="h-4 w-4 text-gray-400" />
          </Button>
        )}
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.photoURL || undefined} />
          <AvatarFallback className="bg-green-500 text-white text-sm">
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-sm text-white truncate">
            {user.displayName}
          </h2>
          <p className="text-xs text-gray-400">
            {user.status === "online" ? "online" : `last seen ${formatLastSeen(user.lastSeen)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startCall(user.uid, 'audio')}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
          title="Start audio call"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startCall(user.uid, 'video')}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
          title="Start video call"
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
    </div>
  )
}