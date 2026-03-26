class Spot {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.color = COLORS.WHITE;
        this.neighbors = [];
        this.pointLabel = null;
        
        // Algorithm properties
        this.previous = null;
        this.distance = Infinity;
        this.fScore = Infinity;
        this.gScore = Infinity;
        this.hScore = 0;
        this.visited = false;
    }
    
    // Set point label for start/end points
    setPointLabel(label) {
        this.pointLabel = label;
    }

    // Get position as [row, col] array (for heuristic calculations)
    get_pos() {
        return [this.row, this.col];
    }
    
    reset() {
        this.color = COLORS.WHITE;
        this.previous = null;
        this.distance = Infinity;
        this.fScore = Infinity;
        this.gScore = Infinity;
        this.hScore = 0;
        this.visited = false;
        this.pointLabel = null; // Make sure to clear any labels too
    }

    // Reset only algorithm-related state, preserving visual identity (color/label)
    resetAlgorithmState() {
        this.previous = null;
        this.distance = Infinity;
        this.fScore = Infinity;
        this.gScore = Infinity;
        this.hScore = 0;
        this.visited = false;
    }
    
    // State setters
    make_start() {
        this.color = COLORS.ORANGE;
    }
    
    make_end() {
        this.color = COLORS.TURQUOISE;
    }
    
    make_barrier() {
        this.color = COLORS.BLACK;
    }
    
    make_path() {
        if (!this.is_start() && !this.is_end()) {
            this.color = COLORS.PURPLE;
        }
    }
    
    make_shared_path() {
        if (!this.is_start() && !this.is_end()) {
            this.color = COLORS.GOLD;
        }
    }
    
    make_open() {
        if (!this.is_start() && !this.is_end()) {
            this.color = COLORS.GREEN;
        }
    }
    
    make_closed() {
        if (!this.is_start() && !this.is_end()) {
            this.color = COLORS.RED;
        }
    }
    
    // State checkers
    is_start() {
        return this.color === COLORS.ORANGE;
    }
    
    is_end() {
        return this.color === COLORS.TURQUOISE;
    }
    
    is_barrier() {
        return this.color === COLORS.BLACK;
    }
    
    is_path() {
        return this.color === COLORS.PURPLE || this.color === COLORS.GOLD;
    }
    
    is_open() {
        return this.color === COLORS.GREEN;
    }
    
    is_closed() {
        return this.color === COLORS.RED;
    }
    
    // Update neighbors - Fixed implementation that properly adds adjacent cells
    update_neighbor(grid) {
        // Clear existing neighbors
        this.neighbors = [];
        
        // Check all four directions (UP, RIGHT, DOWN, LEFT)
        // DOWN neighbor
        if (this.row < grid.rows - 1 && !grid.spots[this.row + 1][this.col].is_barrier()) {
            this.neighbors.push(grid.spots[this.row + 1][this.col]);
        }
        
        // UP neighbor
        if (this.row > 0 && !grid.spots[this.row - 1][this.col].is_barrier()) {
            this.neighbors.push(grid.spots[this.row - 1][this.col]);
        }
        
        // RIGHT neighbor
        if (this.col < grid.cols - 1 && !grid.spots[this.row][this.col + 1].is_barrier()) {
            this.neighbors.push(grid.spots[this.row][this.col + 1]);
        }
        
        // LEFT neighbor
        if (this.col > 0 && !grid.spots[this.row][this.col - 1].is_barrier()) {
            this.neighbors.push(grid.spots[this.row][this.col - 1]);
        }
    }
    
    // For compatibility with the original code's priority queue
    __lt__(other) {
        return false;
    }
}