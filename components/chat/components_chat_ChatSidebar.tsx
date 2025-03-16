import { Message, User } from "../types/types_chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  LogOut,
  X,
  MessageSquare,
  Users,
  UserSearch,
  Settings,
  User as UserIcon,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { formatMessageTime, getInitials } from "../utils/lib_utils (1)";
import { useState } from "react";

// Add Chat interface since it's used but not imported
interface Chat {
  id: string;
  participants: string[];
  lastMessage: {
    text: string;
    timestamp: string;
  } | null;
  unreadCount: number;
}

// Add UsersList component
interface UsersListProps {
  users: User[];
  onStartChat: (userId: string) => void;
}

const UsersList = ({ users, onStartChat }: UsersListProps) => {
  return (
    <div className="py-2">
      <h3 className="px-3 py-1 text-xs font-medium bg text-gray-400">USERS</h3>
      {users.length > 0 ? (
        users.map((user) => (
          <div
            key={user.uid}
            className="px-3 py-2 flex items-center space-x-3 hover:bg-[#2a2a2a] cursor-pointer"
            onClick={() => onStartChat(user.uid)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-gray-600 text-white">
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
  );
};

// Add ChatsList component
interface ChatsListProps {
  chats: Chat[];
  users: User[];
  currentUser: User | null;
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
}

const ChatsList = ({ chats, users, currentUser, selectedChat, onChatSelect }: ChatsListProps) => {
  return (
    <div className=" space-y-1 ">
      {chats.map((chat) => {
        const otherUserId = chat.participants.find(
          (id) => id !== currentUser?.uid
        );
        const chatUser = users.find((user) => user.uid === otherUserId);

        return (
          <div
            key={chat.id}
            className={`px-3 py-2 flex items-center space-x-3 cursor-pointer
              ${selectedChat?.id === chat.id ? "bg-[#2a2a2a]" : "hover:bg-[#2a2a2a]"}`}
            onClick={() => onChatSelect(chat)}
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={chatUser?.photoURL || undefined} />
              <AvatarFallback className="bg-blue-500 text-white">
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
        );
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
  );
};

// Add ContactsList component
interface ContactsListProps {
  users: User[];
  currentUser: User | null;
  onStartChat: (userId: string) => void;
}

const ContactsList = ({ users, currentUser, onStartChat }: ContactsListProps) => {
  // Filter out current user and sort by displayName
  const contacts = users
    .filter(user => user.uid !== currentUser?.uid)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div className="py-2">
      <h3 className="px-3 py-1 text-xs font-medium text-gray-400">CONTACTS</h3>
      {contacts.length > 0 ? (
        contacts.map((contact) => (
          <div
            key={contact.uid}
            className="px-3 py-2 flex items-center space-x-3 hover:bg-[#2a2a2a] cursor-pointer"
            onClick={() => onStartChat(contact.uid)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={contact.photoURL || undefined} />
              <AvatarFallback className="bg-gray-600 text-white">
                {getInitials(contact.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-white truncate">
                {contact.displayName}
              </h4>
              <p className="text-xs text-gray-400 truncate">
                {contact.status || "Offline"}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="px-3 py-2 text-sm text-gray-400">No contacts found</p>
      )}
    </div>
  );
};

// Add SettingsPanel component
interface SettingsPanelProps {
  currentUser: User | null;
  onSignOut: () => void;
}

const SettingsPanel = ({ currentUser, onSignOut }: SettingsPanelProps) => {
  return (
    <div className="p-3 space-y-4">
      <h3 className="px-3 py-1 text-xs font-medium text-gray-400">SETTINGS</h3>

      <div className="px-3 py-2 bg-[#2a2a2a] rounded-lg">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="h-14 w-14">
            <AvatarImage src={currentUser?.photoURL || undefined} />
            <AvatarFallback className="bg-gray-600 text-white text-lg">
              {currentUser?.displayName ? getInitials(currentUser.displayName) : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium text-white">
              {currentUser?.displayName || "User"}
            </h4>
            <p className="text-xs text-gray-400">
              {currentUser?.email || ""}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start text-gray-300 border-gray-700 hover:bg-[#3a3a3a]"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-gray-300 border-gray-700 hover:bg-[#3a3a3a]"
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="px-3 py-2 bg-[#2a2a2a] rounded-lg">
        <h5 className="text-sm font-medium text-white mb-2">Appearance</h5>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Dark Mode</span>
            <span className="text-xs text-gray-400">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  users: User[];
  chats: Chat[];
  selectedChat: Chat | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSignOut: () => void;
  onChatSelect: (chat: Chat) => void;
  onStartChat: (userId: string) => void;
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
  // State to track active tab in the mini-sidebar
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'search' | 'settings'>('chats');

  // State to control sidebar expansion
  const [expanded, setExpanded] = useState(true);

  // Function to render the main content based on the active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <>
            <div className="p-3 bg-[#000000] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser?.photoURL || undefined} />
                  <AvatarFallback className="bg-gray-600 text-white text-sm">
                    {currentUser?.displayName ? getInitials(currentUser.displayName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-sm font-semibold text-white truncate max-w-[150px]">
                    {currentUser?.displayName}
                  </h2>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-[#000000] overflow-y-auto">
              <ChatsList
                chats={chats}
                users={users}
                currentUser={currentUser}
                selectedChat={selectedChat}
                onChatSelect={onChatSelect}
              />
            </div>
          </>
        );

      case 'contacts':
        return (
          <>
            <div className="p-3 bg-[#000000] border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">Contacts</h2>
            </div>
            <div className="flex-1 bg-[#000000] overflow-y-auto">
              <ContactsList
                users={users}
                currentUser={currentUser}
                onStartChat={onStartChat}
              />
            </div>
          </>
        );

      case 'search':
        return (
          <>
            <div className="p-3 bg-[#000000] border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">Search Users</h2>
            </div>
            <div className="p-2 border-b border-gray-800">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users"
                  className="pl-8 h-9 text-sm bg-[#000000] border-gray-700 text-white focus:ring-1 focus:ring-gray-600"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 bg-[#000000] overflow-y-auto">
              <UsersList users={users} onStartChat={onStartChat} />
            </div>
          </>
        );

      case 'settings':
        return (
          <>
            <div className="p-3 bg-[#000000] border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">Settings</h2>
            </div>
            <div className="flex-1 bg-[#000000] overflow-y-auto">
              <SettingsPanel currentUser={currentUser} onSignOut={onSignOut} />
            </div>
          </>
        );
    }
  };

  return (
    <div className={`flex h-full ${isOpen ? 'block' : 'hidden md:flex'}`}>
      {/* Strap-sized mini sidebar (now on the left) */}
      <div
        className="flex flex-col bg-black border-r border-gray-800 transition-all duration-300"
        style={{ width: expanded ? '240px' : '56px' }}
      >
        {/* Top icons */}
        <div className="flex-1 flex flex-col items-center pt-4 space-y-5">
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full ${activeTab === 'chats' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}
            onClick={() => setActiveTab('chats')}
            title="Chats"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full ${activeTab === 'contacts' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}
            onClick={() => setActiveTab('contacts')}
            title="Contacts"
          >
            <Users className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full ${activeTab === 'search' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}
            onClick={() => setActiveTab('search')}
            title="Search Users"
          >
            <UserSearch className="h-5 w-5" />
          </Button>
        </div>

        {/* Bottom icons */}
        <div className="flex flex-col items-center space-y-5 pb-5">
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-full ${activeTab === 'settings' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}
            onClick={() => setActiveTab('settings')}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Toggle expand/collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Main content area - only visible when expanded */}
      {expanded && (
        <div className="flex-1 flex flex-col h-full bg-[#1e1d1d] border-r border-gray-800 transition-all duration-300">
          {renderMainContent()}
        </div>
      )}

      {/* Mobile close button overlay */}
      <div className="absolute top-2 right-2 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:bg-[#2a2a2a]"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
