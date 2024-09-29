from flask import Flask, render_template, jsonify, request
import numpy as np
from kmeans import KMeans

app = Flask(__name__)
kmeans = None
data = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/set_data', methods=['POST'])
def set_data():
    global data
    data = request.json  # Expecting the data to be sent as JSON
    return jsonify({"message": "Data received."}), 200



@app.route('/run', methods=['POST'])
def run_kmeans():
    global kmeans, data
    req_data = request.get_json()
    if not req_data:
        return jsonify({"error": "No data provided or invalid JSON."}), 400
    if 'data' not in req_data:
        return jsonify({"error": "'data' key missing in request."}), 400
    data = np.array(req_data['data'])
    method = req_data.get('init_method', 'random')  # Use 'random' as default if not provided

    if data is None or len(data) == 0:
        return jsonify({"error": "Data not generated yet."}), 400
    
    kmeans = KMeans(k=3, init_method=method)
    clusters = kmeans.run_kmeans(data)
    
    return jsonify({
        'centroids': kmeans.centroids.tolist(),
        'clusters': clusters.tolist()
    })

@app.route('/step', methods=['POST'])
def step_kmeans():
    global kmeans, data
    
    # No need to get data from the request in every step, data should already be stored.
    if data is None or len(data) == 0:
        return jsonify({"error": "Data not generated yet."}), 400
    
    if kmeans is None:
        method = request.json.get('init_method', 'random')  # Default to 'random'
        kmeans = KMeans(k=3, init_method=method)
        
    data = np.array(request.get_json()['data'])
    # Perform a single step of KMeans
    step_result = kmeans.run_kmeans_step(data)
    
    # Return the current state after the step
    return jsonify({
        'centroids': step_result['centroids'],  # Updated centroids
        'clusters': step_result['clusters'],    # Cluster assignments
        'converged': step_result['converged']   # Whether it has converged
    })

@app.route('/reset', methods=['POST'])
def reset_kmeans():
    global kmeans, data
    kmeans = None  # Clear the current KMeans instance
    data = None  # Clear the data points
    return jsonify({"message": "KMeans reset successfully"}), 200


if __name__ == '__main__':
    app.run(host='localhost', port=3000)
