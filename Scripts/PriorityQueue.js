class PriorityQueue {
    constructor() {
        this.elements = [];
        this.count = 0; // For tiebreakers
    }
    
    empty() {
        return this.elements.length === 0;
    }
    
    put(item, priority) {
        const entry = { item, priority, count: this.count++ };
        this.elements.push(entry);
        this.elements.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.count - b.count; // Use insertion order as tiebreaker
        });
    }
    
    get() {
        if (this.empty()) {
            throw new Error("Priority queue is empty");
        }
        return this.elements.shift().item;
    }
    
    // Check if queue contains an item
    contains(item) {
        return this.elements.some(e => e.item === item);
    }
    
    // For compatibility with original code's open_set_hash
    has(item) {
        return this.contains(item);
    }
    
    // Remove an item from the queue
    remove(item) {
        const index = this.elements.findIndex(e => e.item === item);
        if (index !== -1) {
            this.elements.splice(index, 1);
        }
    }
}