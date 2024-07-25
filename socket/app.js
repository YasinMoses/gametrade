import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: "http://localhost:5173",
  },
});

let onlineUsers = [];

const addUser = (userId, socketId) => {
  const userExists = onlineUsers.find((user) => user.userId === userId);
  if (!userExists) {
    onlineUsers.push({ userId, socketId });
  }
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log('A user connected:', socket.id);

  // When a new user connects
  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
    console.log('User added:', userId);
  });

  // When a user sends a message
  socket.on("sendMessage", ({ receiverId, data }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", data);
    } else {
      console.log('User not found:', receiverId);
    }
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log('A user disconnected:', socket.id);
    removeUser(socket.id);
  });
});

io.listen(4000, () => {
  console.log('Socket server is running on port 4000');
});
