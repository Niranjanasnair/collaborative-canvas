/**
 * Canvas Drawing Module
 * Handles all canvas operations, drawing logic, and rendering
 */

const CanvasModule = (function() {
  // Private variables
  let canvas = null;
  let ctx = null;
  let isDrawing = false;
  let currentPath = [];
  let tool = 'brush';
  let color = '#2563eb';
  let brushSize = 3;

  /**
   * Initialize canvas with proper dimensions and context
   */
  function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size to match container
    resizeCanvas();
    
    // Configure context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Setup resize listener
    window.addEventListener('resize', resizeCanvas);

    console.log('Canvas initialized');
  }

  /**
   * Resize canvas to match container dimensions
   * Maintains proper pixel ratio for sharp rendering
   */
  function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    // Set display size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Set actual size in memory (scaled for retina displays)
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    
    // Scale context to match
    ctx.scale(scale, scale);
    
    // Reconfigure context after resize
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  /**
   * Get mouse/touch coordinates relative to canvas
   * @param {Event} e - Mouse or touch event
   * @returns {Object} { x, y } coordinates
   */
  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches.length > 0) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }

  /**
   * Start drawing - called on mouse/touch down
   * @param {Event} e - Mouse or touch event
   */
  function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    
    const { x, y } = getCoordinates(e);
    currentPath = [{ x, y }];
    
    // Draw initial point
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fill();
  }

  /**
   * Continue drawing - called on mouse/touch move
   * @param {Event} e - Mouse or touch event
   * @returns {Object|null} Cursor position for broadcasting
   */
  function draw(e) {
    e.preventDefault();
    
    const { x, y } = getCoordinates(e);
    
    if (isDrawing) {
      // Add point to current path
      currentPath.push({ x, y });
      
      // Draw line segment
      const prevPoint = currentPath[currentPath.length - 2];
      drawLine(prevPoint, { x, y }, color, brushSize, tool === 'eraser');
    }
    
    // Return cursor position for broadcasting
    return { x, y };
  }

  /**
   * Stop drawing - called on mouse/touch up
   * @returns {Object|null} Drawing action data for broadcasting
   */
  function stopDrawing() {
    if (!isDrawing) {
      return null;
    }
    
    isDrawing = false;
    
    // Only send if path has multiple points
    if (currentPath.length < 2) {
      currentPath = [];
      return null;
    }
    
    // Prepare action data
    const action = {
      tool,
      path: currentPath,
      color,
      size: brushSize,
      timestamp: Date.now()
    };
    
    currentPath = [];
    return action;
  }

  /**
   * Draw a line between two points
   * @param {Object} from - Start point { x, y }
   * @param {Object} to - End point { x, y }
   * @param {string} strokeColor - Line color
   * @param {number} strokeSize - Line width
   * @param {boolean} isEraser - Whether this is an erase operation
   */
  function drawLine(from, to, strokeColor, strokeSize, isEraser = false) {
    ctx.beginPath();
    ctx.strokeStyle = isEraser ? '#ffffff' : strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Draw a complete path (for remote users or history replay)
   * @param {Array} path - Array of { x, y } points
   * @param {string} strokeColor - Line color
   * @param {number} strokeSize - Line width
   * @param {boolean} isEraser - Whether this is an erase operation
   */
  function drawPath(path, strokeColor, strokeSize, isEraser = false) {
    if (!path || path.length < 2) {
      return;
    }

    ctx.beginPath();
    ctx.strokeStyle = isEraser ? '#ffffff' : strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    
    ctx.moveTo(path[0].x, path[0].y);
    
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Clear entire canvas
   */
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Redraw canvas from history
   * Used for undo/redo operations
   * @param {Array} history - Array of drawing actions
   */
  function redrawFromHistory(history) {
    clearCanvas();
    
    history.forEach(action => {
      if (action.tool === 'brush' || action.tool === 'eraser') {
        drawPath(action.path, action.color, action.size, action.tool === 'eraser');
      }
    });
  }

  /**
   * Download canvas as PNG image
   */
  function downloadCanvas() {
    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * Set current drawing tool
   * @param {string} newTool - 'brush' or 'eraser'
   */
  function setTool(newTool) {
    tool = newTool;
  }

  /**
   * Set current drawing color
   * @param {string} newColor - Hex color string
   */
  function setColor(newColor) {
    color = newColor;
  }

  /**
   * Set brush size
   * @param {number} newSize - Brush size in pixels
   */
  function setBrushSize(newSize) {
    brushSize = newSize;
  }

  /**
   * Get current tool
   * @returns {string} Current tool name
   */
  function getTool() {
    return tool;
  }

  /**
   * Get current color
   * @returns {string} Current color
   */
  function getColor() {
    return color;
  }

  /**
   * Get current brush size
   * @returns {number} Current brush size
   */
  function getBrushSize() {
    return brushSize;
  }

  // Public API
  return {
    init,
    startDrawing,
    draw,
    stopDrawing,
    drawPath,
    clearCanvas,
    redrawFromHistory,
    downloadCanvas,
    setTool,
    setColor,
    setBrushSize,
    getTool,
    getColor,
    getBrushSize,
    getCanvas: () => canvas
  };
})();