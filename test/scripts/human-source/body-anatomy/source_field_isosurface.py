"""Extract the regular level of one piecewise-linear tetrahedral source field.

Every grid cube uses the same six-tetrahedron Freudenthal subdivision. Source
edge ordinals, not positional welding, own shared intersection vertices. The
binary field values are 0/1 and the declared material level is .5, so a level
vertex never coincides with a source-grid vertex. This is the tetrahedral-cell
method of Doi/Koide (1991), doi:10.1587/e74-d_1_214; it constructs a PL source
interface rather than repairing a previous marching-cubes triangle mesh.
"""
import numpy as np


def extract_source_field(field, origin, pitch):
    corners = np.asarray([(index & 1, (index >> 1) & 1, (index >> 2) & 1) for index in range(8)], dtype=np.int64)
    tetrahedra = ((0, 1, 3, 7), (0, 3, 2, 7), (0, 2, 6, 7), (0, 6, 4, 7), (0, 4, 5, 7), (0, 5, 1, 7))
    size = np.asarray(field.shape) - 1
    population = np.zeros(tuple(size), dtype=np.uint8)
    for corner in corners:
        population += field[tuple(slice(int(at), int(at + length)) for at, length in zip(corner, size))]
    active = np.argwhere((population > 0) & (population < 8))
    vertices, faces, edge_vertices = [], [], {}
    strides = np.asarray((field.shape[1] * field.shape[2], field.shape[2], 1), dtype=np.int64)

    def intersection(first, second, coordinates, ordinals):
        a, b = int(ordinals[first]), int(ordinals[second])
        key = (min(a, b), max(a, b))
        if key not in edge_vertices:
            edge_vertices[key] = len(vertices)
            vertices.append(origin + (coordinates[first] + coordinates[second]) * (.5 * pitch))
        return edge_vertices[key]

    for cell in active:
        coordinates = corners + cell
        ordinals = coordinates @ strides
        signs = field[coordinates[:, 0], coordinates[:, 1], coordinates[:, 2]]
        for tetrahedron in tetrahedra:
            inside = [corner for corner in tetrahedron if signs[corner]]
            outside = [corner for corner in tetrahedron if not signs[corner]]
            if not inside or not outside:
                continue
            outward = coordinates[outside].mean(axis=0) - coordinates[inside].mean(axis=0)
            if len(inside) == 1:
                polygon = [intersection(inside[0], corner, coordinates, ordinals) for corner in outside]
            elif len(outside) == 1:
                polygon = [intersection(corner, outside[0], coordinates, ordinals) for corner in inside]
            else:
                polygon = [intersection(inside[a], outside[b], coordinates, ordinals) for a, b in ((0, 0), (0, 1), (1, 1), (1, 0))]
            for at in range(1, len(polygon) - 1):
                triangle = [polygon[0], polygon[at], polygon[at + 1]]
                a, b, c = (vertices[index] for index in triangle)
                if np.dot(np.cross(b - a, c - a), outward) < 0:
                    triangle.reverse()
                faces.append(triangle)
    return np.asarray(vertices, dtype=np.float64), np.asarray(faces, dtype=np.int64)
