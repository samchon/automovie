"""Correspondence between the subdivided MPFB skin and the committed face basis.

The face basis's `Human` surface is the masked, once-subdivided MPFB skin,
cropped at the collar and clipped on the neutral plane Y = -0.085 m. Every
vertex of it is therefore one of two things: a source vertex of the subdivided
skin (an exact twin under the frame conversion), or a ring vertex that the
clip created on one crossing edge at the affine parameter of the neutral
intersection. `Correspondence` recovers both facts from positions alone and
refuses when either fails, because everything downstream (weights, endpoint
deltas, recipe verification) is read through it.

The frame is `x = x_blender`, `y = z_blender - offset`, `z = -y_blender`, with
`offset` solved from the top of the head, which both meshes keep. `evaluate`
turns any full-mesh sample into the basis's vertex order, so a channel
endpoint, the neutral and the recovery check go through one function.
"""
import gzip
import json
import os

import numpy as np
from mathutils import Vector, kdtree

from .session import ROOT

FACE_BASIS = os.path.join(ROOT, "test", "studies", "human-face", "connected-basis", "global-face", "basis.json.gz")
EXACT = 1e-7


def load_face_basis():
    with gzip.open(FACE_BASIS, "rt", encoding="utf-8") as file:
        return json.load(file)


def _tree(points):
    tree = kdtree.KDTree(len(points))
    for index, point in enumerate(points):
        tree.insert(Vector((float(point[0]), float(point[1]), float(point[2]))), index)
    tree.balance()
    return tree


def to_face_frame(sample, offset):
    face = np.empty_like(sample)
    face[:, 0] = sample[:, 0]
    face[:, 1] = sample[:, 2] - offset
    face[:, 2] = -sample[:, 1]
    return face


class Correspondence:
    def __init__(self, neutral_full, edges, basis):
        """Match every basis `Human` vertex to a source vertex or a source edge.

        `neutral_full` is the evaluated neutral in Blender space, `edges` the
        evaluated mesh's edge list, `basis` the committed face basis document.
        """
        surface = next(s for s in basis["surfaces"] if s["id"] == "Human")
        self.basis_id = basis["id"]
        self.face = np.array(surface["positions"], dtype=np.float64).reshape(-1, 3)
        self.offset = float(neutral_full[:, 2].max() - self.face[:, 1].max())
        source = to_face_frame(neutral_full, self.offset)
        tree = _tree(source)
        neighbours = {}
        for a, b in edges:
            neighbours.setdefault(int(a), []).append(int(b))
            neighbours.setdefault(int(b), []).append(int(a))
        twin = -np.ones(len(self.face), dtype=np.int64)
        ring = []  # (basis vertex, a, b, t)
        worst = 0.0
        for index, point in enumerate(self.face):
            _co, nearest, distance = tree.find(Vector(point.tolist()))
            if distance <= EXACT:
                twin[index] = nearest
                worst = max(worst, distance)
                continue
            # A ring vertex sits on a clipped segment whose ends need not be
            # the nearest source vertex, so every segment leaving one of the
            # eight nearest vertices is tried.
            found = None
            for _co, a, _distance in tree.find_n(Vector(point.tolist()), 8):
                a = int(a)
                for b in neighbours.get(a, []):
                    ab = source[b] - source[a]
                    length2 = float(np.dot(ab, ab))
                    if length2 == 0.0:
                        continue
                    t = float(np.dot(point - source[a], ab) / length2)
                    if not (0.0 < t < 1.0):
                        continue
                    gap = float(np.linalg.norm(source[a] + t * ab - point))
                    if gap <= EXACT and (found is None or gap < found[3]):
                        found = (a, b, t, gap)
            if found is None:
                raise ValueError("Basis vertex %d matches neither a source vertex nor a clipped source edge (nearest %.3e m, y %.4f)." % (index, distance, point[1]))
            ring.append((index, found[0], found[1], found[2]))
            worst = max(worst, found[3])
        self.twin = twin
        self.ring_index = np.array([r[0] for r in ring], dtype=np.int64)
        self.ring_a = np.array([r[1] for r in ring], dtype=np.int64)
        self.ring_b = np.array([r[2] for r in ring], dtype=np.int64)
        self.ring_t = np.array([r[3] for r in ring], dtype=np.float64)
        self.worst = worst
        if len(set(twin[twin >= 0].tolist())) != int((twin >= 0).sum()):
            raise ValueError("Two basis vertices share one source twin; the correspondence is not one to one.")

    def report(self):
        return {
            "faceBasis": self.basis_id,
            "offset": self.offset,
            "vertices": int(len(self.face)),
            "twins": int((self.twin >= 0).sum()),
            "ringVertices": int(len(self.ring_index)),
            "worstMatchMetres": float(self.worst),
        }

    def evaluate(self, sample):
        """Positions of the basis vertices, in the face frame, for one full-mesh sample."""
        source = to_face_frame(sample, self.offset)
        out = np.empty_like(self.face)
        matched = self.twin >= 0
        out[matched] = source[self.twin[matched]]
        if len(self.ring_index):
            out[self.ring_index] = source[self.ring_a] + self.ring_t[:, None] * (source[self.ring_b] - source[self.ring_a])
        return out

    def weights(self, base_weights, owners):
        """Dense (vertices, owners) attachment weights on the basis vertex order.

        Twins keep Blender's interpolated rows; a ring vertex takes the affine
        blend of its edge ends, which is what its position is.
        """
        out = np.zeros((len(self.face), len(owners)), dtype=np.float64)
        for index in range(len(self.face)):
            source = int(self.twin[index])
            if source < 0:
                continue
            row = base_weights[source]
            for column, owner in enumerate(owners):
                out[index, column] = row.get(owner, 0.0)
        for index, a, b, t in zip(self.ring_index, self.ring_a, self.ring_b, self.ring_t):
            for column, owner in enumerate(owners):
                out[index, column] = (1.0 - t) * base_weights[int(a)].get(owner, 0.0) + t * base_weights[int(b)].get(owner, 0.0)
        return out
