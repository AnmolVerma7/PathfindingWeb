// A* Algorithm implementation
async function aStarAlgorithm(grid, start, end, delay, draw) {
    // Reset algorithm state for all spots (preserve colors/labels for start/end/barriers)
    for (let row of grid.spots) {
        for (let spot of row) {
            if (typeof spot.resetAlgorithmState === 'function') {
                spot.resetAlgorithmState();
            } else {
                // Fallback: minimal reset
                spot.previous = null;
                spot.distance = Infinity;
                spot.fScore = Infinity;
                spot.gScore = Infinity;
                spot.hScore = 0;
                spot.visited = false;
            }
        }
    }

    const openSet = new PriorityQueue();
    openSet.put(start, 0);
    
    start.gScore = 0;
    start.fScore = heuristic(start.get_pos(), end.get_pos());
    
    while (!openSet.empty()) {
        const current = openSet.get();
        
        if (current === end) {
            return reconstructPath(current);
        }
        
        current.visited = true;
        current.make_closed();
        
        for (let neighbor of current.neighbors) {
            const tentativeGScore = current.gScore + 1;
            
            if (tentativeGScore < neighbor.gScore) {
                neighbor.previous = current;
                neighbor.gScore = tentativeGScore;
                neighbor.fScore = neighbor.gScore + heuristic(neighbor.get_pos(), end.get_pos());
                
                if (!neighbor.visited) {
                    openSet.put(neighbor, neighbor.fScore);
                    if (!neighbor.is_end()) {
                        neighbor.make_open();
                    }
                }
            }
        }
        
        if (current !== start) {
            await draw();
        }
    }
    
    return null; // No path found
}

// Dijkstra's Algorithm implementation
async function dijkstraAlgorithm(grid, start, end, delay, draw) {
    // Reset algorithm state for all spots
    for (let row of grid.spots) {
        for (let spot of row) {
            if (typeof spot.resetAlgorithmState === 'function') {
                spot.resetAlgorithmState();
            } else {
                spot.previous = null;
                spot.distance = Infinity;
                spot.fScore = Infinity;
                spot.gScore = Infinity;
                spot.hScore = 0;
                spot.visited = false;
            }
        }
    }

    const openSet = new PriorityQueue();
    openSet.put(start, 0);
    start.distance = 0;
    
    while (!openSet.empty()) {
        const current = openSet.get();
        
        if (current === end) {
            return reconstructPath(current);
        }
        
        current.visited = true;
        current.make_closed();
        
        for (let neighbor of current.neighbors) {
            const tentativeDistance = current.distance + 1;
            
            if (tentativeDistance < neighbor.distance) {
                neighbor.previous = current;
                neighbor.distance = tentativeDistance;
                
                if (!neighbor.visited) {
                    openSet.put(neighbor, neighbor.distance);
                    if (!neighbor.is_end()) {
                        neighbor.make_open();
                    }
                }
            }
        }
        
        if (current !== start) {
            await draw();
        }
    }
    
    return null; // No path found
}

// Greedy Best-First Search implementation
async function greedyAlgorithm(grid, start, end, delay, draw) {
    // Reset algorithm state for all spots
    for (let row of grid.spots) {
        for (let spot of row) {
            if (typeof spot.resetAlgorithmState === 'function') {
                spot.resetAlgorithmState();
            } else {
                spot.previous = null;
                spot.distance = Infinity;
                spot.fScore = Infinity;
                spot.gScore = Infinity;
                spot.hScore = 0;
                spot.visited = false;
            }
        }
    }

    const openSet = new PriorityQueue();
    openSet.put(start, 0);
    
    while (!openSet.empty()) {
        const current = openSet.get();
        
        if (current === end) {
            return reconstructPath(current);
        }
        
        current.visited = true;
        current.make_closed();
        
        for (let neighbor of current.neighbors) {
            if (!neighbor.visited) {
                neighbor.previous = current;
                openSet.put(neighbor, heuristic(neighbor.get_pos(), end.get_pos()));
                if (!neighbor.is_end()) {
                    neighbor.make_open();
                }
            }
        }
        
        if (current !== start) {
            await draw();
        }
    }
    
    return null; // No path found
}

// Manhattan distance heuristic
function heuristic(pos1, pos2) {
    const [x1, y1] = pos1;
    const [x2, y2] = pos2;
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Helper function to reconstruct path
function reconstructPath(current) {
    const path = [];
    let temp = current;
    
    while (temp !== null) {
        path.push(temp);
        temp = temp.previous;
    }
    
    return path.reverse();
}
