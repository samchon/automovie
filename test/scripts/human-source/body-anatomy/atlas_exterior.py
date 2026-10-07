"""The atlas's own exterior, prepared as one boundary of the registration.

BodyParts3D models the skin as an organ with thickness: an outward sheet and
an inward sheet about two millimetres apart, one male individual's own
geometry. The inward sheet is that individual's under-skin face. The
registration takes it onto the target's fascial face, so the atlas's deep
tissue is carried under the target's skin and subcutaneous layer instead of
against the skin itself.

Two properties of this atlas are stated here because the map inherits them.
The atlas has no subcutaneous layer of its own between that sheet and its
muscles, and some of its muscle surfaces touch or pass the sheet; a map from
sheet to face cannot bring such a vertex inside, and the producer reports it
per member. And the atlas is male: its external genitalia are exterior that
the target mannequin does not have, so that exterior is removed from the
volume and from the correspondence before anything is matched.
All coordinates are metres in the sagittally centred atlas frame.
"""
import numpy as np
import trimesh
from scipy import ndimage, sparse


def skin_sheets(points, faces):
    """The outward and inward sheets of the atlas skin, both oriented outward.

    They are the edge-connected components enclosing the largest positive and
    the largest negative volume. The mean thickness between them is the shell
    volume over the outward area: one individual's modelled skin, an authored
    reference and not a population value.
    """
    mesh = trimesh.Trimesh(vertices=points, faces=faces, process=False)
    components = trimesh.graph.connected_components(mesh.face_adjacency, nodes=np.arange(len(faces)), min_len=1)
    volumes = np.asarray([float(trimesh.Trimesh(vertices=points, faces=faces[component], process=False).volume) for component in components])
    outer, inner = faces[components[int(volumes.argmax())]], faces[components[int(volumes.argmin())]][:, [0, 2, 1]]
    area = float(trimesh.Trimesh(vertices=points, faces=outer, process=False).area)
    account = {"components": len(components), "outerTriangles": int(len(outer)), "innerTriangles": int(len(inner)),
               "outerVolumeCubicMetres": float(volumes.max()), "innerVolumeCubicMetres": float(-volumes.min()),
               "outerAreaSquareMetres": area, "meanShellThicknessMetres": float((volumes.max() + volumes.min()) / area)}
    return outer, inner, account


def cap_rims(points, faces):
    """Close every open rim of a sheet with a fan to that rim's centroid.

    The fans exist only so a lattice can be filled; they are no part of any
    emitted surface.
    """
    directed = np.vstack((faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]))
    _, inverse, counts = np.unique(np.sort(directed, axis=1), axis=0, return_inverse=True, return_counts=True)
    rim = directed[counts[inverse.ravel()] == 1]
    if len(rim) == 0:
        return points, faces, 0
    vertices, compact = np.unique(rim, return_inverse=True)
    compact = compact.reshape(rim.shape)
    graph = sparse.coo_matrix((np.ones(len(rim)), (compact[:, 0], compact[:, 1])), shape=(len(vertices), len(vertices)))
    loops, label = sparse.csgraph.connected_components(graph, directed=False)
    centroids = np.asarray([points[vertices[label == loop]].mean(axis=0) for loop in range(loops)])
    # A fan triangle runs against its rim edge so the closed surface keeps one orientation.
    fans = np.column_stack((len(points) + label[compact[:, 0]], rim[:, 1], rim[:, 0]))
    return np.vstack((points, centroids)), np.vstack((faces, fans)), int(loops)


def remove_unmatched_exterior(body, grid, pubis, opening_metres=.02):
    """Remove the atlas's external genitalia from a body lattice.

    The region is the box in front of and below the pubic symphysis, given by
    the near-midline points of the hip bones: from their foremost point
    backward by the opening radius, from their top down to twice their own
    height below them, and within their own lateral extent of the midline.
    Inside it a morphological opening of the stated radius removes what is
    thinner than twice that radius and keeps the trunk and thighs, which are
    far thicker. The radius is an authored choice for this atlas. The cut
    surface this leaves carries no correspondence: it is a free boundary.
    """
    centres = grid.centres(np.ones(grid.shape, dtype=bool)).reshape(grid.shape + (3,))
    low, high = pubis.min(axis=0), pubis.max(axis=0)
    box = ((centres[..., 0] > low[0]) & (centres[..., 1] < high[1]) & (centres[..., 1] > low[1] - 2 * (high[1] - low[1]))
           & (centres[..., 2] > high[2] - opening_metres))
    rounds = max(1, int(round(opening_metres / grid.pitch)))
    opened = ndimage.binary_opening(body, iterations=rounds)
    kept = np.where(box, body & opened, body)
    return kept, {"boxCells": int(box.sum()), "removedCells": int((body & ~kept).sum()), "openingMetres": opening_metres,
                  "removedVolumeCubicMetres": float((body & ~kept).sum() * grid.pitch ** 3)}
