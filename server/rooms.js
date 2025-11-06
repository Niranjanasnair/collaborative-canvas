/**
 * Room Management
 * Handles multiple drawing rooms and user management
 */

class RoomManager {
  constructor() {
    // Store rooms with their users
    // Structure: { roomId: [{ userId, color, joinedAt }] }
    this.rooms = new Map();
  }

  /**
   * Add user to a room
   * @param {string} roomId - Room identifier
   * @param {string} userId - User socket ID
   * @param {string} color - User's assigned color
   */
  addUser(roomId, userId, color) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, []);
    }

    const room = this.rooms.get(roomId);
    
    // Check if user already exists (reconnection)
    const existingUser = room.find(u => u.userId === userId);
    
    if (!existingUser) {
      room.push({
        userId,
        color,
        joinedAt: Date.now()
      });
      
      console.log(`User ${userId} joined room ${roomId}`);
    }
  }

  /**
   * Remove user from a room
   * @param {string} roomId - Room identifier
   * @param {string} userId - User socket ID
   */
  removeUser(roomId, userId) {
    if (!this.rooms.has(roomId)) {
      return;
    }

    const room = this.rooms.get(roomId);
    const index = room.findIndex(u => u.userId === userId);
    
    if (index !== -1) {
      room.splice(index, 1);
      console.log(`User ${userId} left room ${roomId}`);
    }

    // Clean up empty rooms
    if (room.length === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
  }

  /**
   * Get all users in a room
   * @param {string} roomId - Room identifier
   * @returns {Array} Array of user objects
   */
  getUsers(roomId) {
    if (!this.rooms.has(roomId)) {
      return [];
    }

    return this.rooms.get(roomId);
  }

  /**
   * Get user count in a room
   * @param {string} roomId - Room identifier
   * @returns {number} Number of users
   */
  getUserCount(roomId) {
    if (!this.rooms.has(roomId)) {
      return 0;
    }

    return this.rooms.get(roomId).length;
  }

  /**
   * Check if user exists in room
   * @param {string} roomId - Room identifier
   * @param {string} userId - User socket ID
   * @returns {boolean} True if user exists
   */
  hasUser(roomId, userId) {
    if (!this.rooms.has(roomId)) {
      return false;
    }

    const room = this.rooms.get(roomId);
    return room.some(u => u.userId === userId);
  }

  /**
   * Get all active rooms
   * @returns {Array} Array of room IDs
   */
  getAllRooms() {
    return Array.from(this.rooms.keys());
  }
}

module.exports = RoomManager;