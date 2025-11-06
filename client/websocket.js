/**
 * WebSocket Communication Module
 * Handles all WebSocket connections and real-time synchronization
 */

const WebSocketModule = (function() {
  // Private variables
  let socket = null;
  let isConnected = false;
  let userId = null;
  let userColor = null;
  let users = [];
  let remoteCursors = {};
  
  // Callbacks
  let onInitCanvas = null;
  let onDrawAction = null;
  let onUserJoined = null;
  let onUserLeft = null;
  let onCursorUpdate = null;
  let onUndoAction = null;
  let onRedoAction = null;
  let onCanvasCleared = null;
  let onConnectionChange = null;

  /**
   * Initialize WebSocket connection
   * @param {string} serverUrl - WebSocket server URL
   */
  function init(serverUrl = 'http://localhost:3001') {
    console.log('🔌 Connecting to WebSocket server...');
    
    // Create socket connection
    socket = io(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    // Setup event listeners
    setupSocketListeners();
  }

  /**
   * Setup all socket event listeners
   */
  function setupSocketListeners() {
    // Connection established
    socket.on('connect', () => {
      console.log('Connected to server');
      isConnected = true;
      
      if (onConnectionChange) {
        onConnectionChange(true);
      }
    });

    // Connection lost
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      isConnected = false;
      
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    });

    // Initial canvas state received
    socket.on('INIT_CANVAS', (data) => {
      console.log('Received initial canvas state');
      userId = data.userId;
      userColor = data.userColor;
      users = data.users;
      
      if (onInitCanvas) {
        onInitCanvas(data);
      }
    });

    // Drawing action from another user
    socket.on('DRAW_ACTION', (action) => {
      console.log('Received draw action from', action.userId);
      
      if (onDrawAction) {
        onDrawAction(action);
      }
    });

    // User joined the room
    socket.on('USER_JOINED', (data) => {
      console.log('User joined:', data.userId);
      users = data.users;
      
      if (onUserJoined) {
        onUserJoined(data);
      }
    });

    // User left the room
    socket.on('USER_LEFT', (data) => {
      console.log('User left:', data.userId);
      users = data.users;
      
      // Remove cursor
      delete remoteCursors[data.userId];
      
      if (onUserLeft) {
        onUserLeft(data);
      }
    });

    // Cursor position update from another user
    socket.on('CURSOR_UPDATE', (data) => {
      remoteCursors[data.userId] = {
        x: data.x,
        y: data.y,
        color: data.color,
        timestamp: Date.now()
      };
      
      if (onCursorUpdate) {
        onCursorUpdate(remoteCursors);
      }
    });

    // Undo action performed
    socket.on('UNDO_ACTION', (data) => {
      console.log('Undo action received');
      
      if (onUndoAction) {
        onUndoAction(data.history);
      }
    });

    // Redo action performed
    socket.on('REDO_ACTION', (data) => {
      console.log('Redo action received');
      
      if (onRedoAction) {
        onRedoAction(data.history);
      }
    });

    // Canvas cleared
    socket.on('CANVAS_CLEARED', () => {
      console.log('Canvas cleared');
      
      if (onCanvasCleared) {
        onCanvasCleared();
      }
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Reconnection attempt
    socket.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect...');
    });

    // Reconnected successfully
    socket.on('reconnect', () => {
      console.log('Reconnected successfully');
    });
  }

  /**
   * Send drawing action to server
   * @param {Object} action - Drawing action data
   */
  function sendDrawAction(action) {
    if (!isConnected || !socket) {
      console.error('Cannot send draw action: not connected');
      return;
    }

    socket.emit('DRAW_ACTION', action);
  }

  /**
   * Send cursor position to server
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  function sendCursorPosition(x, y) {
    if (!isConnected || !socket) {
      return;
    }

    socket.emit('CURSOR_MOVE', { x, y });
  }

  /**
   * Send undo request to server
   */
  function sendUndo() {
    if (!isConnected || !socket) {
      console.error('Cannot send undo: not connected');
      return;
    }

    socket.emit('UNDO');
  }

  /**
   * Send redo request to server
   */
  function sendRedo() {
    if (!isConnected || !socket) {
      console.error('Cannot send redo: not connected');
      return;
    }

    socket.emit('REDO');
  }

  /**
   * Send clear canvas request to server
   */
  function sendClearCanvas() {
    if (!isConnected || !socket) {
      console.error('Cannot send clear: not connected');
      return;
    }

    socket.emit('CLEAR_CANVAS');
  }

  /**
   * Set callback for canvas initialization
   * @param {Function} callback - Callback function
   */
  function setOnInitCanvas(callback) {
    onInitCanvas = callback;
  }

  /**
   * Set callback for draw actions
   * @param {Function} callback - Callback function
   */
  function setOnDrawAction(callback) {
    onDrawAction = callback;
  }

  /**
   * Set callback for user joined
   * @param {Function} callback - Callback function
   */
  function setOnUserJoined(callback) {
    onUserJoined = callback;
  }

  /**
   * Set callback for user left
   * @param {Function} callback - Callback function
   */
  function setOnUserLeft(callback) {
    onUserLeft = callback;
  }

  /**
   * Set callback for cursor updates
   * @param {Function} callback - Callback function
   */
  function setOnCursorUpdate(callback) {
    onCursorUpdate = callback;
  }

  /**
   * Set callback for undo actions
   * @param {Function} callback - Callback function
   */
  function setOnUndoAction(callback) {
    onUndoAction = callback;
  }

  /**
   * Set callback for redo actions
   * @param {Function} callback - Callback function
   */
  function setOnRedoAction(callback) {
    onRedoAction = callback;
  }

  /**
   * Set callback for canvas cleared
   * @param {Function} callback - Callback function
   */
  function setOnCanvasCleared(callback) {
    onCanvasCleared = callback;
  }

  /**
   * Set callback for connection change
   * @param {Function} callback - Callback function
   */
  function setOnConnectionChange(callback) {
    onConnectionChange = callback;
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected
   */
  function getIsConnected() {
    return isConnected;
  }

  /**
   * Get current user ID
   * @returns {string} User ID
   */
  function getUserId() {
    return userId;
  }

  /**
   * Get current user color
   * @returns {string} User color
   */
  function getUserColor() {
    return userColor;
  }

  /**
   * Get all users
   * @returns {Array} Array of users
   */
  function getUsers() {
    return users;
  }

  /**
   * Get remote cursors
   * @returns {Object} Remote cursors object
   */
  function getRemoteCursors() {
    return remoteCursors;
  }

  // Public API
  return {
    init,
    sendDrawAction,
    sendCursorPosition,
    sendUndo,
    sendRedo,
    sendClearCanvas,
    setOnInitCanvas,
    setOnDrawAction,
    setOnUserJoined,
    setOnUserLeft,
    setOnCursorUpdate,
    setOnUndoAction,
    setOnRedoAction,
    setOnCanvasCleared,
    setOnConnectionChange,
    getIsConnected,
    getUserId,
    getUserColor,
    getUsers,
    getRemoteCursors
  };
})();