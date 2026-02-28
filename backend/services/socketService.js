const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;
const userSockets = new Map(); // userId -> Set of socket IDs

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware - verify JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected: ${userId} (socket: ${socket.id})`);

    // Track user sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${userId} (socket: ${socket.id})`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  console.log('🔌 Socket.io initialized');
  return io;
};

// Emit event to a specific user (all their connected devices)
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit events for different actions
const socketEvents = {
  // Task events
  taskCreated: (userId, task) => emitToUser(userId, 'task:created', task),
  taskUpdated: (userId, task) => emitToUser(userId, 'task:updated', task),
  taskDeleted: (userId, taskId) => emitToUser(userId, 'task:deleted', { taskId }),
  taskCompleted: (userId, task) => emitToUser(userId, 'task:completed', task),

  // Habit events
  habitCreated: (userId, habit) => emitToUser(userId, 'habit:created', habit),
  habitUpdated: (userId, habit) => emitToUser(userId, 'habit:updated', habit),
  habitToggled: (userId, habit) => emitToUser(userId, 'habit:toggled', habit),
  habitDeleted: (userId, habitId) => emitToUser(userId, 'habit:deleted', { habitId }),

  // Notification events
  newNotification: (userId, notification) => emitToUser(userId, 'notification:new', notification),

  // AI events
  aiActionCompleted: (userId, action) => emitToUser(userId, 'ai:action', action),

  // General
  dataRefresh: (userId, entity) => emitToUser(userId, 'data:refresh', { entity }),
};

const getIO = () => io;
const isUserOnline = (userId) => userSockets.has(userId) && userSockets.get(userId).size > 0;

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  socketEvents,
  isUserOnline
};
