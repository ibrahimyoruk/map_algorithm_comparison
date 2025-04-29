class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    
    enqueue(element, priority) {
        this.elements.push({element, priority});
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    
    dequeue() {
        return this.elements.shift().element;
    }
    
    isEmpty() {
        return this.elements.length === 0;
    }
}


function dijkstra(graph, start, end) {
    const distances = {};
    const previous = {};
    const queue = new PriorityQueue();
    
    
    for (const node in graph) {
        distances[node] = node === start ? 0 : Infinity;
        queue.enqueue(node, distances[node]);
        previous[node] = null;
    }
    
    while (!queue.isEmpty()) {
        const current = queue.dequeue();
        
        
        if (current === end) break;
        
        
        for (const neighborObj of graph[current] || []) {
            const neighbor = neighborObj.node;
            const weight = neighborObj.weight;
            const newDistance = distances[current] + weight;
            
            if (newDistance < distances[neighbor]) {
                distances[neighbor] = newDistance;
                previous[neighbor] = current;
                queue.enqueue(neighbor, newDistance);
            }
        }
    }
    
    
    const path = [];
    let current = end;
    
    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }
    
    
    if (path.length === 1 && path[0] === end && start !== end) {
        return { distance: Infinity, path: [] };
    }
    
    return {
        distance: distances[end],
        path: path
    };
}