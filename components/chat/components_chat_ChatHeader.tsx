import { useState, useEffect } from "react"
import { User } from "../types/types_chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Globe, MailsIcon, Menu, MoreVertical, Phone, Video } from "lucide-react"
import { useCall } from "../contexts/contexts_CallContext"
import { toast } from "sonner"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Utility function to format the last seen date
const formatLastSeen = (lastSeen: any): string => {
  if (!lastSeen) return "Unknown";

  let date;
  if (lastSeen.seconds) {
    date = new Date(lastSeen.seconds * 1000); // Firestore Timestamp
  } else if (typeof lastSeen === "string") {
    date = new Date(lastSeen); // String input
  } else {
    return "Unknown";
  }

  if (isNaN(date.getTime())) return "Unknown"; // Invalid date fallback

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return `Today at ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return `Yesterday at ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  return `Last seen on ${date.toLocaleDateString(undefined, {
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

  // State to track user data and loading status
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a delay for skeleton loading (1.5 seconds)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Mock live data update for demonstration
  useEffect(() => {
    // Example of subscribing to a real-time change (like Firestore listener)
    const interval = setInterval(() => {
      // Simulate a data change
      setUserData((prevUserData) => ({
        ...prevUserData,
        lastSeen: new Date().toISOString(), // Update with new "lastSeen" time
      }));
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="p-3 bg-[#000000] border-b border-gray-800 flex items-center justify-between">
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

        <HoverCard>
          <HoverCardTrigger>
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData.photoURL || undefined} />
              <AvatarFallback className="bg-green-500 text-white text-sm">
                {userData.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 p-4 dark:bg-black dark:text-white bg-white text-black rounded-lg shadow-lg">
            {loading ? (
              <div className="flex space-x-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={userData.photoURL || undefined} />
                  <AvatarFallback>{userData.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{userData.displayName}</h4>
                  <div className="flex items-center pt-2">
                    <MailsIcon className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-sm text-gray-500">{userData.email}</span>
                  </div>
                  <div className="flex items-center pt-2">
                    <Globe className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-xs text-gray-400">{formatLastSeen(userData.lastSeen)}</span>
                  </div>
                </div>
              </div>
            )}
          </HoverCardContent>
        </HoverCard>

        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-sm text-white truncate">
            {userData.displayName}
          </h2>
          <p className="text-xs text-gray-400">
            {userData.status === "online" ? "online" : `${formatLastSeen(userData.lastSeen)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <TooltipProvider >
          <Tooltip >
            <TooltipTrigger > <Button
          variant="ghost"
          size="sm"
          onClick={() => startCall(userData.uid, 'audio')}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <Phone className="h-4 w-4" />
        </Button>
        </TooltipTrigger>
            <TooltipContent ><p className="dark:bg-black text-white">Start audio call</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>


        <TooltipProvider >
          <Tooltip >
            <TooltipTrigger>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startCall(userData.uid, 'video')}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <Video className="h-4 w-4" />
        </Button>
            </TooltipTrigger>
            <TooltipContent ><p className="dark:bg-black text-white">Start video call</p></TooltipContent>
            </Tooltip >
              </TooltipProvider >



        <TooltipProvider >
          <Tooltip >
            <TooltipTrigger>
        <Button variant="ghost" size="sm" onClick={() => toast("Coming soon!")} className="text-gray-400 hover:text-white hover:bg-gray-700" >
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </Button>
      </TooltipTrigger>
      <TooltipContent ><p className="dark:bg-black text-white">More</p></TooltipContent>
    </Tooltip >
              </TooltipProvider >
      </div>
    </div>
  )
}
