import { Message, User } from "../types/types_chat"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, LogOut, X } from "lucide-react"
import { formatMessageTime, formatTime, getInitials } from "../utils/lib_utils (1)"

// Add Chat interface since it's used but not imported
interface Chat {
  id: string
  participants: string[]
  lastMessage: {
    text: string
    timestamp: string
  } | null
  unreadCount: number
}

// Add UsersList component
interface UsersListProps {
  users: User[]
  onStartChat: (userId: string) => void
}




const UsersList = ({ users, onStartChat }: UsersListProps) => {

  
  return (
    <div className="py-2">
      <h3 className="px-3 py-1 text-xs font-medium text-gray-400">USERS</h3>
      {users.length > 0 ? (
        users.map((user) => (
          <div
            key={user.uid}
            className="px-3 py-2 flex items-center space-x-3 hover:bg-[#2a2a2a] cursor-pointer"
            onClick={() => onStartChat(user.uid)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-green-500 text-white">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-white truncate">
                {user.displayName}
              </h4>
              <p className="text-xs text-gray-400 truncate">{user.status}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="px-3 py-2 text-sm text-gray-400">No users found</p>
      )}
    </div>
  )
}

// Add ChatsList component
interface ChatsListProps {
  chats: Chat[]
  users: User[]
  currentUser: User | null
  selectedChat: Chat | null
  onChatSelect: (chat: Chat) => void
}




const ChatsList = ({ chats, users, currentUser, selectedChat, onChatSelect }: ChatsListProps) => {
  return (
    <div className="space-y-1">
      {chats.map((chat) => {
        const otherUserId = chat.participants.find(
          (id) => id !== currentUser?.uid
        )
        const chatUser = users.find((user) => user.uid === otherUserId)
       

        return (
          <div
            key={chat.id}
            className={`px-3 py-2 flex items-center space-x-3 cursor-pointer
              ${selectedChat?.id === chat.id ? "bg-[#2a2a2a]" : "hover:bg-[#2a2a2a]"}`}
            onClick={() => onChatSelect(chat)}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={chatUser?.photoURL || undefined} />
              <AvatarFallback className="bg-green-500 text-white">
                {chatUser ? getInitials(chatUser.displayName) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm text-white truncate">
                  {chatUser?.displayName || "Unknown User"}
                </h4>
                {chat.lastMessage && (
                  <span className="text-[10px] text-gray-400">
                    {formatMessageTime(chat.lastMessage.timestamp)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate">
                {chat.lastMessage ? chat.lastMessage.text : "No messages yet"}
              </p>
            </div>
          </div>
        )
      })}

      {chats.length === 0 && (
        <div className="px-3 py-6 text-center">
          <p className="text-sm text-gray-400">No conversations yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Search for users to start chatting
          </p>
        </div>
      )}
    </div>
  )
}

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User | null
  users: User[]
  chats: Chat[]
  selectedChat: Chat | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onSignOut: () => void
  onChatSelect: (chat: Chat) => void
  onStartChat: (userId: string) => void
}

export const ChatSidebar = ({
  isOpen,
  onClose,
  currentUser,
  users,
  chats,
  selectedChat,
  searchQuery,
  onSearchChange,
  onSignOut,
  onChatSelect,
  onStartChat,
}: ChatSidebarProps) => {
  return (
    <div
      className={`${isOpen ? "fixed inset-0 z-40 block w-full" : "hidden"
        } md:relative md:block md:w-[320px] lg:w-[400px] h-full bg-[#1e1d1d] border-r border-gray-800`}
    >
      {/* Header */}
      <div className="p-3 bg-[#1e1d1d] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.photoURL || undefined} />
            <AvatarFallback className="bg-green-500 text-white text-sm">
              {currentUser?.displayName ? getInitials(currentUser.displayName) : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold text-white truncate max-w-[150px]">
              {currentUser?.displayName}
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" onClick={onSignOut} title="Sign out">
            <LogOut className="h-4 w-4 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search or start new chat"
            className="pl-8 h-9 text-sm bg-[#2a2a2a] border-gray-700 text-white focus:ring-1 focus:ring-gray-600"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Users/Chats List */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          <UsersList users={users} onStartChat={onStartChat} />
        ) : (
          <ChatsList
            chats={chats}
            users={users}
            currentUser={currentUser}
            selectedChat={selectedChat}
            onChatSelect={onChatSelect}
          />
        )}
      </div>
    </div>
  )
}