"""Closest point on a triangle surface, without an external spatial index.

Each query projects onto triangles by their face, edge and vertex Voronoi
regions. A bounding-volume hierarchy orders the search, but its leaf size
never limits the answer. Every triangle of a node lies inside that node's
axis-aligned box. The distance to that box is therefore a lower bound for
every triangle in it. A node is skipped only when that bound exceeds the
best triangle distance. Long triangles and opposing nearby sheets retain
their exact answers without a global triangle-radius search penalty.
"""
import numpy as np


def closest_on_triangles(points, a, b, c):
    """Closest point of each triangle (a, b, c) to its paired query point."""
    ab, ac, ap = b - a, c - a, points - a
    d1, d2 = np.einsum("ij,ij->i", ab, ap), np.einsum("ij,ij->i", ac, ap)
    bp = points - b
    d3, d4 = np.einsum("ij,ij->i", ab, bp), np.einsum("ij,ij->i", ac, bp)
    cp = points - c
    d5, d6 = np.einsum("ij,ij->i", ab, cp), np.einsum("ij,ij->i", ac, cp)
    va, vb, vc = d3 * d6 - d5 * d4, d5 * d2 - d1 * d6, d1 * d4 - d3 * d2
    with np.errstate(divide="ignore", invalid="ignore"):
        total = va + vb + vc
        result = a + ab * (vb / total)[:, None] + ac * (vc / total)[:, None]
        edge_bc = ((d4 - d3) / ((d4 - d3) + (d5 - d6)))[:, None]
        edge_ac = (d2 / (d2 - d6))[:, None]
        edge_ab = (d1 / (d1 - d3))[:, None]
    region = (va <= 0) & (d4 - d3 >= 0) & (d5 - d6 >= 0)
    result[region] = (b + (c - b) * edge_bc)[region]
    region = (vb <= 0) & (d2 >= 0) & (d6 <= 0)
    result[region] = (a + ac * edge_ac)[region]
    region = (vc <= 0) & (d1 >= 0) & (d3 <= 0)
    result[region] = (a + ab * edge_ab)[region]
    region = (d6 >= 0) & (d5 <= d6)
    result[region] = c[region]
    region = (d3 >= 0) & (d4 <= d3)
    result[region] = b[region]
    region = (d1 <= 0) & (d2 <= 0)
    result[region] = a[region]
    return result


class ClosestSurface:
    """Closest-point queries against one fixed, outward-oriented triangle surface."""

    def __init__(self, vertices, faces, candidates=16):
        self.corners = np.asarray(vertices, dtype=np.float64)[np.asarray(faces)]
        if len(self.corners) == 0 or not np.isfinite(self.corners).all():
            raise ValueError("A closest surface needs finite triangle geometry.")
        centres = self.corners.mean(axis=1)
        leaf_size = max(int(candidates), 1)
        self.nodes = []

        def build(ordinal):
            corners = self.corners[ordinal]
            low = np.nextafter(corners.min(axis=(0, 1)), -np.inf)
            high = np.nextafter(corners.max(axis=(0, 1)), np.inf)
            node = len(self.nodes)
            self.nodes.append(None)
            if len(ordinal) <= leaf_size:
                self.nodes[node] = (low, high, -1, -1, ordinal)
            else:
                axis = int(np.ptp(centres[ordinal], axis=0).argmax())
                order = ordinal[np.argsort(centres[ordinal, axis], kind="stable")]
                middle = len(order) // 2
                left, right = build(order[:middle]), build(order[middle:])
                self.nodes[node] = (low, high, left, right, None)
            return node

        build(np.arange(len(self.corners)))
        normals = np.cross(self.corners[:, 1] - self.corners[:, 0], self.corners[:, 2] - self.corners[:, 0])
        lengths = np.linalg.norm(normals, axis=1)
        if np.any(lengths == 0) or not np.isfinite(lengths).all():
            raise ValueError("A closest surface has a collapsed triangle.")
        self.normals = normals / lengths[:, None]

    def nearest(self, points):
        """Exact nearest triangle, using bounding-box lower bounds.

        Query batches bound temporary centroid tables without changing the
        search or its result. Equal-distance hits choose the lowest face
        ordinal, so expanding a candidate set cannot change a tie by order.
        """
        points = np.asarray(points, dtype=np.float64)
        if points.ndim != 2 or points.shape[1] != 3 or not np.isfinite(points).all():
            raise ValueError("Closest queries need finite three-dimensional points.")
        best = np.zeros_like(points)
        distance = np.full(len(points), np.inf)
        triangle = np.full(len(points), len(self.corners), dtype=np.int64)

        def lower_bound(node, ordinal):
            low, high = self.nodes[node][:2]
            outside = np.maximum(np.maximum(low - points[ordinal], points[ordinal] - high), 0.0)
            return np.linalg.norm(outside, axis=1)

        for start in range(0, len(points), 1024):
            stack = [(0, np.arange(start, min(start + 1024, len(points))))]
            while stack:
                node, pending = stack.pop()
                pending = pending[lower_bound(node, pending) <= distance[pending]]
                if len(pending) == 0:
                    continue
                _, _, left, right, faces = self.nodes[node]
                if faces is not None:
                    for face in faces:
                        corners = self.corners[face]
                        paired = np.broadcast_to(corners, (len(pending), 3, 3))
                        candidate = closest_on_triangles(points[pending], paired[:, 0], paired[:, 1], paired[:, 2])
                        length = np.linalg.norm(candidate - points[pending], axis=1)
                        closer = (length < distance[pending]) | ((length == distance[pending]) & (face < triangle[pending]))
                        selected = pending[closer]
                        best[selected], distance[selected], triangle[selected] = candidate[closer], length[closer], face
                else:
                    first_left = lower_bound(left, pending) <= lower_bound(right, pending)
                    left_first, right_first = pending[first_left], pending[~first_left]
                    # Near branches run first, then each far branch is pruned
                    # against the distance its own near branch established.
                    stack.extend(((right, left_first), (left, right_first), (right, right_first), (left, left_first)))
        if not np.isfinite(distance).all():
            raise ValueError("A closest surface query did not resolve a finite triangle distance.")
        return best, distance, triangle

    def query(self, points):
        best, distance, _ = self.nearest(points)
        return best, distance

    def signed(self, points):
        """Distance to the surface, negative on the inner side.

        The side is read from the normal of the closest triangle. At a sharp
        edge that is the face normal and not an edge pseudonormal, so a point
        just outside a crease can read as inside; the producer uses this only
        to steer a fit, and the package's own reader judges the result.
        """
        points = np.asarray(points, dtype=np.float64)
        best, distance, triangle = self.nearest(points)
        side = np.einsum("ij,ij->i", points - best, self.normals[triangle])
        return np.where(side < 0, -distance, distance)
