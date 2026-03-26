// ─────────────────────────────────────────────────────────────────────────────
// Heuristic: Manhattan distance (admissible for 4-directional grids)
// ─────────────────────────────────────────────────────────────────────────────
function heuristic(pos1, pos2) {
    const [x1, y1] = pos1;
    const [x2, y2] = pos2;
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Reconstruct path by walking `previous` pointers from end → start,
// then reversing so the returned array goes start → end.
// ─────────────────────────────────────────────────────────────────────────────
function reconstructPath(endNode) {
    const path = [];
    let current = endNode;
    while (current !== null) {
        path.push(current);
        current = current.previous;
    }
    return path.reverse();
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset all algorithm state on every spot (preserves visual colors / barriers)
// ─────────────────────────────────────────────────────────────────────────────
function resetAllSpots(grid) {
    for (const row of grid.spots) {
        for (const spot of row) {
            if (typeof spot.resetAlgorithmState === 'function') {
                spot.resetAlgorithmState();
            } else {
                spot.previous = null;
                spot.distance = Infinity;
                spot.fScore   = Infinity;
                spot.gScore   = Infinity;
                spot.hScore   = 0;
                spot.visited  = false;
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// A* Algorithm
//
// Guarantees the shortest path on a uniform-cost, 4-directional grid.
//
// Key correctness fixes vs. old version:
//   1. Lazy-deletion re-queuing: when we discover a *better* gScore for a
//      node that is already in the open set, we re-insert it at the new
//      lower priority.  Stale (higher-cost) entries are discarded when
//      popped via the `current.visited` early-exit guard.
//   2. Animation: `await draw()` delegates timing entirely to the visualiser,
//      which already handles the speed-slider delay + requestAnimationFrame.
// ─────────────────────────────────────────────────────────────────────────────
async function aStarAlgorithm(grid, start, end, delay, draw) {
    resetAllSpots(grid);

    const openSet = new PriorityQueue();
    start.gScore  = 0;
    start.fScore  = heuristic(start.get_pos(), end.get_pos());
    openSet.put(start, start.fScore);

    while (!openSet.empty()) {
        const current = openSet.get();

        // Found the goal — reconstruct and return
        if (current === end) {
            return reconstructPath(current);
        }

        // Discard stale duplicate entries (lazy deletion)
        if (current.visited) continue;
        current.visited = true;
        if (!current.is_start()) current.make_closed();

        for (const neighbor of current.neighbors) {
            if (neighbor.visited) continue;

            const tentativeG = current.gScore + 1;

            if (tentativeG < neighbor.gScore) {
                // Better path discovered — update and re-queue
                neighbor.previous = current;
                neighbor.gScore   = tentativeG;
                neighbor.fScore   = tentativeG + heuristic(neighbor.get_pos(), end.get_pos());

                // Re-insert with updated priority; old entry discarded via visited check
                openSet.put(neighbor, neighbor.fScore);
                if (!neighbor.is_end()) neighbor.make_open();
            }
        }

        await draw();
    }

    return null; // no path exists
}

// ─────────────────────────────────────────────────────────────────────────────
// Dijkstra's Algorithm
//
// Equivalent to A* with a zero heuristic — explores uniformly in all
// directions, guaranteeing the shortest path.
//
// Correctness fix: same lazy-deletion re-queue strategy as A*.
// ─────────────────────────────────────────────────────────────────────────────
async function dijkstraAlgorithm(grid, start, end, delay, draw) {
    resetAllSpots(grid);

    const openSet  = new PriorityQueue();
    start.distance = 0;
    openSet.put(start, 0);

    while (!openSet.empty()) {
        const current = openSet.get();

        if (current === end) {
            return reconstructPath(current);
        }

        // Discard stale duplicates
        if (current.visited) continue;
        current.visited = true;
        if (!current.is_start()) current.make_closed();

        for (const neighbor of current.neighbors) {
            if (neighbor.visited) continue;

            const tentativeDist = current.distance + 1;

            if (tentativeDist < neighbor.distance) {
                neighbor.previous = current;
                neighbor.distance = tentativeDist;

                // Re-insert at improved (lower) priority
                openSet.put(neighbor, neighbor.distance);
                if (!neighbor.is_end()) neighbor.make_open();
            }
        }

        await draw();
    }

    return null; // no path exists
}

// ─────────────────────────────────────────────────────────────────────────────
// Greedy Best-First Search
//
// Expands whichever open node *looks* closest to the goal using only the
// heuristic (no path-cost accounting).  Fast but NOT guaranteed to find the
// shortest path.
//
// Correctness fix vs. old version:
//   • `inOpenSet` Set prevents re-queuing a node that is already waiting —
//     old code re-queued and overwrote `previous` on every visit, causing
//     incorrect path reconstruction and extra work.
// ─────────────────────────────────────────────────────────────────────────────
async function greedyAlgorithm(grid, start, end, delay, draw) {
    resetAllSpots(grid);

    const openSet   = new PriorityQueue();
    const inOpenSet = new Set();

    openSet.put(start, 0);
    inOpenSet.add(start);

    while (!openSet.empty()) {
        const current = openSet.get();
        inOpenSet.delete(current);

        if (current === end) {
            return reconstructPath(current);
        }

        if (current.visited) continue;
        current.visited = true;
        if (!current.is_start()) current.make_closed();

        for (const neighbor of current.neighbors) {
            // Skip nodes already finalised or already waiting in the queue
            if (neighbor.visited || inOpenSet.has(neighbor)) continue;

            neighbor.previous = current;
            openSet.put(neighbor, heuristic(neighbor.get_pos(), end.get_pos()));
            inOpenSet.add(neighbor);

            if (!neighbor.is_end()) neighbor.make_open();
        }

        await draw();
    }

    return null; // no path exists
}
