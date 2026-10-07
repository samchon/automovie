"""Physical edge-length graph of one native triangle surface.

Shared-source authors use graph geodesics to define intrinsic footprints.
Coordinates are canonical metres; the graph's ordinals are the input native
vertices and the weights are their Euclidean edge lengths. This graph is not
a continuous geodesic oracle or an anatomical measurement.
"""
import numpy as np
from scipy import sparse


def native_surface_graph(points, faces):
    edges = np.unique(np.sort(np.vstack((faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]])), axis=1), axis=0)
    length = np.linalg.norm(points[edges[:, 0]] - points[edges[:, 1]], axis=1)
    if np.any(length == 0) or not np.isfinite(length).all():
        raise ValueError("A native support graph has a collapsed edge.")
    return sparse.csr_matrix((np.tile(length, 2), (np.r_[edges[:, 0], edges[:, 1]], np.r_[edges[:, 1], edges[:, 0]])), shape=(len(points), len(points)))
