// A* Algorithm with working heuristic using Leaflet distance
function aStar(graph, start, goal) {
    const openSet = new PriorityQueue();
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    for (const node in graph) {
        gScore[node] = Infinity;
        fScore[node] = Infinity;
    }

    gScore[start] = 0;
    fScore[start] = heuristic(start, goal);
    openSet.enqueue(start, fScore[start]);

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue();

        if (current === goal) {
            const path = reconstructPath(cameFrom, current);
            const distance = calculatePathDistance(path);
            return { path, distance };
        }

        for (const neighbor of graph[current]) {
            const tentativeGScore = gScore[current] + neighbor.weight;

            if (tentativeGScore < gScore[neighbor.node]) {
                cameFrom[neighbor.node] = current;
                gScore[neighbor.node] = tentativeGScore;
                fScore[neighbor.node] = tentativeGScore + heuristic(neighbor.node, goal);
                openSet.enqueue(neighbor.node, fScore[neighbor.node]);
            }
        }
    }

    return { path: [], distance: Infinity };
}

// Heuristic using geographic distance in km
function heuristic(nodeA, nodeB) {
    const a = coordinates[nodeA];
    const b = coordinates[nodeB];
    if (!a || !b) {
        console.warn("Heuristic failed", nodeA, nodeB);
        return 0; // fallback
    }
    const latlngA = L.latLng(a);
    const latlngB = L.latLng(b);
    return latlngA.distanceTo(latlngB) / 1000; // km
}

// Reconstructs path from goal back to start
function reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom[current] !== undefined) {
        current = cameFrom[current];
        path.unshift(current);
    }
    return path;
}