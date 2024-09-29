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


// Event listeners for buttons
document.getElementById("generate-btn").addEventListener("click", generateDataset);
document.getElementById("step-btn").addEventListener("click", function() {
    // Only run KMeans if data has been generated
    if (dataPoints.length === 0) {
        alert("Please generate data first.");
        return;
    }
    stepThroughKMeans();
});

// Initial visualization setup
generateDataset();
