"""The nipple exclusion as one linear fill operator.

Recovered from `44dec918c:test/scripts/body-review/body_extraction/flatten.py`.
The region is the footprint of the source's own nipple targets on the
subdivided skin. Region vertices take the biharmonic fill of two fixed
surrounding rings (uniform-weight bilaplacian vanishing inside the region), so
`x_interior = operator @ x_boundary`. The map is linear, so an endpoint's
filled delta is the fill of its boundary delta. The sampler publishes the
operator; it does not apply it, so raw and filled samples stay separable.
"""
import numpy as np


def neighbours_of(topology):
    loop_start, loop_total, loop_vertex = topology["loop_start"], topology["loop_total"], topology["loop_vertex"]
    neighbours = {}
    for polygon in range(len(loop_start)):
        start, total = int(loop_start[polygon]), int(loop_total[polygon])
        ring = [int(loop_vertex[start + k]) for k in range(total)]
        for k in range(total):
            a, b = ring[k], ring[(k + 1) % total]
            neighbours.setdefault(a, set()).add(b)
            neighbours.setdefault(b, set()).add(a)
    return neighbours


def fill_operator(topology, region):
    """(interior, boundary, operator) of the biharmonic fill of `region`."""
    neighbours = neighbours_of(topology)
    interior = sorted(int(v) for v in region)
    if not interior:
        raise ValueError("The nipple region is empty; the source targets moved nothing.")
    inside = set(interior)
    ring1 = sorted({n for v in interior for n in neighbours[v] if n not in inside})
    first = set(ring1)
    ring2 = sorted({n for v in ring1 for n in neighbours[v] if n not in inside and n not in first})
    known = ring1 + ring2
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
    operator = -np.linalg.solve(rows[:, :n], rows[:, n:])
    return np.array(interior, dtype=np.int64), np.array(known, dtype=np.int64), operator
