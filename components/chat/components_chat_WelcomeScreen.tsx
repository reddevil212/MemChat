import { Button } from "@/components/ui/button"
import { Menu, MessageSquare } from "lucide-react"

interface WelcomeScreenProps {
  onOpenSidebar: () => void
}

export const WelcomeScreen = ({ onOpenSidebar }: WelcomeScreenProps) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden absolute top-3 left-3"
        onClick={onOpenSidebar}
      >
        <Menu className="h-4 w-4 mr-2 text-gray-400" />
        <span className="text-sm text-gray-400">Chats</span>
      </Button>
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Memchat</h2>
        <p className="text-sm text-gray-400">
          Select a chat from the sidebar or search for a user to start a new
          conversation.
        </p>
      </div>
    </div>
  )
}