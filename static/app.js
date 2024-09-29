// Variables to store data points, centroids, and cluster assignments
let dataPoints = [];
let centroids = [];
let clusters = [];

// Function to draw the data points and centroids on the plot
function drawVisualization() {
    const svg = d3.select("#visualization")
                  .selectAll("svg")
                  .data([null])
                  .join("svg")
                  .attr("width", 600)
                  .attr("height", 400);

    // Clear previous content
    svg.selectAll("*").remove();

    // Draw data points
    svg.selectAll("circle.data-point")
       .data(dataPoints)
       .join("circle")
       .attr("class", "data-point")
       .attr("cx", d => d[0] * 600)
       .attr("cy", d => d[1] * 400)
       .attr("r", 5)
       .attr("fill", (d, i) => clusters[i] !== undefined ? d3.schemeCategory10[clusters[i]] : "#000");

    // Draw centroids
    svg.selectAll("circle.centroid")
       .data(centroids)
       .join("circle")
       .attr("class", "centroid")
       .attr("cx", d => d[0] * 600)
       .attr("cy", d => d[1] * 400)
       .attr("r", 7)
       .attr("fill", "#f00");
}

// Function to generate a new random dataset
function generateDataset() {
    const nPoints = 100; // Fixed number of points
    dataPoints = Array.from({ length: nPoints }, () => [Math.random(), Math.random()]);
    centroids = [];
    clusters = [];
    console.log("Generated data points:", dataPoints); // Log generated data points

    // Send the generated data points to the backend
    fetch('/set_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataPoints),  // Send the generated points as JSON
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to send data to the backend.');
        }
        drawVisualization(); // Draw the visualization with the generated data
    })
    .catch(error => {
        console.error('Error:', error.message);
        alert(`Error: ${error.message}`);
    });
}


// Function to step through the KMeans algorithm
function stepThroughKMeans() {
    const method = document.getElementById("init-method").value;

    console.log("Selected initialization method:", method); // Log for debugging
    console.log("Data being sent:", dataPoints);  // Debug log to check dataPoints

    // Send the data points along with the method
    fetch('/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: dataPoints,  // Ensure the data points are being sent under the 'data' key
            init_method: method  // Send the initialization method
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Server error:', text);  
                throw new Error('Failed to step through KMeans algorithm.');
            });
        }
        return response.json();  // Parse the response as JSON
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        console.log('Server response:', data); // Log for debugging
        centroids = data.centroids;
        clusters = data.clusters;
        drawVisualization();  // Draw the updated visualization
    })
    .catch(error => {
        console.error('Error:', error.message);
        alert(`Error: ${error.message}`);
    });
}


let convergedBool = false; // To track whether KMeans has converged
// Function to step through the KMeans algorithm

function stepBThroughKMeans() {
    if (convergedBool) return; // Stop if already converged
    const method = document.getElementById("init-method").value;

    console.log("Selected initialization method:", method); // Log for debugging
    console.log("Data being sent:", dataPoints);  // Debug log to check dataPoints
    fetch('/step', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: dataPoints,  // Ensure the data points are being sent under the 'data' key
            init_method: method  // Send the initialization method
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Server error:', text);
                throw new Error('Failed to step through KMeans algorithm.');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }

        // Update centroids, clusters, and check for convergence
        centroids = data.centroids;
        clusters = data.clusters;
        convergedBool = data.converged;
        console.log("Response from call: converged Bool:::", convergedBool)
        // Redraw the visualization
        drawVisualization();

        // If not converged, continue stepping through
        if (!convergedBool) {
            setTimeout(stepBThroughKMeans, 1000); // Call the next step after a delay (1 second)
        } else {
            console.log(convergedBool)
            alert('KMeans has converged!');
            convergedBool = false;
        }
    })
    .catch(error => {
        console.error('Error:', error.message);
        alert(`Error: ${error.message}`);
    });
}

// Function to reset the KMeans algorithm
function resetKMeans() {
    // Reset the global variables for data points, centroids, and clusters
    dataPoints = [];
    centroids = [];
    clusters = [];

    // Clear the visualization
    drawVisualization();

    // Notify the backend to reset KMeans instance
    fetch('/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Server error:', text);  // Log the server's HTML error response
                throw new Error('Failed to reset KMeans.');
            });
        }
        console.log('KMeans successfully reset.');
    })
    .catch(error => {
        console.error('Error:', error.message);
        alert(`Error: ${error.message}`);
    });
}

// Event listener for the Reset button
document.getElementById("reset-btn").addEventListener("click", resetKMeans);
// Event listener for step-through button
document.getElementById("step-btn").addEventListener("click", function() {
    convergedBool = false; // Reset the convergence flag
    stepBThroughKMeans(); // Start stepping through KMeans
});

// Event listeners for buttons
document.getElementById("generate-btn").addEventListener("click", generateDataset);
document.getElementById("run-btn").addEventListener("click", function() {
    // Only run KMeans if data has been generated
    if (dataPoints.length === 0) {
        alert("Please generate data first.");
        return;
    }
    stepThroughKMeans();
});

generateDataset();
