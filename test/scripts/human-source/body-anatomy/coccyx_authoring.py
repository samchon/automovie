"""Author the coccyx in the target frame, below the registered sacrum.

The atlas has no coccyx member; the earlier authored one was built in atlas
space and touched the atlas skin. This one is built where it is used: it
starts at the apex of the registered sacrum, continues the sacrum's own
distal direction and curves forward, tapering to a blunt tip. It is a loft
of elliptical rings, symmetric about the sagittal plane.

Every dimension here is authored, and none is a measurement: the base takes
the width and depth of the sacral apex it meets, the length is three tenths
of the sacrum's length, and the forward curve and taper are conventions of
this producer. No source for coccygeal dimensions was read. The part is a
plausible continuation of the sacrum for a generic body and claims nothing
about segment count, fusion or any individual. Its containment under the
fascial face is read back by the caller and reported, not enforced here.
Coordinates are metres in the target neutral frame, +X left, +Y up, +Z
anterior.
"""
import numpy as np

RINGS = 7
SIDES = 16
LENGTH_OVER_SACRUM = .3
FORWARD_CURVE = .25
TIP_WIDTH = .25
TIP_DEPTH = .3


def author_coccyx(sacrum):
    """Vertices and outward triangles of a coccyx continuing a registered sacrum."""
    low, high = sacrum[:, 1].min(), sacrum[:, 1].max()
    apex = sacrum[sacrum[:, 1] < low + .005]
    base = np.asarray([0.0, apex[:, 1].mean(), apex[:, 2].mean()])
    width, depth = float(np.ptp(apex[:, 0])), float(np.ptp(apex[:, 2]))
    lower = sacrum[sacrum[:, 1] < low + .03].mean(axis=0)
    upper = sacrum[(sacrum[:, 1] >= low + .03) & (sacrum[:, 1] < low + .06)].mean(axis=0)
    along = np.asarray([0.0, lower[1] - upper[1], lower[2] - upper[2]])
    along /= np.linalg.norm(along)
    lateral = np.asarray([1.0, 0.0, 0.0])
    forward = np.cross(lateral, along)
    if forward[2] < 0:
        forward = -forward
    length = LENGTH_OVER_SACRUM * (high - low)
    points = []
    angles = np.arange(SIDES) * 2 * np.pi / SIDES
    for ring in range(RINGS):
        s = ring / RINGS
        centre = base + length * (s * along + FORWARD_CURVE * s * s * forward)
        tangent = along + 2 * FORWARD_CURVE * s * forward
        tangent /= np.linalg.norm(tangent)
        normal = np.cross(lateral, tangent)
        half_width = width / 2 * (1 - (1 - TIP_WIDTH) * s)
        half_depth = depth / 2 * (1 - (1 - TIP_DEPTH) * s)
        points.extend(centre + half_width * np.cos(angle) * lateral + half_depth * np.sin(angle) * normal for angle in angles)
    tip = base + length * (along + FORWARD_CURVE * forward)
    points.append(base)
    points.append(tip)
    points = np.asarray(points)
    faces = []
    for ring in range(RINGS - 1):
        for side in range(SIDES):
            a, b = ring * SIDES + side, ring * SIDES + (side + 1) % SIDES
            faces.extend(((a, b, a + SIDES), (b, b + SIDES, a + SIDES)))
    centre_index, tip_index, last = RINGS * SIDES, RINGS * SIDES + 1, (RINGS - 1) * SIDES
    for side in range(SIDES):
        faces.append((centre_index, (side + 1) % SIDES, side))
        faces.append((tip_index, last + side, last + (side + 1) % SIDES))
    faces = np.asarray(faces, dtype=np.int64)
    corners = points[faces]
    volume = float(np.einsum("ij,ij->i", corners[:, 0], np.cross(corners[:, 1], corners[:, 2])).sum() / 6)
    if volume < 0:
        faces = faces[:, [0, 2, 1]]
    account = {"lengthMetres": float(length), "baseWidthMetres": width, "baseDepthMetres": depth, "volumeCubicMetres": abs(volume),
               "authored": {"lengthOverSacrumLength": LENGTH_OVER_SACRUM, "forwardCurve": FORWARD_CURVE, "tipWidthOverBase": TIP_WIDTH, "tipDepthOverBase": TIP_DEPTH},
               "qualification": "Authored continuation of the registered sacrum; every dimension is a producer convention and no coccygeal measurement was read"}
    return points, faces, account
