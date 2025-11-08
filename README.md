# Collaborative Canvas

A real-time collaborative drawing platform built entirely with Vanilla JavaScript and Node.js (WebSockets), designed to bring creativity and teamwork together on a shared digital canvas.
Multiple users can sketch, erase, and experiment simultaneously every stroke appears instantly across all connected screens, creating a seamless, interactive, and synchronized drawing experience.

## Live Demo
You can try the project online here: [Collaborative Canvas Demo](https://collaborative-canvas-c6ht.onrender.com)


## Features

- Real-time drawing with instant stroke updates
- Brush and eraser tools with adjustable size
- Color picker with preset and custom color options
- Undo and Redo functionality
- Clear and Save options for the canvas
- User name display near each cursor
- Responsive and minimal interface

### Core Functionality
- **Real-time Drawing**: See other users' strokes as they draw them
- **Multiple Tools**: Brush and eraser with adjustable sizes (1-50px)
- **Color Palette**: 12 preset colors + custom color picker
- **Global Undo/Redo**: Affects all users simultaneously
- **User Presence**: See who's online with color-coded avatars
- **Remote Cursors**: View other users' cursor positions in real-time
- **Canvas Persistence**: Drawing history maintained by server
- **Mobile Support**: Touch-enabled for tablets and phones
- **Download**: Save canvas as PNG image

### Technical Highlights

- Pure Vanilla JavaScript (no frameworks)
- WebSocket-based real-time communication
- Efficient canvas rendering with path optimization
- Conflict resolution with last-write-wins strategy
- Responsive design with modern UI
- Error handling and reconnection logic

## How to Run

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone or download the repository**
```bash
   git clone <repo-url>
  

2. **Navigate to project directory**
```bash
cd collaborative-canvas
```

3. **Install dependencies**
```bash
npm install
```

4. **Start the server**
```bash
npm start
```

5. **Open the app in your browser**

(http://localhost:3001)

The server will start and automatically serve the client files.

## Testing with Multiple Users
To test realtime drawing, open the same link in another tab or device.

### Local Testing

1. **Start the server**
```bash
npm start
```

2. **Open multiple browser tabs/windows**
   - Tab 1: `http://localhost:3001`
   - Tab 2: `http://localhost:3001` (new tab)
   - Tab 3: `http://localhost:3001` (incognito/private window)

3. **Test collaborative features**

   - Draw in one tab → see strokes appear live in others
   - Try different colors and brush sizes
   - Each user has unique color indicator
   - Test undo/redo and see that affects all users globally
   - Clear canvas and see everyone’s canvas simultaneously

### Network Testing

1. **Find your local IP address**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. **Access from other devices**
   - `http://YOUR_IP:3001`
   - Example: `http://192.168.1.100:3001`

3. **Test across devices**
   - Desktop + Laptop
   - Desktop + Mobile
   - Multiple mobile devices

## How It Works

- Each drawing action (start, move, end) is captured on the client.

- The path data is sent via WebSocket to the server.

- The server broadcasts it to all connected clients.

- Clients render it live on their own canvases.

- Undo/Redo operations are synced through server-managed history.

- This ensures everyone always sees the same canvas state in real-time.

### Folder Structure

```text COLLABORATIVE-CANVAS/ ├── client/ │ ├── canvas.js │ ├── index.html │ ├── main.js │ ├── style.css │ └── websocket.js ├── node_modules/ ├── server/ │ ├── drawing-state.js │ ├── rooms.js │ └── server.js ├── ARCHITECTURE.md ├── README.md ├── package.json └── package-lock.json ```


### Data Flow

1. When a user starts drawing, the client continuously tracks the cursor movement and records path coordinates.

2. These drawing coordinates are sent in real time to the server through WebSocket events.

3. The server receives each stroke, validates it, and instantly broadcasts the drawing data to all connected users.

4. Every client updates its canvas simultaneously, ensuring a live collaborative experience.

5. The server also stores each drawing action in a shared history, so new users joining later can view the current canvas state.


### Undo/Redo Strategy

**Global Control**: Undo or redo applies to the most recent action performed by any user, maintaining a consistent shared state.

**Centralized History**: All drawing actions are recorded on the server, acting as the single source of truth.

**Real-Time Updates**: When an undo or redo occurs, the server re-broadcasts the updated canvas history to every connected client.

**Consistency Over Complexity**: A unified undo/redo stack is used instead of separate per-user histories to keep synchronization smooth and predictable.


## Known limitations/bugs

- Currently supports a single shared canvas (no multi-room feature yet)

- Canvas data resets when the server restarts — persistence not implemented

- Undo/Redo functions globally, not per user

- No dedicated authentication or user login system

- Minor latency may occur when many users draw simultaneously

- Shape drawing tools (like rectangle or circle) not yet added

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- IE 11: Not supported (no WebSocket support)

### Performance

- Optimal for 2-10 concurrent users
- May lag with 20+ simultaneous drawers
- Large canvases (>2000px) may impact mobile performance


### Time Spent on the Project

-- Total Duration: 3 days

- Day 1: Project setup, WebSocket configuration, and core drawing functionality

- Day 2: Added real-time synchronization, undo/redo, and UI improvements

- Day 3: Enhanced user indicators, brush/eraser logic, color picker, and testing

### Learning Outcomes

- Strengthened understanding of WebSocket communication.

- Improved proficiency with Canvas API and event-driven programming.

- Gained experience in designing collaborative, real-time systems.

- Enhanced front-end aesthetics with usability-focused layout decisions.

## Future Enhancements
- Introduce per-user undo history.
- Shape tools (rectangle, circle, line)
- Text tool
- Color fill/bucket tool
- Image upload
- Chat functionality
- Enable persistent storage (MongoDB).



## Author

Developed by Niranjana S
