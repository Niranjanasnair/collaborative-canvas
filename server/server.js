

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


app.use(express.static(path.join(__dirname, '../client')));


const roomManager = new RoomManager();
const drawingState = new DrawingState();


io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  
  const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
  
  
  const roomId = 'default';
  socket.join(roomId);
  roomManager.addUser(roomId, socket.id, userColor);


  socket.emit('INIT_CANVAS', {
    history: drawingState.getHistory(roomId),
    users: roomManager.getUsers(roomId),
    userId: socket.id,
    userColor: userColor
  });


  socket.to(roomId).emit('USER_JOINED', {
    userId: socket.id,
    color: userColor,
    users: roomManager.getUsers(roomId)
  });

  
  socket.on('DRAW_ACTION', (data) => {
    try {
      if (!data || !data.path || !Array.isArray(data.path)) {
        console.error('Invalid drawing data received');
        return;
      }

      const action = {
        ...data,
        userId: socket.id,
        timestamp: Date.now()
      };

      
      if (data.finalized) {
        
        drawingState.addAction(roomId, action);
        io.to(roomId).emit('DRAW_ACTION', action);
      } else {
        
        socket.to(roomId).emit('DRAW_ACTION', action);
      }

    } catch (error) {
      console.error('Error handling DRAW_ACTION:', error);
    }
  });

  
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

  
  socket.on('UNDO', () => {
    try {
      const success = drawingState.undo(roomId);
      if (success) {
        io.to(roomId).emit('UNDO_ACTION', {
          history: drawingState.getHistory(roomId)
        });
      }
    } catch (error) {
      console.error('Error handling UNDO:', error);
    }
  });

  
  socket.on('REDO', () => {
  try {
    const room = roomId;
    const roomData = drawingState.rooms.get(room);

    if (!roomData || roomData.undoneActions.length === 0) {
      return;
    }

    
    const actionToRedo = roomData.undoneActions[roomData.undoneActions.length - 1];

    
    const success = drawingState.redo(room);

    if (success) {
      
      io.to(room).emit('DRAW_ACTION', actionToRedo);

      
      io.to(room).emit('REDO_ACTION', {
        history: drawingState.getHistory(room)
      });
    }
  } catch (error) {
    console.error('Error handling REDO:', error);
  }
});


  
  socket.on('CLEAR_CANVAS', () => {
    try {
      drawingState.clear(roomId);
      io.to(roomId).emit('CANVAS_CLEARED');
    } catch (error) {
      console.error('Error handling CLEAR_CANVAS:', error);
    }
  });

  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    roomManager.removeUser(roomId, socket.id);
    socket.to(roomId).emit('USER_LEFT', {
      userId: socket.id,
      users: roomManager.getUsers(roomId)
    });
  });

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

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
