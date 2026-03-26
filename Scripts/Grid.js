class Grid {
    constructor(rows = 50, cols = 50) {
        this.rows = rows;
        this.cols = cols;
        this.spots = [];
        this.startSpots = []; // Keep array but will only use first element
        this.endSpots = []; // Keep array but will only use first element
        this.cellSize = 0;
        this.paths = [];
        this.unifiedPath = [];
        
        this.init();
    }
    
    init() {
        this.spots = [];
        for (let i = 0; i < this.rows; i++) {
            this.spots[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.spots[i][j] = new Spot(i, j);
            }
        }
        
        // Reset start and end points
        this.startSpots = [];
        this.endSpots = [];
        this.paths = [];
    }

    clearUnifiedPath() {
        // Reset colors for cells in the unified path
        for (let spot of this.unifiedPath) {
            if (!spot.is_start() && !spot.is_end()) {
                spot.reset();
            }
        }
        this.unifiedPath = [];
    }

    resize(newRows, newCols) {
        this.rows = newRows;
        this.cols = newCols;
        this.init();
    }
    
    getSpot(row, col) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.spots[row][col];
        }
        return null;
    }
    
    clearPath() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const spot = this.spots[i][j];
                if (spot.is_path() || spot.is_open() || spot.is_closed()) {
                    spot.reset();
                }
            }
        }
        this.paths = [];
        this.unifiedPath = [];
    }     

    clearAll() {
        this.init();
    }
    
    // Method to update neighbors for all spots
    updateAllNeighbors() {
        console.log("Updating all neighbors");
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.spots[i] && this.spots[i][j]) {
                    this.spots[i][j].update_neighbor(this);
                }
            }
        }
        console.log("All neighbors updated");
    }
    
    // Check if a path exists between coordinates
    hasPathBetween(startRow, startCol, endRow, endCol) {
        for (let path of this.paths) {
            let hasStart = false;
            let hasEnd = false;
            
            for (let spot of path) {
                if (spot.row === startRow && spot.col === startCol) {
                    hasStart = true;
                }
                if (spot.row === endRow && spot.col === endCol) {
                    hasEnd = true;
                }
            }
            
            if (hasStart && hasEnd) {
                return true;
            }
        }
        
        return false;
    }
    
    // Count how many paths use a specific grid cell
    getPathCount(row, col) {
        let count = 0;
        for (let path of this.paths) {
            for (let spot of path) {
                if (spot.row === row && spot.col === col && 
                    !spot.is_start() && !spot.is_end()) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }
}