import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  limit,
  getDoc
} from "firebase/firestore"
import { db, storage } from "../firebase-config"
import { Chat, Message, Reaction, User } from "../types/types_chat"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

export const chatService = {
  listenToChats: (userId: string, callback: (chats: Chat[]) => void) => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageAt", "desc")
    )

    return onSnapshot(q, (snapshot) => {
      const chats: Chat[] = []
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat)
      })
      callback(chats)
    })
  },

  listenToMessages: (
    chatId: string,
    callback: (messages: Message[]) => void,
    onMessageRead?: (messageId: string) => void
  ) => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    )

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = []
      snapshot.forEach((doc) => {
        const messageData = doc.data() as Message;
        messages.push({ id: doc.id, ...messageData })

        // Mark message as read if it's from the other user and not already read
        if (onMessageRead && messageData.read === false) {
          onMessageRead(doc.id);
        }
      })
      callback(messages)
    })
  },

  sendMessage: async (chatId: string, messageData: Omit<Message, "id">) => {
    const docRef = await addDoc(collection(db, "chats", chatId, "messages"), messageData)

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: {
        text: messageData.text,
        timestamp: messageData.timestamp,
      },
      lastMessageAt: serverTimestamp(),
    })

    return docRef.id
  },

  // Send a reply message
  sendReplyMessage: async (
    chatId: string,
    messageData: Omit<Message, "id">,
    replyToMessage: Message
  ) => {
    try {
      // Create the message with reply metadata
      const replyMessage = {
        ...messageData,
        replyToId: replyToMessage.id,
        replyToText: replyToMessage.text || "Media message"
      };

      // Add the message to the chat
      const docRef = await addDoc(collection(db, "chats", chatId, "messages"), replyMessage);

      // Update the chat's last message
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: {
          text: messageData.text,
          timestamp: messageData.timestamp,
        },
        lastMessageAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error sending reply message:", error);
      throw error;
    }
  },

  uploadFile: async (file: File | Blob, chatId: string) => {
    const fileName = file instanceof File ? file.name : `blob_${Date.now()}.file`
    const storageRef = ref(storage, `chat_files/${chatId}/${Date.now()}_${fileName}`)
    const uploadTask = await uploadBytes(storageRef, file)
    return getDownloadURL(uploadTask.ref)
  },

  createOrGetChat: async (currentUserId: string, otherUserId: string) => {
    const existingChatQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUserId)
    )

    const existingChatsSnapshot = await getDocs(existingChatQuery)
    let existingChat: Chat | null = null

    existingChatsSnapshot.forEach((doc) => {
      const chatData = doc.data() as Chat
      if (chatData.participants.includes(otherUserId)) {
        existingChat = { id: doc.id, ...chatData }
      }
    })

    if (existingChat) {
      return existingChat
    }

    const newChatRef = await addDoc(collection(db, "chats"), {
      participants: [currentUserId, otherUserId],
      lastMessage: null,
      lastMessageAt: serverTimestamp(),
      unreadCount: 0,
      createdAt: serverTimestamp(),
      createdBy: currentUserId
    })

    return {
      id: newChatRef.id,
      participants: [currentUserId, otherUserId],
      lastMessage: null,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: currentUserId
    } as Chat
  },

  // Updated message action functions
  editMessage: async (
    chatId: string,
    messageId: string,
    newText: string
  ) => {
    try {
      // Get the current message
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error("Message not found");
      }

      // Update the message
      await updateDoc(messageRef, {
        text: newText,
        isEdited: true,
        editedAt: new Date().toISOString()
      });

      // Check if this is the last message in the chat
      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data() as Chat;

        // Compare message timestamps to determine if it's the last message
        if (chatData.lastMessage &&
          chatData.lastMessage.timestamp === messageDoc.data().timestamp) {
          await updateDoc(chatRef, {
            "lastMessage.text": `${newText}`,
          });
        }
      }

      return true;
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  },

  deleteMessage: async (
    chatId: string,
    messageId: string,
    isLastMessage: boolean
  ) => {
    try {
      // Get the message first to check if it has files to delete
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);

      if (messageDoc.exists()) {
        const messageData = messageDoc.data() as Message;

        // Delete any associated file from storage if it exists
        if (messageData.fileUrl) {
          try {
            // Extract the path from the URL
            const fileUrl = messageData.fileUrl;
            const fileRef = ref(storage, fileUrl);
            await deleteObject(fileRef);
          } catch (fileError) {
            console.warn("Could not delete file from storage:", fileError);
            // Continue with message deletion even if file deletion fails
          }
        }
      }

      // Delete the message from firestore
      await deleteDoc(messageRef);

      // If this was the last message, update the chat's last message
      if (isLastMessage) {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const newLastMessage = snapshot.docs[0].data() as Message;
          await updateDoc(doc(db, "chats", chatId), {
            lastMessage: {
              text: newLastMessage.text,
              timestamp: newLastMessage.timestamp,
            },
          });
        } else {
          // No messages left in the chat
          await updateDoc(doc(db, "chats", chatId), {
            lastMessage: null,
          });
        }
      }

      // Update all messages that were replying to this message
      const repliesQuery = query(
        collection(db, "chats", chatId, "messages"),
        where("replyToId", "==", messageId)
      );

      const repliesSnapshot = await getDocs(repliesQuery);

      if (!repliesSnapshot.empty) {
        // For each message that was replying to the deleted message
        const batch = repliesSnapshot.docs.map(async (replyDoc) => {
          await updateDoc(doc(db, "chats", chatId, "messages", replyDoc.id), {
            replyToText: "This message was deleted",
          });
        });

        await Promise.all(batch);
      }

      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  },

  addReaction: async (
    chatId: string,
    messageId: string,
    reaction: Reaction
  ) => {
    try {
      // First, check if the user already reacted with this emoji
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error("Message not found");
      }

      const message = messageDoc.data() as Message;
      const reactions = message.reactions || [];

      // Check if this user already reacted with this emoji
      const existingReaction = reactions.find(
        r => r.userId === reaction.userId && r.emoji === reaction.emoji
      );

      if (existingReaction) {
        // User already reacted with this emoji, so we'll remove it
        await updateDoc(messageRef, {
          reactions: arrayRemove(existingReaction)
        });
      } else {
        // User hasn't reacted with this emoji yet, so add it
        await updateDoc(messageRef, {
          reactions: arrayUnion(reaction)
        });
      }

      return true;
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  },

  removeReaction: async (
    chatId: string,
    messageId: string,
    reaction: Reaction
  ) => {
    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);

      // Check if the message exists
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error("Message not found");
      }

      // Use arrayRemove to remove the reaction
      await updateDoc(messageRef, {
        reactions: arrayRemove(reaction)
      });

      return true;
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  },

  // Simplified reaction toggle function
  toggleReaction: async (
    chatId: string,
    messageId: string,
    userId: string,
    emoji: string
  ) => {
    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error("Message not found");
      }

      const message = messageDoc.data() as Message;
      const reactions = message.reactions || [];

      // Look for an existing reaction from this user with this emoji
      const existingReactionIndex = reactions.findIndex(
        r => r.userId === userId && r.emoji === emoji
      );

      if (existingReactionIndex !== -1) {
        // User already reacted with this emoji, so remove it
        const existingReaction = reactions[existingReactionIndex];
        await updateDoc(messageRef, {
          reactions: arrayRemove(existingReaction)
        });
      } else {
        // Add the new reaction
        const newReaction: Reaction = {
          userId,
          emoji,
          timestamp: new Date().toISOString()
        };

        await updateDoc(messageRef, {
          reactions: arrayUnion(newReaction)
        });
      }

      return true;
    } catch (error) {
      console.error("Error toggling reaction:", error);
      throw error;
    }
  },

  // Get all reactions for a message
  getMessageReactions: async (
    chatId: string,
    messageId: string
  ) => {
    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error("Message not found");
      }

      const message = messageDoc.data() as Message;
      return message.reactions || [];
    } catch (error) {
      console.error("Error getting message reactions:", error);
      throw error;
    }
  },

  // Mark all messages in a chat as read
  markAllAsRead: async (
    chatId: string,
    userId: string
  ) => {
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        where("read", "==", false),
        where("senderId", "!=", userId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) return true;

      const batch = snapshot.docs.map(async (messageDoc) => {
        await updateDoc(doc(db, "chats", chatId, "messages", messageDoc.id), {
          read: true,
          readAt: new Date().toISOString()
        });
      });

      await Promise.all(batch);

      // Reset unread count in chat document
      await updateDoc(doc(db, "chats", chatId), {
        unreadCount: 0
      });

      return true;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },

  // Forward a message to another chat
  forwardMessage: async (
    sourceMessageId: string,
    sourceChatId: string,
    targetChatId: string,
    senderId: string
  ) => {
    try {
      // Get the original message
      const messageRef = doc(db, "chats", sourceChatId, "messages", sourceMessageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error("Message not found");
      }

      const originalMessage = messageDoc.data() as Message;

      // Create a new message in the target chat
      const forwardedMessage: Omit<Message, "id"> = {
        senderId: senderId,
        text: originalMessage.text,
        timestamp: new Date().toISOString(),
        read: false,
        isForwarded: true,
        fileUrl: originalMessage.fileUrl,
        fileType: originalMessage.fileType,
        fileName: originalMessage.fileName,
        duration: originalMessage.duration
      };

      // Send the forwarded message
      const newMessageId = await chatService.sendMessage(targetChatId, forwardedMessage);

      return newMessageId;
    } catch (error) {
      console.error("Error forwarding message:", error);
      throw error;
    }
  },

  // Get user presence information
  getUserPresence: async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data() as User;

      return {
        status: userData.status || "offline",
        lastSeen: userData.lastSeen || null
      };
    } catch (error) {
      console.error("Error getting user presence:", error);
      throw error;
    }
  },

  // Update user's typing status in a chat
  updateTypingStatus: async (
    chatId: string,
    userId: string,
    isTyping: boolean
  ) => {
    try {
      const chatRef = doc(db, "chats", chatId);

      if (isTyping) {
        // Add this user to the typing users array
        await updateDoc(chatRef, {
          typingUsers: arrayUnion(userId),
          [`typingTimestamps.${userId}`]: serverTimestamp()
        });
      } else {
        // Remove this user from the typing users array
        await updateDoc(chatRef, {
          typingUsers: arrayRemove(userId),
          [`typingTimestamps.${userId}`]: null
        });
      }

      return true;
    } catch (error) {
      console.error("Error updating typing status:", error);
      throw error;
    }
  },

  // Listen for typing status changes in a chat
  listenToTypingStatus: (
    chatId: string,
    callback: (typingUsers: string[]) => void
  ) => {
    const chatRef = doc(db, "chats", chatId);

    return onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const chatData = snapshot.data();
        const typingUsers = chatData.typingUsers || [];
        callback(typingUsers);
      } else {
        callback([]);
      }
    });
  },

  // Star/favorite a message
  toggleStarredMessage: async (
    chatId: string,
    messageId: string,
    userId: string
  ) => {
    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error("Message not found");
      }

      const message = messageDoc.data() as Message;
      const starredBy = message.starredBy || [];

      if (starredBy.includes(userId)) {
        // User already starred this message, so unstar it
        await updateDoc(messageRef, {
          starredBy: arrayRemove(userId)
        });
      } else {
        // Star the message
        await updateDoc(messageRef, {
          starredBy: arrayUnion(userId)
        });

        // Also add to user's starred messages collection
        const userStarredRef = doc(db, "users", userId, "starredMessages", messageId);
        await updateDoc(userStarredRef, {
          messageId,
          chatId,
          starredAt: serverTimestamp()
        }).catch(async () => {
          // If document doesn't exist yet, create it
          await addDoc(collection(db, "users", userId, "starredMessages"), {
            messageId,
            chatId,
            starredAt: serverTimestamp()
          });
        });
      }

      return true;
    } catch (error) {
      console.error("Error toggling starred message:", error);
      throw error;
    }
  },

  // Get all starred messages for a user
  getStarredMessages: async (userId: string) => {
    try {
      const starredMessagesRef = collection(db, "users", userId, "starredMessages");
      const q = query(starredMessagesRef, orderBy("starredAt", "desc"));
      const snapshot = await getDocs(q);

      const starredMessages: Array<{ messageId: string, chatId: string, message?: Message }> = [];

      // Get the actual messages
      const messagePromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const messageRef = doc(db, "chats", data.chatId, "messages", data.messageId);
        const messageDoc = await getDoc(messageRef);

        if (messageDoc.exists()) {
          return {
            messageId: data.messageId,
            chatId: data.chatId,
            message: { id: messageDoc.id, ...messageDoc.data() } as Message
          };
        } else {
          return {
            messageId: data.messageId,
            chatId: data.chatId
          };
        }
      });

      const resolvedMessages = await Promise.all(messagePromises);
      starredMessages.push(...resolvedMessages);

      return starredMessages;
    } catch (error) {
      console.error("Error getting starred messages:", error);
      throw error;
    }
  },

  // Get message by ID
  getMessageById: async (
    chatId: string,
    messageId: string
  ) => {
    try {
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error("Message not found");
      }

      return { id: messageDoc.id, ...messageDoc.data() } as Message;
    } catch (error) {
      console.error("Error getting message by ID:", error);
      throw error;
    }
  },

  // Search messages in a chat
  searchMessages: async (
    chatId: string,
    searchTerm: string
  ) => {
    try {
      // Since Firestore doesn't support full-text search natively,
      // we'll fetch all messages and filter client-side
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);

      const matchingMessages: Message[] = [];

      snapshot.forEach((doc) => {
        const message = { id: doc.id, ...doc.data() } as Message;
        if (message.text && message.text.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchingMessages.push(message);
        }
      });

      return matchingMessages;
    } catch (error) {
      console.error("Error searching messages:", error);
      throw error;
    }
  },

  // Pin a message in chat
  pinMessage: async (
    chatId: string,
    messageId: string,
    pinnedBy: string
  ) => {
    try {
      // First check if there's already a pinned message
      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        throw new Error("Chat not found");
      }

      const chatData = chatDoc.data();

      // If there's a limit to pinned messages, handle it here
      // For now, we'll allow replacing the current pinned message

      // Update the chat document with the pinned message
      await updateDoc(chatRef, {
        pinnedMessage: {
          messageId,
          pinnedAt: serverTimestamp(),
          pinnedBy
        }
      });

      // Also mark the message as pinned
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      await updateDoc(messageRef, {
        isPinned: true,
        pinnedBy,
        pinnedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error("Error pinning message:", error);
      throw error;
    }
  },

  // Unpin a message
  unpinMessage: async (
    chatId: string,
    messageId: string
  ) => {
    try {
      // Update the chat document to remove pinned message
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        pinnedMessage: null
      });

      // Update the message document
      const messageRef = doc(db, "chats", chatId, "messages", messageId);
      await updateDoc(messageRef, {
        isPinned: false,
        pinnedBy: null,
        pinnedAt: null
      });

      return true;
    } catch (error) {
      console.error("Error unpinning message:", error);
      throw error;
    }
  },

  // Get chat statistics
  getChatStatistics: async (chatId: string) => {
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const snapshot = await getDocs(messagesRef);

      let totalMessages = 0;
      let mediaMessages = 0;
      let textMessages = 0;
      let replyMessages = 0;
      const messagesBySender: Record<string, number> = {};

      snapshot.forEach((doc) => {
        const message = doc.data() as Message;
        totalMessages++;

        if (message.fileUrl) {
          mediaMessages++;
        } else {
          textMessages++;
        }

        if (message.replyToId) {
          replyMessages++;
        }

        // Count messages by sender
        if (message.senderId) {
          messagesBySender[message.senderId] = (messagesBySender[message.senderId] || 0) + 1;
        }
      });

      return {
        totalMessages,
        mediaMessages,
        textMessages,
        replyMessages,
        messagesBySender
      };
    } catch (error) {
      console.error("Error getting chat statistics:", error);
      throw error;
    }
  }
}