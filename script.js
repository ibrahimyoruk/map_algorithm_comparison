// Map initialization
const map = L.map('map').setView([39.0, 35.0], 6);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Global variables
let graph = {};
let coordinates = {};
let startMarker = null;
let endMarker = null;
let routeLine = null;
let startNode = null;
let endNode = null;

// Load graph data
fetch('graph-data.json')
    .then(response => response.json())
    .then(data => {
        graph = data.edges;
        coordinates = data.coordinates;

        
        for (const node in coordinates) {
            L.marker(coordinates[node], { interactive: false }).addTo(map);
        }
    })
    .catch(error => console.error('Error loading graph data:', error));


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

// Function to update the route
function updateRoute() {
    if (!startNode || !endNode) return;

    const selectedAlgorithm = document.getElementById('algorithm').value;

    const iterations = 1000; // 1000 itaration for speed test 
    const startTime = performance.now();

    let result;
    for (let i = 0; i < iterations; i++) {
        if (selectedAlgorithm === "astar") {
            result = aStar(graph, startNode, endNode);
        } else {
            result = dijkstra(graph, startNode, endNode);
        }
    }

    const endTime = performance.now();
    const calcTime = (endTime - startTime) / iterations; // Ortalama süre (ms)

    if (!result || result.distance === Infinity) {
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
        if (routeLine) {
            map.fitBounds(routeLine.getBounds());
        }
    }, pathCoordinates.length * 300);
}

function estimateTime(distance) {
    const averageSpeed = 80; // avarega speed (km/h)
    const hours = distance / averageSpeed;

    if (hours < 1) {
        const minutes = hours * 60;
        return `${minutes.toFixed(0)} min`;
    } else {
        return `${hours.toFixed(1)} hours`;
    }
}


function calculatePathDistance(path) {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const node = path[i];
        const nextNode = path[i + 1];
        const edge = graph[node].find(edge => edge.node === nextNode);
        if (edge) {
            totalDistance += edge.weight;
        }
    }
    return totalDistance;
}


function animateRoute(pathCoords) {
    let index = 0;
    let drawnCoords = [];

    if (routeLine) {
        map.removeLayer(routeLine);
    }

    routeLine = L.polyline([], {
        color: '#3388ff',
        weight: 5,
        opacity: 0.8
    }).addTo(map);

    function drawNextSegment() {
        if (index >= pathCoords.length) return;

        drawnCoords.push(pathCoords[index]);
        routeLine.setLatLngs(drawnCoords);
        index++;

        setTimeout(drawNextSegment, 300); 
    }

    drawNextSegment();
}




map.on('mousedown', function (e) {
    e.originalEvent.stopPropagation(); 

    const clickedNode = findNearestNode(e.latlng);

    if (!startNode) {
        startNode = clickedNode;
        document.getElementById('start-point').textContent = `Node ${startNode}`;

        if (startMarker) {
            map.removeLayer(startMarker);
        }

        startMarker = L.marker(coordinates[startNode], {
            icon: L.divIcon({
                className: 'start-marker',
                html: '🟢',
                iconSize: [20, 20]
            })
        }).addTo(map);
    }
    else if (!endNode) {
        if (clickedNode === startNode) {
            alert("End point cannot be the same as start point.");
            return;
        }

        endNode = clickedNode;
        document.getElementById('end-point').textContent = `Node ${endNode}`;

        if (endMarker) {
            map.removeLayer(endMarker);
        }

        endMarker = L.marker(coordinates[endNode], {
            icon: L.divIcon({
                className: 'end-marker',
                html: '🔴',
                iconSize: [20, 20]
            })
        }).addTo(map);

        updateRoute();
    }
    else {
        alert("Both points already selected. Please clear the route to select again.");
    }
});


document.getElementById('clear-btn').addEventListener('click', function () {
    startNode = null;
    endNode = null;

    document.getElementById('start-point').textContent = 'Not selected';
    document.getElementById('end-point').textContent = 'Not selected';
    document.getElementById('distance').textContent = '-';

    if (startMarker) {
        map.removeLayer(startMarker);
        startMarker = null;
    }

    if (endMarker) {
        map.removeLayer(endMarker);
        endMarker = null;
    }

    if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
});
