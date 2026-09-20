"""Remove the nipple protrusions from every sampled state.

The product excludes genital and nipple geometry from the body basis, its
controls, presets and exports (#2428, restated in #2519 and by the user on
2026-09-21). The genitals are helper geometry that the mask already drops;
the nipples are part of the skin itself, so the basis cannot ship the source
skin as it is. This module replaces the nipple region with a smooth fill of
the surrounding chest before the clip stencil runs, for the neutral and for
every endpoint state alike.

The region is not typed by hand. It is the set of subdivided skin vertices
that the source's own `breast/nipple-size-incr` and `breast/nipple-point-incr`
targets move: those targets exist to shape exactly the vertices this basis
must not carry, so their footprint is the definition. The fill is biharmonic:
region vertices take the positions that make the uniform-weight
bilaplacian vanish inside the region with two rings of surrounding vertices
fixed, so the fill continues the chest's curvature and slope rather than
stretching a flat membrane across the hole (a harmonic fill was tried first
and read as a flat disc on the breast). Because that map is linear in the
fixed vertices, an endpoint's delta inside the region is the fill of its
surrounding delta, so shape channels still deform the chest coherently and
the neutral recovery test still holds to the last bit.

The receipt records the region size and the largest displacement the fill
applied at the neutral.
"""
import numpy as np


class NippleFlattener:
    def __init__(self, topology, region):
        """Prepare the harmonic solve for a vertex region on the subdivided skin.

        `region` is an array of full-mesh vertex indices; `topology` supplies
        the loop arrays from which vertex adjacency is read.
        """
        loop_start, loop_total, loop_vertex = topology["loop_start"], topology["loop_total"], topology["loop_vertex"]
        neighbours = {}
        for polygon in range(len(loop_start)):
            start, total = int(loop_start[polygon]), int(loop_total[polygon])
            ring = [int(loop_vertex[start + k]) for k in range(total)]
            for k in range(total):
                a, b = ring[k], ring[(k + 1) % total]
                neighbours.setdefault(a, set()).add(b)
                neighbours.setdefault(b, set()).add(a)
        interior = sorted(int(v) for v in region)
        inside = set(interior)
        ring1 = sorted({n for v in interior for n in neighbours[v] if n not in inside})
        ring2 = sorted({n for v in ring1 for n in neighbours[v] if n not in inside and n not in set(ring1)})
        known = ring1 + ring2
        if len(interior) == 0:
            raise ValueError("The nipple region is empty; the source targets moved nothing.")
        # Uniform Laplacian over the interior and its two rings; the
        # bilaplacian of an interior vertex reaches two rings out, so the
        # second ring is what pins the fill's slope to the surrounding skin.
        order = interior + known
        index = {v: i for i, v in enumerate(order)}
        laplacian = np.zeros((len(order), len(order)))
        for v in order:
            i = index[v]
            for neighbour in neighbours[v]:
                laplacian[i, i] += 1.0
                if neighbour in index:
                    laplacian[i, index[neighbour]] -= 1.0
        bilaplacian = laplacian @ laplacian
        n = len(interior)
        rows = bilaplacian[:n, :]
        # x_interior = -(B_II)^-1 B_IK x_known, precomputed once.
        self.operator = -np.linalg.solve(rows[:, :n], rows[:, n:])
        self.interior = np.array(interior, dtype=np.int64)
        self.boundary = np.array(known, dtype=np.int64)

    def apply(self, positions):
        """Return a copy with the region replaced by its biharmonic fill."""
        out = positions.copy()
        out[self.interior] = self.operator @ positions[self.boundary]
        return out

    def report(self, neutral):
        moved = np.linalg.norm(self.apply(neutral)[self.interior] - neutral[self.interior], axis=1)
        return {
            "regionVertices": int(len(self.interior)),
            "boundaryVertices": int(len(self.boundary)),
            "maxDisplacementMetres": float(moved.max()),
            "meanDisplacementMetres": float(moved.mean()),
        }
