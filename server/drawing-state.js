

class DrawingState {
  constructor() {
    // Store drawing history per room
    // Structure: { roomId: { history: [], undoneActions: [] } }
    this.rooms = new Map();
    
    
    this.MAX_HISTORY_SIZE = 1000;
  }

  /**
   * Initialize room if it doesn't exist
   * @param {string} roomId - Room identifier
   */
  _initRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        history: [],
        undoneActions: []
      });
    }
  }

  /**
   * Add drawing action to history
   * @param {string} roomId - Room identifier
   * @param {Object} action - Drawing action object
   */
  addAction(roomId, action) {
    this._initRoom(roomId);
    
    const room = this.rooms.get(roomId);
    
    // Add to history
    room.history.push(action);
    
    // Clear undo stack when new action is added
    room.undoneActions = [];
    
    // Limit history size
    if (room.history.length > this.MAX_HISTORY_SIZE) {
      room.history.shift(); // Remove oldest action
    }
    
    console.log(`Action added to room ${roomId}. History size: ${room.history.length}`);
  }

  /**
   * Get complete drawing history for a room
   * @param {string} roomId - Room identifier
   * @returns {Array} Array of drawing actions
   */
  getHistory(roomId) {
    this._initRoom(roomId);
    return this.rooms.get(roomId).history;
  }

  /**
   * Undo last action (global undo)
   * @param {string} roomId - Room identifier
   * @returns {boolean} True if undo was successful
   */
  undo(roomId) {
    this._initRoom(roomId);
    
    const room = this.rooms.get(roomId);
    
    if (room.history.length === 0) {
      return false;
    }
    
    // Pop last action from history
    const lastAction = room.history.pop();
    
    // Store in undone actions for redo
    room.undoneActions.push(lastAction);
    
    console.log(`Undo in room ${roomId}. History size: ${room.history.length}`);
    return true;
  }

  /**
   * Redo last undone action
   * @param {string} roomId - Room identifier
   * @returns {boolean} True if redo was successful
   */
  redo(roomId) {
    this._initRoom(roomId);
    
    const room = this.rooms.get(roomId);
    
    if (room.undoneActions.length === 0) {
      return false;
    }
    
    // Pop from undone actions
    const actionToRedo = room.undoneActions.pop();
    
    // Add back to history
    room.history.push(actionToRedo);
    
    console.log(`Redo in room ${roomId}. History size: ${room.history.length}`);
    return true;
  }

  /**
   * Clear all drawing history
   * @param {string} roomId - Room identifier
   */
  clear(roomId) {
    this._initRoom(roomId);
    
    const room = this.rooms.get(roomId);
    room.history = [];
    room.undoneActions = [];
    
    console.log(`Canvas cleared in room ${roomId}`);
  }

  /**
   * Get number of actions in history
   * @param {string} roomId - Room identifier
   * @returns {number} History length
   */
  getHistoryLength(roomId) {
    this._initRoom(roomId);
    return this.rooms.get(roomId).history.length;
  }

  /**
   * Check if undo is available
   * @param {string} roomId - Room identifier
   * @returns {boolean} True if undo is available
   */
  canUndo(roomId) {
    this._initRoom(roomId);
    return this.rooms.get(roomId).history.length > 0;
  }

  /**
   * Check if redo is available
   * @param {string} roomId - Room identifier
   * @returns {boolean} True if redo is available
   */
  canRedo(roomId) {
    this._initRoom(roomId);
    return this.rooms.get(roomId).undoneActions.length > 0;
  }

  /**
   * Delete room data (cleanup)
   * @param {string} roomId - Room identifier
   */
  deleteRoom(roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.delete(roomId);
      console.log(`Drawing state deleted for room ${roomId}`);
    }
  }
}

module.exports = DrawingState;