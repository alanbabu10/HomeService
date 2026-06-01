const { Server } = require("socket.io");

let io;
const userSockets = new Map(); // userId -> socketId
const employeeSockets = new Map(); // employeeId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register user or handyman
    socket.on("register", (data) => {
      const { id, role } = data;
      if (!id) return;
      
      if (role === "employee" || role === "handyman") {
        employeeSockets.set(id, socket.id);
        console.log(`Registered handyman: ${id} with socket ${socket.id}`);
      } else {
        userSockets.set(id, socket.id);
        console.log(`Registered user: ${id} with socket ${socket.id}`);
      }
      
      socket.userId = id;
      socket.userRole = role;
    });

    // Handle handyman live location tracking
    socket.on("updateLocation", (data) => {
      const { handymanId, coordinates } = data; // coordinates: [lng, lat]
      if (!handymanId || !coordinates) return;

      // Broadcast this location update to any user listening to this handyman tracking
      socket.broadcast.emit(`locationUpdate_${handymanId}`, { coordinates });
      console.log(`Handyman ${handymanId} updated location to:`, coordinates);
    });

    // Handle private chat messaging
    socket.on("sendMessage", (data) => {
      const { senderId, receiverId, message, senderRole } = data;
      if (!senderId || !receiverId || !message) return;

      const receiverSocketId = senderRole === "employee" 
        ? userSockets.get(receiverId) 
        : employeeSockets.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", {
          senderId,
          message,
          timestamp: new Date(),
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.userId) {
        if (socket.userRole === "employee" || socket.userRole === "handyman") {
          employeeSockets.delete(socket.userId);
        } else {
          userSockets.delete(socket.userId);
        }
      }
    });
  });

  return io;
};

const sendRealtimeNotification = (recipientId, role, eventName, payload) => {
  if (!io) return;
  const targetSocketId = role === "employee" || role === "handyman"
    ? employeeSockets.get(recipientId)
    : userSockets.get(recipientId);

  if (targetSocketId) {
    io.to(targetSocketId).emit(eventName, payload);
    return true;
  }
  return false;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO, sendRealtimeNotification };
