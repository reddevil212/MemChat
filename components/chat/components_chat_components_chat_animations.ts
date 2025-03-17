import { Variants } from 'framer-motion';

// Animation variants for messages
export const messageVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    x: 10,
    transition: {
      duration: 0.2
    }
  }
};

// Animation for reaction popover
export const reactionMenuVariants: Variants = {
  initial: { 
    scale: 0.8, 
    opacity: 0 
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "backOut"
    }
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    transition: {
      duration: 0.15
    }
  }
};

// Staggered animation for reaction emojis
export const emojiVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10
  },
  animate: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.05,
      duration: 0.2
    }
  })
};

// Animation for reply preview
export const replyPreviewVariants: Variants = {
  initial: { 
    height: 0, 
    opacity: 0 
  },
  animate: { 
    height: "auto", 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: {
      duration: 0.15
    }
  }
};