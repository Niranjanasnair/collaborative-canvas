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

  function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    window.addEventListener('resize', resizeCanvas);
    console.log('Canvas initialized');
  }

  function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }

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

  function draw(e) {
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    if (isDrawing) {
      const prevPoint = currentPath[currentPath.length - 1];
      currentPath.push({ x, y });

      // Draw locally
      drawLine(prevPoint, { x, y }, color, brushSize, tool === 'eraser');

      // Send small segment to others in real-time
      WebSocketModule.sendDrawAction({
        tool,
        path: [prevPoint, { x, y }],
        color,
        size: brushSize,
        timestamp: Date.now()
      });
    }

    return { x, y };
  }

  function stopDrawing() {
    if (!isDrawing) return null;
    isDrawing = false;

    // ✅ FIX: Send full stroke once finished for undo/redo consistency
    if (currentPath.length > 1) {
      WebSocketModule.sendDrawAction({
        tool,
        path: currentPath,
        color,
        size: brushSize,
        timestamp: Date.now(),
        finalized: true // mark it as complete stroke
      });
    }

    currentPath = [];
    return null;
  }

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

  function drawPath(path, strokeColor, strokeSize, isEraser = false) {
    if (!path || path.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = isEraser ? '#ffffff' : strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function redrawFromHistory(history) {
    clearCanvas();
    history.forEach(action => {
      if (action.tool === 'brush' || action.tool === 'eraser') {
        drawPath(action.path, action.color, action.size, action.tool === 'eraser');
      }
    });
  }

  function downloadCanvas() {
    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function setTool(newTool) { tool = newTool; }
  function setColor(newColor) { color = newColor; }
  function setBrushSize(newSize) { brushSize = newSize; }
  function getTool() { return tool; }
  function getColor() { return color; }
  function getBrushSize() { return brushSize; }

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
