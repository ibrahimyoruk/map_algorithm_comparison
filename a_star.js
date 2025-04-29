function aStar(graph, start, goal) {
    const openSet = new Set([start]);
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    for (const node of Object.keys(graph)) {
        gScore[node] = Infinity;
        fScore[node] = Infinity;
    }

    gScore[start] = 0;
    fScore[start] = heuristic(start, goal);

    while (openSet.size > 0) {
        let current = [...openSet].reduce((a, b) => fScore[a] < fScore[b] ? a : b);

        if (current === goal) {
            const path = reconstructPath(cameFrom, current);
            const distance = calculatePathDistance(path);
            return { path, distance };
        }

        openSet.delete(current);

        for (const neighbor of graph[current]) {
            const tentativeGScore = gScore[current] + neighbor.weight;

            if (tentativeGScore < gScore[neighbor.node]) {
                cameFrom[neighbor.node] = current;
                gScore[neighbor.node] = tentativeGScore;
                fScore[neighbor.node] = gScore[neighbor.node] + heuristic(neighbor.node, goal);
                openSet.add(neighbor.node);
            }
        }
    }

    return { path: [], distance: Infinity };
}

function heuristic(a, b) {
    if (coordinates[a] && coordinates[b]) {
        const dx = coordinates[a][0] - coordinates[b][0];
        const dy = coordinates[a][1] - coordinates[b][1];
        return Math.sqrt(dx * dx + dy * dy);
    }
    return Infinity;
}

function reconstructPath(cameFrom, current) {
    const totalPath = [current];
    while (cameFrom[current]) {
        current = cameFrom[current];
        totalPath.unshift(current);
    }
    return totalPath;
}
