# Architecture Documentation

## System Overview

This is a real-time collaborative drawing application built with **Vanilla JavaScript** on the frontend and **Node.js + Socket.io** on the backend. The architecture follows a client-server model with WebSocket-based bidirectional communication.

## Technology Stack

### Frontend
- **Pure JavaScript** (ES6+)
- **HTML5 Canvas API** for drawing
- **Socket.io Client** for WebSocket communication
- **CSS3** with modern features (gradients, glassmorphism, animations)

### Backend
- **Node.js** (v14+)
- **Express.js** for HTTP server
- **Socket.io** for WebSocket communication
- **In-memory storage** for drawing state

## Data Flow Diagram

┌─────────────────────────────────────────────────────────────┐
│                        User A (Browser)                     │
│  ┌──────────┐    ┌──────────┐    ┌─────────────┐            │
│  │ Canvas.js│───▶│ Main.js  │───▶│WebSocket.js │           │
│  └──────────┘    └──────────┘    └──────┬──────┘            │
│       │                                   │                 │
│       │ Draw Event                        │ Emit Action     │
│       ▼                                   ▼                 │
└───────────────────────────────────────────│─────────────────┘
│
│ WebSocket
│ Connection
▼
┌────────────────────────────────────────────────────────────┐
│                     Server (Node.js)                       │
│  ┌──────────┐    ┌───────────────┐    ┌────────────────┐   │
│  │Server.js │───▶│DrawingState.js│───▶│  RoomManager  │   │
│  └────┬─────┘    └───────────────┘    └────────────────┘   │
│       │                   │                                │
│       │ Receive Action    │ Store History                  │
│       │                   │                                │
│       │ Validate          │ Manage State                   │
│       ▼                   ▼                                │
│  ┌─────────────────────────────┐                           │
│  │  Broadcast to All Clients   │                           │
│  └──────────┬──────────────────┘                           │
└─────────────│──────────────────────────────────────────────┘
│
│ Broadcast
▼
┌────────────────────────────────────────────────────────────┐
│                        User B (Browser)                    │
│  ┌─────────────┐    ┌──────────┐    ┌──────────┐           │
│  │WebSocket.js │───▶│ Main.js  │───▶│Canvas.js│           │
│  └─────────────┘    └──────────┘    └──────────┘           │
│                                           │                │
│                                           │ Render         │
│                                           ▼                │
│                                      [Canvas Display]      │
└────────────────────────────────────────────────────────────┘

## Component Architecture

### Frontend Modules

#### 1. Canvas.js (Drawing Engine)
**Purpose**: Handles all canvas operations and drawing logic

**Key Responsibilities**:
- Canvas initialization and sizing
- Mouse/touch event handling
- Path tracking and rendering
- Drawing tools (brush, eraser)
- History replay for undo/redo
- Canvas export

**Public API**:
```javascript
- init()                    // Initialize canvas
- startDrawing(event)       // Begin drawing path
- draw(event)               // Continue drawing path
- stopDrawing()             // End drawing path
- drawPath(path, color, size, isEraser)  // Render complete path
- redrawFromHistory(history)  // Redraw from action history
- clearCanvas()             // Clear entire canvas
- downloadCanvas()          // Export as PNG
- setTool/setColor/setBrushSize()  // Update drawing settings
```

**Performance Optimizations**:
- Canvas scaled for retina displays
- Efficient path rendering with `lineTo`
- Minimal redraws (only necessary areas)
- Smooth lines with `lineCap: 'round'`

#### 2. WebSocket.js (Communication Layer)
**Purpose**: Manages all WebSocket communication with server

**Key Responsibilities**:
- Socket.io connection management
- Event emission to server
- Event reception from server
- Reconnection handling
- Cursor position broadcasting
- User state management

**Public API**:
```javascript
- init(serverUrl)           // Connect to server
- sendDrawAction(action)    // Send drawing data
- sendCursorPosition(x, y)  // Broadcast cursor
- sendUndo/sendRedo()       // Request undo/redo
- sendClearCanvas()         // Request clear
- set callbacks for all events  // Register handlers
```

**Connection Management**:
- Automatic reconnection with exponential backoff
- Connection status callbacks
- Graceful degradation on disconnect

#### 3. Main.js (Application Controller)
**Purpose**: Orchestrates all modules and handles UI interactions

**Key Responsibilities**:
- Module initialization
- UI event binding
- State management
- User list updates
- Remote cursor rendering
- Notification system

**State Management**:
```javascript
state = {
  history: [],      // All drawing actions
  canUndo: false,   // Undo availability
  canRedo: false    // Redo availability
}
```

### Backend Modules

#### 1. Server.js (Main Server)
**Purpose**: HTTP server and WebSocket event handler

**Key Responsibilities**:
- Express server setup
- Socket.io initialization
- Client connection handling
- Event routing and validation
- Broadcasting to clients
- Error handling

**WebSocket Events**:
```javascript
// Incoming from clients
- DRAW_ACTION     // New drawing stroke
- CURSOR_MOVE     // Cursor position update
- UNDO            // Undo request
- REDO            // Redo request
- CLEAR_CANVAS    // Clear request

// Outgoing to clients
- INIT_CANVAS     // Initial state on connect
- DRAW_ACTION     // Broadcast drawing
- USER_JOINED     // New user notification
- USER_LEFT       // User disconnect notification
- CURSOR_UPDATE   // Cursor position broadcast
- UNDO_ACTION     // Undo performed
- REDO_ACTION     // Redo performed
- CANVAS_CLEARED  // Canvas cleared
```

#### 2. Drawing-State.js (State Manager)
**Purpose**: Manages drawing history and undo/redo operations

**Data Structures**:
```javascript
rooms = Map {
  roomId: {
    history: [         // Drawing actions
      {
        tool: 'brush',
        path: [{x, y}, ...],
        color: '#hex',
        size: number,
        userId: string,
        timestamp: number
      },
      ...
    ],
    undoneActions: []  // For redo functionality
  }
}
```

**Key Operations**:
- `addAction()`: Append to history, clear redo stack
- `undo()`: Pop from history, push to redo stack
- `redo()`: Pop from redo stack, push to history
- `clear()`: Empty both stacks
- `getHistory()`: Return complete history

**Memory Management**:
- History limited to MAX_HISTORY_SIZE (1000 actions)
- Oldest actions removed when limit reached
- Empty rooms cleaned up automatically

#### 3. Rooms.js (Room Manager)
**Purpose**: Manages multiple drawing rooms and users

**Data Structures**:
```javascript
rooms = Map {
  roomId: [
    {
      userId: string,
      color: string,
      joinedAt: timestamp
    },
    ...
  ]
}
```

**Key Operations**:
- `addUser()`: Add user to room
- `removeUser()`: Remove user, cleanup empty rooms
- `getUsers()`: Get all users in room
- `getUserCount()`: Count users in room

## WebSocket Protocol

### Message Format

All messages follow Socket.io event format with type and data payload.

### Client → Server Messages

#### DRAW_ACTION
```javascript
{
  tool: 'brush' | 'eraser',
  path: [{ x: number, y: number }, ...],
  color: string,      // hex color
  size: number,       // brush size
  timestamp: number   // client timestamp
}
```

#### CURSOR_MOVE
```javascript
{
  x: number,
  y: number
}
```

#### UNDO / REDO / CLEAR_CANVAS
```javascript
// No payload required
```

### Server → Client Messages

#### INIT_CANVAS
```javascript
{
  history: DrawingAction[],
  users: User[],
  userId: string,
  userColor: string
}
```

#### DRAW_ACTION
```javascript
{
  ...clientAction,
  userId: string      // Added by server
}
```

#### USER_JOINED / USER_LEFT
```javascript
{
  userId: string,
  color: string,      // Only for USER_JOINED
  users: User[]
}
```

#### CURSOR_UPDATE
```javascript
{
  userId: string,
  x: number,
  y: number,
  color: string
}
```

#### UNDO_ACTION / REDO_ACTION
```javascript
{
  history: DrawingAction[]
}
```

#### CANVAS_CLEARED
```javascript
// No payload
```

## Undo/Redo Strategy

### Global Undo/Redo Approach

**Design Decision**: Single shared history for all users

**Rationale**:
- Simplicity: Easy to implement and understand
- Consistency: All users see same state
- Predictability: Clear what undo will do
- Collaboration: Encourages teamwork

**Implementation**:

1. **Server-Side History**
   - Single array stores all actions in order
   - Each action tagged with userId and timestamp
   - History is source of truth

2. **Undo Operation**
```javascript
   1. Pop last action from history
   2. Store in undoneActions array
   3. Broadcast updated history to all clients
   4. All clients redraw from history
```

3. **Redo Operation**
```javascript
   1. Pop last undone action
   2. Push back to history
   3. Broadcast updated history
   4. All clients redraw
```

4. **New Action Clears Redo Stack**
```javascript
   When new drawing added:
   1. Append to history
   2. Clear undoneActions array
   3. Broadcast to other clients
```

**Trade-offs**:

Pros:
- Simple implementation
- Consistent across all users
- No complex conflict resolution
- Easy to reason about

Cons:
- Can undo other users' work
- No per-user undo stacks
- May frustrate users in large groups

**Alternative Considered**: Per-User Undo

Would require:
- Operational Transform (OT) or CRDTs
- Complex conflict resolution
- More server-side logic
- Potentially confusing UX

Rejected due to complexity for this prototype.

## Performance Decisions

### 1. Canvas Rendering Optimization

**Decision**: Incremental drawing with path optimization

**Implementation**:
```javascript
// Draw only new segments, not entire path
for (let i = lastIndex; i < path.length; i++) {
  ctx.lineTo(path[i].x, path[i].y);
}
ctx.stroke();
```

**Benefit**: 60 FPS drawing even with long paths

### 2. Cursor Position Throttling

**Decision**: Throttle cursor updates to 50ms

**Implementation**:
```javascript
let lastUpdate = 0;
const throttleMs = 50;

canvas.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastUpdate < throttleMs) return;
  lastUpdate = now;
  sendCursorPosition(x, y);
});
```

**Benefit**: Reduces network traffic by 95%

### 3. History Limit

**Decision**: Cap history at 1000 actions

**Rationale**:
- Prevents memory bloat
- 1000 actions ≈ 5-10 minutes of active drawing
- Acceptable for most use cases

**Implementation**:
```javascript
if (room.history.length > MAX_HISTORY_SIZE) {
  room.history.shift(); // Remove oldest
}
```

### 4. Stale Cursor Cleanup

**Decision**: Remove cursors older than 2 seconds

**Implementation**:
```javascript
if (Date.now() - cursor.timestamp > 2000) {
  delete remoteCursors[userId];
}
```

**Benefit**: Prevents ghost cursors on disconnect

### 5. Canvas Scaling for Retina

**Decision**: Scale canvas for high-DPI displays

**Implementation**:
```javascript
const scale = window.devicePixelRatio || 1;
canvas.width = displayWidth * scale;
canvas.height = displayHeight * scale;
ctx.scale(scale, scale);
```

**Benefit**: Crisp rendering on retina displays

## Conflict Resolution

### Strategy: Last-Write-Wins (LWW)

**How It Works**:

1. **No Locking**: Users can draw simultaneously
2. **Timestamps**: Each action has client timestamp
3. **Server Order**: Actions processed in arrival order
4. **Broadcast**: All clients receive all actions

**Conflict Scenarios**:

#### Scenario 1: Overlapping Strokes
User A draws red line
User B draws blue line (overlaps)
Result: Both lines visible, B's appears on top

**Resolution**: Natural layering, last action on top

#### Scenario 2: Simultaneous Undo
User A clicks undo
User B clicks undo (simultaneously)
Result: Last two actions removed

**Resolution**: Server processes sequentially

#### Scenario 3: Draw While Undo
User A draws new stroke
User B clicks undo (removes A's stroke)
Result: A's stroke disappears

**Resolution**: Global undo affects all users

### Why LWW?

**Advantages**:
- Simple to implement
- No complex algorithms
- Predictable behavior
- Low server overhead

**Disadvantages**:
- Possible data loss (rare)
- No conflict detection
- No intent preservation

### Alternative Strategies (Not Implemented)

#### 1. Operational Transform (OT)
- Transform operations based on context
- Preserve user intent
- Complex implementation

#### 2. CRDT (Conflict-free Replicated Data Types)
- Automatically resolve conflicts
- Commutative operations
- Requires special data structures

#### 3. Vector Clocks
- Track causality
- Detect concurrent operations
- More metadata overhead

**Decision**: LWW chosen for simplicity and acceptability for drawing app

## Error Handling

### Client-Side

**Network Errors**:
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Show reconnecting status
});
```

**Drawing Errors**:
```javascript
try {
  ctx.stroke();
} catch (error) {
  console.error('Canvas error:', error);
  // Graceful degradation
}
```

### Server-Side

**Invalid Data**:
```javascript
if (!data || !data.path || !Array.isArray(data.path)) {
  console.error('Invalid drawing data');
  return; // Ignore bad data
}
```

**Socket Errors**:
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Log and continue
});
```

## Security Considerations

### Current Implementation

**Validation**:
- Check data types before processing
- Validate array structures
- Sanitize user inputs (colors, sizes)

**Rate Limiting**: Not implemented (trust-based)

**Authentication**: None (anonymous users)

### Production Recommendations

1. **Add Rate Limiting**
```javascript
   // Limit actions per user per second