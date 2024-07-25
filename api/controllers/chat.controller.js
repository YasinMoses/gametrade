import prisma from "../lib/prisma.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    // Log the user ID for debugging
    console.log("User ID:", tokenUserId);

    // Fetch chats for the user
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
    });

    // Log the number of chats found
    console.log("Number of chats found:", chats.length);

    if (chats.length === 0) {
      return res.status(404).json({ message: "No chats found for this user." });
    }

    // Extract receiver IDs
    const receiverIds = chats.map(chat => chat.userIDs.find(id => id !== tokenUserId)).filter(id => id);

    // Log receiver IDs for debugging
    console.log("Receiver IDs:", receiverIds);

    if (receiverIds.length === 0) {
      return res.status(404).json({ message: "No receivers found." });
    }

    // Fetch receiver details in parallel
    const receivers = await prisma.user.findMany({
      where: {
        id: { in: receiverIds },
      },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });

    // Log receiver data
    console.log("Receivers data:", receivers);

    // Create a map of receiver details for quick lookup
    const receiverMap = new Map(receivers.map(receiver => [receiver.id, receiver]));

    // Add receiver details to each chat
    chats.forEach(chat => {
      const receiverId = chat.userIDs.find(id => id !== tokenUserId);
      chat.receiver = receiverMap.get(receiverId) || null;
    });

    res.status(200).json(chats);
  } catch (err) {
    // Log the full error details
    console.error("Error details:", err);
    res.status(500).json({ message: "Failed to get chats!", error: err.message });
  }
};


export const getChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    await prisma.chat.update({
      where: {
        id: req.params.id,
      },
      data: {
        seenBy: {
          push: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};

export const findChatByUserId = async (req, res) => {
  const tokenUserId = req.userId; // current user
  const userId = req.body.userId; // creator of the post
  try {
    const chat = await prisma.chat.findFirst({
      where: {
        userIDs: {
          hasSome: [tokenUserId, userId],
        },
      },
    });

    if (chat) {
      return res.status(200).json(chat);
    } else {
      // create chat if it doesn't exist
      const newChat = await prisma.chat.create({
        data: {
          userIDs: [tokenUserId, userId],
        },
      });
      res.status(200).json(newChat);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chat for the selected post!" });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, req.body.receiverId],
      },
    });
    res.status(200).json(newChat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};



export const readChat = async (req, res) => {
  const tokenUserId = req.userId;
  
  try {
    const chat = await prisma.chat.update({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      data: {
        seenBy: {
          set: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};