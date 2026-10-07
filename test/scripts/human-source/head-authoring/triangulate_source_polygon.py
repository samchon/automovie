"""Triangulate a simple source-plane polygon without assuming a radial chart.

The source provider's cap consumes actual boundary order, including concavity.
Ear clipping retains every existing polygon edge. Crossings and degeneracy
refuse before geometry is emitted; neither angular sorting nor an arbitrary
centre repairs a contour. Coordinates are source-plane metres.
"""

import numpy as np


def triangulate_source_polygon(points):
    def cross(a, b, c):
        first = b - a
        second = c - a
        return first[0] * second[1] - first[1] * second[0]

    count = len(points)
    scale = float(np.ptp(points, axis=0).max())
    tolerance = np.finfo(float).eps * scale * scale * count * 16
    if count < 3 or not np.isfinite(points).all() or scale == 0:
        raise ValueError("Source cap requires a finite nondegenerate polygon.")
    for first in range(count):
        a, b = points[first], points[(first + 1) % count]
        for second in range(first + 2, count):
            if first == 0 and second == count - 1:
                continue
            c, d = points[second], points[(second + 1) % count]
            if cross(a, b, c) * cross(a, b, d) < 0 and cross(c, d, a) * cross(c, d, b) < 0:
                raise ValueError("Source cap boundary crosses in its supplied chart.")
    shifted = np.roll(points, -1, axis=0)
    area = np.sum(points[:, 0] * shifted[:, 1] - points[:, 1] * shifted[:, 0])
    if abs(area) <= tolerance:
        raise ValueError("Source cap has zero signed chart area.")
    orientation = np.sign(area)
    remaining = list(range(count))
    triangles = []
    while len(remaining) > 3:
        for ordinal, middle in enumerate(remaining):
            first = remaining[ordinal - 1]
            last = remaining[(ordinal + 1) % len(remaining)]
            a, b, c = points[[first, middle, last]]
            if orientation * cross(a, b, c) <= tolerance:
                continue
            occupied = False
            for other in remaining:
                if other in (first, middle, last):
                    continue
                p = points[other]
                if all(orientation * value >= -tolerance for value in (cross(a, b, p), cross(b, c, p), cross(c, a, p))):
                    occupied = True
                    break
            if occupied:
                continue
            triangles.append([first, middle, last])
            del remaining[ordinal]
            break
        else:
            raise ValueError("Source cap admits no nondegenerate ear in its current chart.")
    if orientation * cross(*points[remaining]) <= tolerance:
        raise ValueError("Source cap ends in a degenerate triangle.")
    triangles.append(remaining)
    return triangles
