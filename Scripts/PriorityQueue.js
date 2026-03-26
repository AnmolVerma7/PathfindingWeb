/**
 * Binary min-heap PriorityQueue.
 * Replaces the previous sort-on-every-insert implementation (O(n log n) per put)
 * with true O(log n) put/get.
 *
 * Ties are broken by insertion order so the visualisation is deterministic.
 */
class PriorityQueue {
    constructor() {
        this._heap = [];  // [{ item, priority, seq }]
        this._seq  = 0;   // monotonically-increasing tiebreaker
    }

    empty() {
        return this._heap.length === 0;
    }

    put(item, priority) {
        const entry = { item, priority, seq: this._seq++ };
        this._heap.push(entry);
        this._bubbleUp(this._heap.length - 1);
    }

    get() {
        if (this.empty()) throw new Error('PriorityQueue is empty');
        const top = this._heap[0];
        const last = this._heap.pop();
        if (this._heap.length > 0) {
            this._heap[0] = last;
            this._siftDown(0);
        }
        return top.item;
    }

    contains(item) {
        return this._heap.some(e => e.item === item);
    }

    has(item) { return this.contains(item); }

    remove(item) {
        const idx = this._heap.findIndex(e => e.item === item);
        if (idx === -1) return;
        const last = this._heap.pop();
        if (idx < this._heap.length) {
            this._heap[idx] = last;
            this._bubbleUp(idx);
            this._siftDown(idx);
        }
    }

    // ── private helpers ──────────────────────────────────────────────────────
    _cmp(a, b) {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.seq - b.seq;
    }
    _bubbleUp(i) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this._cmp(this._heap[i], this._heap[parent]) < 0) {
                [this._heap[i], this._heap[parent]] = [this._heap[parent], this._heap[i]];
                i = parent;
            } else break;
        }
    }
    _siftDown(i) {
        const n = this._heap.length;
        while (true) {
            let smallest = i;
            const l = 2*i + 1, r = 2*i + 2;
            if (l < n && this._cmp(this._heap[l], this._heap[smallest]) < 0) smallest = l;
            if (r < n && this._cmp(this._heap[r], this._heap[smallest]) < 0) smallest = r;
            if (smallest === i) break;
            [this._heap[i], this._heap[smallest]] = [this._heap[smallest], this._heap[i]];
            i = smallest;
        }
    }
}