import React from 'react'
import { Reaction } from '../types/types_chat'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MessageReactionsProps {
  reactions: Reaction[]
  currentUserId: string
  onToggleReaction: (emoji: string) => void
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  currentUserId,
  onToggleReaction
}) => {
  if (!reactions || reactions.length === 0) return null

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, Reaction[]>)

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, reactionsForEmoji]) => {
        const hasReacted = reactionsForEmoji.some(r => r.userId === currentUserId)

        return (
          <TooltipProvider key={emoji}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleReaction(emoji);
                  }}
                  className={`rounded-full px-1.5 py-0.5 text-xs flex items-center gap-1 transition-colors ${hasReacted
                      ? 'bg-blue-600/30 border border-blue-600/50'
                      : 'bg-gray-600/30 hover:bg-gray-600/50 border border-gray-600/50'
                    }`}
                >
                  <span>{emoji}</span>
                  <span>{reactionsForEmoji.length}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-[#2a2a2a] border-none p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-xs">
                  {reactionsForEmoji.map(r => r.userId).join(', ')}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}