/**
 * Main WebSocket Server
 * Handles client connections, drawing events, and real-time synchronization
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const RoomManager = require('./rooms');
const DrawingState = require('./drawing-state');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Initialize managers
const roomManager = new RoomManager();
const drawingState = new DrawingState();

/**
 * Socket.io connection handler
 * Manages user connections, drawing events, and synchronization
 */
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Generate random color for user
  const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  
  // Add user to default room
  const roomId = 'default';
  socket.join(roomId);
  roomManager.addUser(roomId, socket.id, userColor);

  // Send current canvas state to newly connected user
  socket.emit('INIT_CANVAS', {
    history: drawingState.getHistory(roomId),
    users: roomManager.getUsers(roomId),
    userId: socket.id,
    userColor: userColor
  });

  // Broadcast new user to others in room
  socket.to(roomId).emit('USER_JOINED', {
    userId: socket.id,
    color: userColor,
    users: roomManager.getUsers(roomId)
  });

  /**
   * Handle drawing action from client
   * Validates, stores, and broadcasts to other users
   */
  socket.on('DRAW_ACTION', (data) => {
    try {
      // Validate drawing data
      if (!data || !data.path || !Array.isArray(data.path)) {
        console.error('Invalid drawing data received');
        return;
      }

      // Add action to drawing history
      const action = {
        ...data,
        userId: socket.id,
        timestamp: Date.now()
      };
      
      drawingState.addAction(roomId, action);

      // Broadcast to all other users in room
      socket.to(roomId).emit('DRAW_ACTION', action);
      
    } catch (error) {
      console.error('Error handling DRAW_ACTION:', error);
    }
  });

  /**
   * Handle cursor movement
   * Broadcasts cursor position to other users for real-time indicators
   */
  socket.on('CURSOR_MOVE', (data) => {
    try {
      socket.to(roomId).emit('CURSOR_UPDATE', {
        userId: socket.id,
        x: data.x,
        y: data.y,
        color: userColor
      });
    } catch (error) {
      console.error('Error handling CURSOR_MOVE:', error);
    }
  });

  /**
   * Handle global undo operation
   * Removes last action from history and broadcasts to all users
   */
  socket.on('UNDO', () => {
    try {
      const success = drawingState.undo(roomId);
      
      if (success) {
        // Broadcast undo to all users including sender
        io.to(roomId).emit('UNDO_ACTION', {
          history: drawingState.getHistory(roomId)
        });
      }
    } catch (error) {
      console.error('Error handling UNDO:', error);
    }
  });

  /**
   * Handle global redo operation
   * Restores previously undone action and broadcasts to all users
   */
  socket.on('REDO', () => {
    try {
      const success = drawingState.redo(roomId);
      
      if (success) {
        // Broadcast redo to all users including sender
        io.to(roomId).emit('REDO_ACTION', {
          history: drawingState.getHistory(roomId)
        });
      }
    } catch (error) {
      console.error('Error handling REDO:', error);
    }
  });

  /**
   * Handle clear canvas request
   * Clears all drawing history and broadcasts to all users
   */
  socket.on('CLEAR_CANVAS', () => {
    try {
      drawingState.clear(roomId);
      
      // Broadcast clear to all users including sender
      io.to(roomId).emit('CANVAS_CLEARED');
    } catch (error) {
      console.error('Error handling CLEAR_CANVAS:', error);
    }
  });

  /**
   * Handle user disconnect
   * Removes user from room and broadcasts to remaining users
   */
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    roomManager.removeUser(roomId, socket.id);
    
    // Notify other users
    socket.to(roomId).emit('USER_LEFT', {
      userId: socket.id,
      users: roomManager.getUsers(roomId)
    });
  });

  /**
   * Error handler for socket errors
   */
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

/**
 * Start server
 */
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  Collaborative Canvas Server Running               ║
║                                                    ║
║  Server: http://localhost:${PORT}                  ║
║  WebSocket: Ready                                  ║
║  Client: Serving static files                      ║
║                                                    ║
║  Ready for connections!                            ║
╚════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});