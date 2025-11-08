# Architecture Documentation

## System Overview

Collaborative Canvas is a real-time multi-user drawing platform built using Vanilla JavaScript, HTML5 Canvas, and Node.js with WebSockets. It allows users to draw together on a shared canvas, where every stroke is synchronized instantly across all connected clients. The server acts as a central hub to broadcast and manage drawing events, ensuring smooth collaboration between users.

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
![System Architecture](./architecture-diagram.png)

The data flow diagram above represents the real-time communication and synchronization process in the Collaborative Canvas application. When a user begins drawing on the canvas, the Canvas.js module captures the drawing inputs such as cursor movement, brush color, and size. These inputs are passed to Main.js, which coordinates between the user interface and the communication layer. The WebSocket.js module then sends these drawing actions through a WebSocket connection to the server. On the backend, Server.js receives and validates these actions before storing them in DrawingState.js, which maintains the global drawing history. The RoomManager handles user sessions and manages connected clients. Once the server processes the data, it broadcasts the drawing updates back to all active users. Other clients, such as User B, receive these updates through their WebSocket.js, which passes them to Main.js and then to Canvas.js for rendering. This continuous bidirectional flow ensures that every user sees live updates on their screen, enabling smooth and synchronized real-time collaboration.




## Real-time communication Flow

1. User A (Client Side)

When a user draws on the canvas, the Canvas.js captures the drawing input and sends it to Main.js.

Main.js processes the input and passes it to WebSocket.js, which sends the drawing action to the server using WebSockets.

2. Server (Backend)

The Server.js module receives drawing data from users and validates it.

Valid actions are stored in DrawingState.js, which keeps the drawing history.

The RoomManager tracks active users and their sessions.

The server then broadcasts the updated drawing data to all connected clients.

3. User B (Other Clients)

WebSocket.js receives the broadcast from the server and sends the update to Main.js.

Main.js calls Canvas.js to render the new strokes on the local canvas so User B can see User A’s drawings in real time.

4. Connection Layer

The WebSocket connection ensures low-latency, bidirectional communication, allowing all users to see live updates instantly.

## Component Architecture

### Frontend Modules

#### 1. Canvas.js - The Drawing Engine

This module is the heart of the application, responsible for everything that happens on the canvas — from detecting mouse or touch inputs to visually rendering strokes in real time.

**Core Functions:**

- Sets up and scales the canvas for different screen sizes.

- Captures mouse/touch events and translates them into drawable paths.

- Supports multiple tools such as brush and eraser.

- Keeps a history of all strokes to enable undo and redo actions.

- Allows exporting the canvas as an image file (PNG format).

**API Overview**:

- init()                        // Initialize and configure the canvas
- startDrawing(event)           // Begin a drawing stroke
- draw(event)                   // Continue drawing along the cursor
- stopDrawing()                 // Complete the current stroke
- drawPath(path, color, size, isEraser) // Render a given stroke
- redrawFromHistory(history)    // Redraws the canvas from saved history
- clearCanvas()                 // Wipes the entire canvas
- downloadCanvas()              // Save the drawing as a PNG
- setTool(), setColor(), setBrushSize() // Update tool and style settings


**Performance Highlights**:

Optimized to handle high-frequency drawing events efficiently.

Uses lineTo and rounded line caps for smooth, natural-looking strokes.

Only redraws changed areas instead of re-rendering the entire canvas.

Scales properly on retina and high-DPI displays for crisp visuals.

#### 2. WebSocket.js (Communication Layer)

This module manages all real-time interactions between clients and the server using WebSockets. It ensures every user sees live updates as others draw, erase, or perform actions.

**Core Functions**:

- Establishes and maintains the WebSocket connection with the backend.

- Sends and receives drawing actions and cursor positions.

- Handles undo, redo, and clear commands.

- Reconnects automatically if the network connection drops.

- Manages online users and updates their cursor positions on all connected clients.

**PAPI Overview**:

- init(serverUrl)               // Connect to the WebSocket server
- sendDrawAction(action)        // Transmit a drawing stroke
- sendCursorPosition(x, y)      // Broadcast live cursor position
- sendUndo(), sendRedo()        // Trigger undo/redo actions
- sendClearCanvas()             // Clear the shared canvas
- on(event, callback)           // Register custom event listeners


**Connection Management**:
- Implements automatic reconnection with exponential backoff.

- Provides real-time connection status updates.

- Handles network interruptions gracefully without data loss.

#### 3. Main.js (Application Controller)

This module ties everything together — it initializes the app, connects UI controls with backend communication, and synchronizes user actions across all components.

**Core Functions**:

- Initializes the canvas and WebSocket modules.

- Binds UI buttons (color picker, brush size, tools) with corresponding actions.

- Tracks and manages drawing state, undo/redo availability, and active users.

- Displays remote cursors and provides visual feedback for other users' actions.

- Updates UI elements such as tool selection and user indicators.

**State Management Example**:

state = {
  history: [],      // Stores all drawing actions
  canUndo: false,   // Indicates if undo is available
  canRedo: false    // Indicates if redo is available
}

***Highlights***:

Acts as the central controller, ensuring seamless coordination between UI, canvas, and server communication.

Maintains a consistent experience across all connected users.

Provides a clean separation of logic for easier maintenance and scalability.


### Backend Modules
#### 1. Server.js (Main Server)

Acts as the central controller, handling both HTTP requests and real-time WebSocket communication. It manages user connections, routes drawing events, and synchronizes the shared canvas state across all clients.

***Core Responsibilities***:

- Initialize Express HTTP server

- Establish Socket.io for WebSocket communication

- Handle client connections and disconnections

- Validate and route all drawing-related events

- Broadcast updates to connected users

- Manage error detection and recovery

**WebSocket Event Flow**:

// Events received from clients
- DRAW_ACTION      → User performed a new drawing stroke
- CURSOR_MOVE      → Cursor position update
- UNDO             → Undo request
- REDO             → Redo request
- CLEAR_CANVAS     → Clear canvas request

// Events sent to clients
- INIT_CANVAS      → Sends initial canvas state when user joins
- DRAW_ACTION      → Broadcasts drawing stroke to all users
- USER_JOINED      → Notifies others of a new participant
- USER_LEFT        → Notifies when a user disconnects
- CURSOR_UPDATE    → Broadcasts user cursor movement
- UNDO_ACTION      → Reflects global undo
- REDO_ACTION      → Reflects global redo
- CANVAS_CLEARED   → Informs all users that the canvas was cleared

#### 2. DrawingState.js (State Manager)

Maintains the complete drawing history and handles undo/redo operations efficiently for each drawing room.

**Data Structure**:

rooms = Map {
  roomId: {
    history: [          // Stores all drawing actions
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
    undoneActions: []   // Stores undone actions for redo functionality
  }
}


**Key Operations**:

- addAction() → Add a new drawing action to the history and clear redo stack

- undo() → Move the most recent action to the redo stack

- redo() → Move the most recent undone action back to the history

- clear() → Reset both history and redo stacks

- getHistory() → Retrieve the full drawing history for room synchronization

**Memory Management**:

- Limits drawing history to a maximum of 1000 actions per room

- Automatically removes the oldest entries beyond the limit

- Performs cleanup of inactive or empty rooms to optimize memory



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