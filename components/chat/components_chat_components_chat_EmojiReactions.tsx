import { useState, useEffect } from "react";
import { VariantProps, cva } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";

const reactionVariants = cva(
  "flex items-center justify-center text-center cursor-pointer transition-all duration-200",
  {
    variants: {
      size: {
        sm: "text-base p-1",
        md: "text-lg p-1.5",
        lg: "text-xl p-2",
      },
      active: {
        true: "bg-blue-600/40 rounded-full transform scale-110",
        false: "hover:bg-gray-700/40 rounded-full",
      },
    },
    defaultVariants: {
      size: "md",
      active: false,
    },
  }
);

export interface EmojiReactionsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof reactionVariants> {
  onSelectEmoji: (emoji: string) => void;
  userReactions?: string[];
  position?: "top" | "bottom";
}

export const EmojiReactions = ({
  onSelectEmoji,
  userReactions = [],
  position = "top",
  size,
  className,
  ...props
}: EmojiReactionsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const reactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? 10 : -10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#1e1e1e] rounded-full p-1 shadow-lg z-10"
          {...props}
        >
          <div className="flex space-x-0.5">
            {reactions.map((emoji) => (
              <motion.div
                key={emoji}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                className={reactionVariants({
                  size,
                  active: userReactions.includes(emoji),
                  className,
                })}
                onClick={() => onSelectEmoji(emoji)}
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};