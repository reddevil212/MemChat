import React from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Smile } from 'lucide-react'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉', '🤔']

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-gray-400 hover:text-white">
          <Smile className="w-4 h-4" />
          <span>React</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-48 p-2 flex flex-wrap justify-center gap-2 bg-[#2a2a2a] border-none text-white"
        sideOffset={5}
        align="center"
        side="top"
        onClick={(e) => e.stopPropagation()}
      >
        {EMOJI_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEmojiSelect(emoji);
            }}
            className="text-xl hover:bg-[#3a3a3a] p-1 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}