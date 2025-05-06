// ✅ Ortak PriorityQueue (tek yerden tanımlanıyor)
class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
    }

    dequeue() {
        let lowestIndex = 0;
        for (let i = 1; i < this.elements.length; i++) {
            if (this.elements[i].priority < this.elements[lowestIndex].priority) {
                lowestIndex = i;
            }
        }
        return this.elements.splice(lowestIndex, 1)[0].element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

// Harita başlat
const map = L.map('map').setView([36.65, 29.12], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let graph = {};
let coordinates = {};
let startMarker = null;
let endMarker = null;
let routeLine = null;
let startNode = null;
let endNode = null;

// OSM verisini yükle
fetch('fethiye.json')
    .then(res => res.json())
    .then(osmData => {
        const parsed = parseOSMData(osmData);
        graph = parsed.edges;
        coordinates = parsed.coordinates;
        console.log("Veri yüklendi. Node sayısı:", Object.keys(graph).length);
    })
    .catch(error => console.error("Yükleme hatası:", error));

// Veriyi parse et
function parseOSMData(osmData) {
    const coordinates = {};
    const edges = {};

    osmData.elements.forEach(el => {
        if (el.type === "node") {
            coordinates[el.id] = [el.lat, el.lon];
            edges[el.id] = [];
        }
    });

    osmData.elements.forEach(el => {
        if (el.type === "way" && el.nodes) {
            for (let i = 0; i < el.nodes.length - 1; i++) {
                const from = el.nodes[i];
                const to = el.nodes[i + 1];

                if (coordinates[from] && coordinates[to]) {
                    const fromLatLng = L.latLng(coordinates[from]);
                    const toLatLng = L.latLng(coordinates[to]);
                    const distance = fromLatLng.distanceTo(toLatLng) / 1000;

                    edges[from].push({ node: to, weight: distance });
                    edges[to].push({ node: from, weight: distance });
                }
            }
        }
    });

    return { coordinates, edges };
}

function findNearestNode(latLng) {
    let minDistance = Infinity;
    let nearestNode = null;

    for (const node in coordinates) {
        const nodeLatLng = L.latLng(coordinates[node]);
        const distance = latLng.distanceTo(nodeLatLng);

        if (distance < minDistance) {
            minDistance = distance;
            nearestNode = node;
        }
    }

    return nearestNode;
}

function updateRoute() {
    if (!startNode || !endNode) return;

    const selectedAlgorithm = document.getElementById('algorithm').value;
    const startTime = performance.now();

    let result;
    if (selectedAlgorithm === "astar") {
        result = aStar(graph, startNode, endNode);
    } else {
        result = dijkstra(graph, startNode, endNode);
    }

    const endTime = performance.now();
    const calcTime = endTime - startTime;

    if (!result || result.distance === Infinity || !result.path || result.path.length === 0) {
        alert("No path found between the selected points!");
        return;
    }

    document.getElementById('distance').textContent = result.distance.toFixed(2) + " km";
    document.getElementById('calc-time').textContent = calcTime.toFixed(4) + " ms";
    document.getElementById('time').textContent = estimateTime(result.distance);

    const pathCoordinates = result.path.map(node => coordinates[node]);

    if (routeLine) {
        map.removeLayer(routeLine);
    }

    animateRoute(pathCoordinates);

    setTimeout(() => {
        if (routeLine) map.fitBounds(routeLine.getBounds());
    }, pathCoordinates.length * 300);
}

function estimateTime(distance) {
    const averageSpeed = 80;
    const hours = distance / averageSpeed;
    return hours < 1 ? `${(hours * 60).toFixed(0)} min` : `${hours.toFixed(1)} hours`;
}

function calculatePathDistance(path) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const edge = graph[path[i]].find(e => e.node === path[i + 1]);
        if (edge) total += edge.weight;
    }
    return total;
}

function animateRoute(pathCoords) {
    let index = 0;
    let drawnCoords = [];
    if (routeLine) map.removeLayer(routeLine);

    routeLine = L.polyline([], { color: '#3388ff', weight: 5, opacity: 0.8 }).addTo(map);

    function drawNext() {
        if (index >= pathCoords.length) return;
        drawnCoords.push(pathCoords[index++]);
        routeLine.setLatLngs(drawnCoords);
        setTimeout(drawNext, 300);
    }

    drawNext();
}

map.on('mousedown', function (e) {
    e.originalEvent.stopPropagation();
    const clickedNode = findNearestNode(e.latlng);

    if (!startNode) {
        startNode = clickedNode;
        document.getElementById('start-point').textContent = `Node ${startNode}`;
        if (startMarker) map.removeLayer(startMarker);
        startMarker = L.marker(coordinates[startNode], {
            icon: L.divIcon({ className: 'start-marker', html: '🟢', iconSize: [20, 20] })
        }).addTo(map);
    }
    else if (!endNode) {
        if (clickedNode === startNode) {
            alert("End point cannot be the same.");
            return;
        }

        endNode = clickedNode;
        document.getElementById('end-point').textContent = `Node ${endNode}`;
        if (endMarker) map.removeLayer(endMarker);
        endMarker = L.marker(coordinates[endNode], {
            icon: L.divIcon({ className: 'end-marker', html: '🔴', iconSize: [20, 20] })
        }).addTo(map);

        updateRoute();
    }
    else {
        alert("Both points already selected. Please clear the route.");
    }
});

document.getElementById('clear-btn').addEventListener('click', () => {
    startNode = endNode = null;
    ['start-point', 'end-point', 'distance', 'time', 'calc-time'].forEach(id => {
        document.getElementById(id).textContent = id.includes('point') ? 'Not selected' : '-';
    });
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
    if (routeLine) map.removeLayer(routeLine);
    startMarker = endMarker = routeLine = null;
});
