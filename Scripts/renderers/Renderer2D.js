(function(){
  class Renderer2D {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.dpr = window.devicePixelRatio || 1;
      this.cssWidth = 0;
      this.cssHeight = 0;
    }

    resizeToWindow(){
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      this.dpr = dpr;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.cssWidth = w;
      this.cssHeight = h;
      // Reset transform before scaling to avoid compounding
      this.ctx.setTransform(1,0,0,1,0,0);
      this.ctx.scale(dpr, dpr);
    }

    clear(background){
      this.ctx.fillStyle = background || '#e0e0e0';
      this.ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    }

    // Draw the grid with centering and zoom/pan
    renderGrid(grid, opts){
      if (!grid || !grid.spots) return;
      const zoom = opts?.zoomLevel ?? 1;
      const pan = opts?.panOffset ?? {x:0,y:0};
      const background = opts?.background ?? '#e0e0e0';

      this.clear(background);
      const cellSize = grid.cellSize || 20;
      const gridWidth = grid.cols * cellSize;
      const gridHeight = grid.rows * cellSize;

      const offsetX = Math.floor((this.cssWidth - gridWidth * zoom) / 2) + pan.x * zoom;
      const offsetY = Math.floor((this.cssHeight - gridHeight * zoom) / 2) + pan.y * zoom;

      this.ctx.save();
      this.ctx.translate(offsetX, offsetY);
      this.ctx.scale(zoom, zoom);

      for (let i = 0; i < grid.cols; i++) {
        for (let j = 0; j < grid.rows; j++) {
          const spot = grid.getSpot(j, i);
          if (!spot) continue;
          const x = i * cellSize;
          const y = j * cellSize;
          this.ctx.fillStyle = spot.color || COLORS.WHITE;
          this.ctx.fillRect(x, y, cellSize, cellSize);
          this.ctx.strokeStyle = '#000000';
          this.ctx.strokeRect(x, y, cellSize, cellSize);
          if ((spot.is_start() || spot.is_end()) && spot.pointLabel) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.font = `bold ${Math.max(10, cellSize/2)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(spot.pointLabel, x + cellSize/2, y + cellSize/2);
          }
        }
      }

      this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(0, 0, grid.cols * cellSize, grid.rows * cellSize);

      this.ctx.restore();
    }

    // Map canvas mouse X/Y (CSS pixels) to grid row/col at current zoom/pan
    getGridPosition(grid, x, y, zoomLevel, panOffset){
      if (!grid) return {row:-1, col:-1};
      const cellSize = grid.cellSize || 20;
      const gridWidth = grid.cols * cellSize;
      const gridHeight = grid.rows * cellSize;
      const offsetX = (this.cssWidth - gridWidth * zoomLevel) / 2 + panOffset.x * zoomLevel;
      const offsetY = (this.cssHeight - gridHeight * zoomLevel) / 2 + panOffset.y * zoomLevel;
      const gridX = (x - offsetX) / zoomLevel;
      const gridY = (y - offsetY) / zoomLevel;
      const col = Math.floor(gridX / cellSize);
      const row = Math.floor(gridY / cellSize);
      if (col >= 0 && col < grid.cols && row >= 0 && row < grid.rows) {
        return { row, col };
      }
      return { row: -1, col: -1 };
    }
  }

  if (typeof window !== 'undefined') {
    window.Renderer2D = Renderer2D;
  }
})();
