import numpy as np

class KMeans:
    def __init__(self, k, init_method="random"):
        self.k = k
        self.init_method = init_method
        self.centroids = None
        self.current_clusters = None
        self.converged = False

    def initialize_centroids(self, data):
        if self.init_method == "random":
            # Randomly select k unique data points as initial centroids
            self.centroids = data[np.random.choice(data.shape[0], self.k, replace=False)]
        
        elif self.init_method == "farthest_first":
            # Farthest first initialization
            self.centroids = [data[np.random.randint(data.shape[0])]]  # Randomly select the first centroid
            while len(self.centroids) < self.k:
                distances = np.array([min(np.linalg.norm(point - centroid) for centroid in self.centroids) for point in data])
                farthest_point_index = np.argmax(distances)  # Get the point that is farthest from the centroids
                self.centroids.append(data[farthest_point_index])

        elif self.init_method == "kmeans++":
            # KMeans++ initialization
            self.centroids = [data[np.random.randint(data.shape[0])]]  # Randomly select the first centroid
            while len(self.centroids) < self.k:
                distances = np.array([min(np.linalg.norm(point - centroid) ** 2 for centroid in self.centroids) for point in data])
                probabilities = distances / distances.sum()  # Normalize the distances to get probabilities
                selected_index = np.random.choice(range(len(data)), p=probabilities)  # Select index based on probabilities
                self.centroids.append(data[selected_index])

        elif self.init_method == "manual":
            # Manual initialization logic here
            # For this example, you can assume data is passed directly as centroids from the frontend
            raise NotImplementedError("Manual initialization should be handled in the frontend.")
        else:
            raise ValueError("Unknown initialization method")
    
    def assign_points_to_clusters(self, data):
        clusters = []
        for point in data:
            distances = np.linalg.norm(point - self.centroids, axis=1)
            clusters.append(np.argmin(distances))
        return np.array(clusters)
    
    def update_centroids(self, data, clusters):
        new_centroids = []
        for i in range(self.k):
            cluster_points = data[clusters == i]
            if len(cluster_points) > 0:
                new_centroids.append(cluster_points.mean(axis=0))
        return np.array(new_centroids)
    
    def convergedMethod(self, old_centroids, new_centroids):
        return np.allclose(old_centroids, new_centroids)
    
    def run_kmeans(self, data, max_steps=100):
        self.initialize_centroids(data)
        for step in range(max_steps):
            clusters = self.assign_points_to_clusters(data)
            new_centroids = self.update_centroids(data, clusters)
            if self.convergedMethod(self.centroids, new_centroids):
                break
            self.centroids = new_centroids
        return clusters
    
    def run_kmeans_step(self, data):
        self.converged = False
        if self.centroids is None:
            # Initialize centroids if not done yet
            self.initialize_centroids(data)

        # Perform one step of KMeans if not converged
        if not self.converged:
            old_centroids = self.centroids
            # Assign points to clusters
            self.current_clusters = self.assign_points_to_clusters(data)
            # Update centroids based on current clusters
            new_centroids = self.update_centroids(data, self.current_clusters)
            
            # Check if centroids have converged
            if self.convergedMethod(old_centroids, new_centroids):
                self.converged = True  # Set converged flag to True
            
            self.centroids = new_centroids  # Update centroids after the step

        # Return the current state after one step (even if not converged)
        return {
            'centroids': self.centroids.tolist(),
            'clusters': self.current_clusters.tolist(),
            'converged': self.converged  # Inform the front end if it's done
        }
