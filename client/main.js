/**
 * Main Application Module
 * Orchestrates all modules and handles UI interactions
 */

(function() {
  // Application state
  const state = {
    history: [],
    canUndo: false,
    canRedo: false
  };

  // Preset colors for color picker
  const PRESET_COLORS = [
    '#2563eb', '#7c3aed', '#db2777', '#dc2626',
    '#ea580c', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#0891b2', '#1e293b', '#ffffff'
  ];

  /**
   * Initialize application
   */
  function init() {
    console.log('Initializing application...');
    
    // Initialize modules
    CanvasModule.init();
    WebSocketModule.init('http://localhost:3001');
    
    // Setup UI event listeners
    setupUIListeners();
    
    // Setup WebSocket callbacks
    setupWebSocketCallbacks();
    
    // Initialize color picker
    initializeColorPicker();
    
    // Setup cursor tracking throttling
    setupCursorTracking();
    
    console.log('Application initialized');
  }

  /**
   * Setup all UI event listeners
   */
  function setupUIListeners() {
    const canvas = CanvasModule.getCanvas();
    
    // Canvas drawing events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleMouseDown);
    canvas.addEventListener('touchmove', handleMouseMove);
    canvas.addEventListener('touchend', handleMouseUp);
    
    // Tool buttons
    document.getElementById('brush-btn').addEventListener('click', () => selectTool('brush'));
    document.getElementById('eraser-btn').addEventListener('click', () => selectTool('eraser'));
    
    // Color input
    document.getElementById('color-input').addEventListener('input', (e) => {
      CanvasModule.setColor(e.target.value);
      updateColorHex(e.target.value);
      updateSizeIndicator();
    });
    
    // Brush size slider
    document.getElementById('brush-size').addEventListener('input', (e) => {
      CanvasModule.setBrushSize(parseInt(e.target.value));
      updateSizeValue(e.target.value);
      updateSizeIndicator();
    });
    
    // Action buttons
    document.getElementById('undo-btn').addEventListener('click', handleUndo);
    document.getElementById('redo-btn').addEventListener('click', handleRedo);
    document.getElementById('clear-btn').addEventListener('click', handleClear);
    document.getElementById('download-btn').addEventListener('click', handleDownload);
  }

  /**
   * Setup WebSocket event callbacks
   */
  function setupWebSocketCallbacks() {
    // Initial canvas state
    WebSocketModule.setOnInitCanvas((data) => {
      console.log('Initializing canvas with history:', data.history.length, 'actions');
      state.history = data.history;
      CanvasModule.redrawFromHistory(data.history);
      updateUsers(data.users);
      updateUndoRedoButtons();
    });
    
    // Draw action from remote user
    WebSocketModule.setOnDrawAction((action) => {
      state.history.push(action);
      CanvasModule.drawPath(action.path, action.color, action.size, action.tool === 'eraser');
      updateUndoRedoButtons();
    });
    
    // User joined
    WebSocketModule.setOnUserJoined((data) => {
      updateUsers(data.users);
      showNotification(`User joined`);
    });
    
    // User left
    WebSocketModule.setOnUserLeft((data) => {
      updateUsers(data.users);
      updateRemoteCursors();
    });
    
    // Cursor update
    WebSocketModule.setOnCursorUpdate((cursors) => {
      updateRemoteCursors();
    });
    
    // Undo action
    WebSocketModule.setOnUndoAction((history) => {
      state.history = history;
      CanvasModule.redrawFromHistory(history);
      updateUndoRedoButtons();
    });
    
    // Redo action
    WebSocketModule.setOnRedoAction((history) => {
      state.history = history;
      CanvasModule.redrawFromHistory(history);
      updateUndoRedoButtons();
    });
    
    // Canvas cleared
    WebSocketModule.setOnCanvasCleared(() => {
      state.history = [];
      CanvasModule.clearCanvas();
      updateUndoRedoButtons();
    });
    
    // Connection status
    WebSocketModule.setOnConnectionChange((connected) => {
      updateConnectionStatus(connected);
    });
  }

  /**
   * Handle mouse down event
   */
  function handleMouseDown(e) {
    CanvasModule.startDrawing(e);
  }

  /**
   * Handle mouse move event
   */
  function handleMouseMove(e) {
    const cursorPos = CanvasModule.draw(e);
    
    if (cursorPos && WebSocketModule.getIsConnected()) {
      WebSocketModule.sendCursorPosition(cursorPos.x, cursorPos.y);
    }
  }

  /**
   * Handle mouse up event
   */
  function handleMouseUp(e) {
    const action = CanvasModule.stopDrawing();
    
    if (action && WebSocketModule.getIsConnected()) {
      WebSocketModule.sendDrawAction(action);
      state.history.push(action);
      updateUndoRedoButtons();
    }
  }

  /**
   * Select drawing tool
   */
  function selectTool(tool) {
    CanvasModule.setTool(tool);
    
    // Update UI
    document.querySelectorAll('.tool-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    if (tool === 'brush') {
      document.getElementById('brush-btn').classList.add('active');
    } else if (tool === 'eraser') {
      document.getElementById('eraser-btn').classList.add('active');
    }
    
    updateSizeIndicator();
  }

  /**
   * Handle undo action
   */
  function handleUndo() {
    if (state.history.length > 0) {
      WebSocketModule.sendUndo();
    }
  }

  /**
   * Handle redo action
   */
  function handleRedo() {
    WebSocketModule.sendRedo();
  }

  /**
   * Handle clear canvas
   */
  function handleClear() {
    if (confirm('Are you sure you want to clear the canvas? This will affect all users.')) {
      WebSocketModule.sendClearCanvas();
    }
  }

  /**
   * Handle download canvas
   */
  function handleDownload() {
    CanvasModule.downloadCanvas();
    showNotification('Canvas downloaded!');
  }

  /**
   * Initialize color picker with preset colors
   */
  function initializeColorPicker() {
    const presetsContainer = document.getElementById('color-presets');
    
    PRESET_COLORS.forEach(color => {
      const swatch = document.createElement('button');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color;
      swatch.addEventListener('click', () => selectColor(color));
      presetsContainer.appendChild(swatch);
    });
    
    // Set first color as active
    selectColor(PRESET_COLORS[0]);
  }

  /**
   * Select a color
   */
  function selectColor(color) {
    CanvasModule.setColor(color);
    document.getElementById('color-input').value = color;
    updateColorHex(color);
    updateSizeIndicator();
    
    // Update active swatch
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.classList.remove('active');
      if (swatch.style.backgroundColor === hexToRgb(color)) {
        swatch.classList.add('active');
      }
    });
  }

  /**
   * Convert hex color to RGB string for comparison
   */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return null;
  }

  /**
   * Update color hex display
   */
  function updateColorHex(color) {
    document.getElementById('color-hex').textContent = color.toUpperCase();
  }

  /**
   * Update size value display
   */
  function updateSizeValue(size) {
    document.getElementById('size-value').textContent = size + 'px';
  }

  /**
   * Update size indicator preview
   */
  function updateSizeIndicator() {
    const indicator = document.getElementById('size-indicator');
    const size = CanvasModule.getBrushSize();
    const color = CanvasModule.getTool() === 'eraser' ? '#e5e7eb' : CanvasModule.getColor();
    
    indicator.style.width = size + 'px';
    indicator.style.height = size + 'px';
    indicator.style.backgroundColor = color;
  }

  /**
   * Update undo/redo button states
   */
  function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    undoBtn.disabled = state.history.length === 0;
    // Redo is managed by server, keep it disabled for simplicity
    redoBtn.disabled = true;
  }

  /**
   * Update user list display
   */
  function updateUsers(users) {
    const countElement = document.getElementById('user-count');
    const avatarsContainer = document.getElementById('user-avatars');
    
    countElement.textContent = `${users.length} online`;
    
    // Clear existing avatars
    avatarsContainer.innerHTML = '';
    
    // Add avatar for each user
    users.forEach(user => {
      const avatar = document.createElement('div');
      avatar.className = 'user-avatar';
      avatar.style.backgroundColor = user.color;
      avatar.textContent = user.userId === WebSocketModule.getUserId() ? 'You' : user.userId.substring(0, 2).toUpperCase();
      
      if (user.userId === WebSocketModule.getUserId()) {
        avatar.classList.add('current-user');
        avatar.title = 'You';
      } else {
        avatar.title = user.userId;
      }
      
      avatarsContainer.appendChild(avatar);
    });
  }

  /**
   * Update remote cursors display
   */
  function updateRemoteCursors() {
    const cursorsContainer = document.getElementById('remote-cursors');
    const cursors = WebSocketModule.getRemoteCursors();
    
    // Clear existing cursors
    cursorsContainer.innerHTML = '';
    
    // Add cursor for each remote user
    Object.keys(cursors).forEach(userId => {
      const cursor = cursors[userId];
      
      // Skip stale cursors (older than 2 seconds)
      if (Date.now() - cursor.timestamp > 2000) {
        return;
      }
      
      const cursorElement = document.createElement('div');
      cursorElement.className = 'remote-cursor';
      cursorElement.style.left = cursor.x + 'px';
      cursorElement.style.top = cursor.y + 'px';
      
      cursorElement.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${cursor.color}">
          <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" />
        </svg>
        <span class="cursor-label" style="background-color: ${cursor.color}">
          ${userId.substring(0, 4)}
        </span>
      `;
      
      cursorsContainer.appendChild(cursorElement);
    });
  }

  /**
   * Update connection status display
   */
  function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');
    
    statusDot.classList.remove('connected', 'disconnected');
    
    if (connected) {
      statusDot.classList.add('connected');
      statusText.textContent = 'Connected';
    } else {
      statusDot.classList.add('disconnected');
      statusText.textContent = 'Disconnected';
    }
  }

  /**
   * Setup cursor tracking with throttling
   */
  function setupCursorTracking() {
    let lastUpdate = 0;
    const throttleMs = 50; // Send cursor updates at most every 50ms
    
    const canvas = CanvasModule.getCanvas();
    
    canvas.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) {
        return;
      }
      lastUpdate = now;
      
      // Update remote cursors display periodically
      updateRemoteCursors();
    });
  }

  /**
   * Show temporary notification
   */
  function showNotification(message) {
    // Simple console log for now - can be enhanced with toast notifications
    console.log('📢', message);
  }

  // Initialize application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();