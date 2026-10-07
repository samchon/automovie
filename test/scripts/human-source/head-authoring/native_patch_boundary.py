"""Read one raw source replacement port from its selected polygon winding.

This source-authoring reader owns polygon ports before any human-generation
split. Native IDs are retained exactly. A pinched, nonorientable or multiply
bounded patch refuses rather than welding coordinates or picking a loop.
The consumer is the hybrid provider's patch authoring and provenance exporter.
The generation's triangle boundary reader retains its separate responsibility.
"""

from collections import defaultdict
from native_safe_integer import native_safe_integer


def native_patch_boundary(name, face_ordinals, polygons):
    edges = defaultdict(list)
    visited = set()
    for raw_index in face_ordinals:
        index = native_safe_integer(raw_index)
        if index >= len(polygons) or index in visited:
            raise ValueError(name + ": source patch has an invalid or duplicate native cell ordinal.")
        visited.add(index)
        face = polygons[index]
        for a, b in zip(face, face[1:] + face[:1]):
            edges[tuple(sorted((a, b)))].append((a, b))
    if any(len(values) > 2 for values in edges.values()):
        raise ValueError(name + ": source replacement patch is nonmanifold.")
    if any(len(values) == 2 and values[0] != values[1][::-1] for values in edges.values()):
        raise ValueError(name + ": inconsistent source winding across an interior edge.")
    boundary = [values[0] for values in edges.values() if len(values) == 1]
    successor = {}
    incoming = set()
    for a, b in boundary:
        if a in successor or b in incoming:
            raise ValueError(name + ": source patch boundary branches.")
        successor[a] = b
        incoming.add(b)
    if not successor or set(successor) != incoming:
        raise ValueError(name + ": source patch boundary does not close.")
    start = min(successor)
    cycle = [start]
    cursor = successor[start]
    while cursor != start:
        if cursor in cycle or len(cycle) >= len(successor):
            raise ValueError(name + ": source boundary cycle does not close once.")
        cycle.append(cursor)
        cursor = successor[cursor]
    if len(cycle) != len(successor):
        raise ValueError(name + ": source patch has multiple boundary cycles.")
    return cycle
