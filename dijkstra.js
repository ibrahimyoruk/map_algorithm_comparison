function dijkstra(graph, start, end) {
    const distances = {};
    const previous = {};
    const visited = new Set();
    const queue = new PriorityQueue();

    for (const node in graph) {
        distances[node] = node === start ? 0 : Infinity;
        previous[node] = null;
    }

    queue.enqueue(start, 0);

    while (!queue.isEmpty()) {
        const current = queue.dequeue();

        if (visited.has(current)) continue;
        visited.add(current);

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
