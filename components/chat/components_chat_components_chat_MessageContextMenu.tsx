import React, { ReactNode } from 'react';
import { MoreVertical, Edit, Trash, MessageSquareOff, Smile } from 'lucide-react';
import { Message } from '../types/types_chat';
import { CustomMenu, CustomMenuItem, CustomPopover } from './components_CustomMenu';

interface MessageContextMenuProps {
  message: Message;
  isCurrentUser: boolean;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  children: ReactNode;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉', '🤔'];

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  message,
  isCurrentUser,
  onEdit,
  onDelete,
  onReact,
  children,
}) => {
  return (
    <CustomMenu>
      <div className="group relative">
        {children}
        <MoreVertical
          className={`absolute top-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-400 hover:text-gray-200 
            ${isCurrentUser ? 'left-[-10px]' : 'right-[-10px]'}`}
        />
      </div>
      <div className="w-44 bg-[#2a2a2a] border-none text-white absolute">
        <CustomPopover
          trigger={
            <CustomMenuItem className="gap-2 cursor-pointer focus:bg-[#3a3a3a]">
              <Smile className="w-4 h-4" />
              <span>React</span>
            </CustomMenuItem>
          }
          content={
            <div className="w-48 p-2 flex flex-wrap justify-center gap-2 bg-[#2a2a2a] border-none text-white">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onReact(message.id!, emoji);
                  }}
                  className="text-xl hover:bg-[#3a3a3a] p-1 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          }
        />
        {isCurrentUser && (
          <>
            <CustomMenuItem className="gap-2 cursor-pointer focus:bg-[#3a3a3a]" onClick={() => onEdit(message.id!)}>
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </CustomMenuItem>
            <CustomMenuItem className="gap-2 cursor-pointer focus:bg-[#3a3a3a] text-red-500" onClick={() => onDelete(message.id!)}>
              <Trash className="w-4 h-4" />
              <span>Delete</span>
            </CustomMenuItem>
          </>
        )}
        {!isCurrentUser && (
          <CustomMenuItem className="gap-2 cursor-pointer focus:bg-[#3a3a3a]" onClick={() => { }}>
            <MessageSquareOff className="w-4 h-4" />
            <span>Remove for me</span>
          </CustomMenuItem>
        )}
      </div>
    </CustomMenu>
  );
};