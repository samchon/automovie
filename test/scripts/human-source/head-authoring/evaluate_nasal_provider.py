"""Carry the actual native cap topology into a three-dimensional vestibule.

The original130-cell embedded source patch supplies its cap incidence and
interior native support; a boundary-only fan or projection triangulation cannot
replace it. The source-family normal-cone fit supplies one fixed extrusion axis
whose positive facet certificate covers every native state. All new vertices
inherit one exact original native parent and its bindings. The original rim is
shared with the host, and paired source conditions retain one fixed population.
This source construction supplies neither measured airway nor clinical normal.
"""

from dataclasses import asdict, dataclass

import numpy as np

from native_patch_boundary import native_patch_boundary


@dataclass(frozen=True)
class _NasalSection:
    liningDepthMillimetres: float
    rimSupportDepthMillimetres: float


def evaluate_nasal_provider(vertices, polygons, authority, sockets, recipe, axes):
    positions = vertices.tolist()
    removed = set()
    appended = []
    records = []
    for side in ("right", "left"):
        dimensions = _NasalSection(**recipe[side])
        if not np.isfinite(list(asdict(dimensions).values())).all():
            raise ValueError(side + ": nasal section dimensions must be finite.")
        section = dimensions.rimSupportDepthMillimetres / 1000
        depth = dimensions.liningDepthMillimetres / 1000
        if section <= 0 or depth <= section:
            raise ValueError(side + ": nasal lining needs positive depth beyond its rim support.")
        socket = next(port for port in sockets["ports"] if port["side"] == side)
        selected = socket["nativePolygonOrdinals"]
        cycle = native_patch_boundary("nasal-socket-" + side, selected, polygons)
        if cycle != socket["orderedNativeBoundary"]:
            raise ValueError("Nasal intrinsic source patch disagrees with its fixed port.")
        source_cells = [polygons[index] for index in selected]
        source_ids = sorted(set(vertex for cell in source_cells for vertex in cell))
        fit = next(axis for axis in axes["axes"] if axis["side"] == side)
        outward = np.asarray(fit["outwardAxisBlender"], dtype=np.float64)
        if not np.isfinite(outward).all() or not np.isclose(np.linalg.norm(outward), 1):
            raise ValueError("Nasal source axis must be its fitted unit direction.")
        cells = vertices[np.asarray(source_cells)]
        triangles = np.concatenate((cells[:, [0, 1, 2]], cells[:, [0, 2, 3]]))
        normals = np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])
        lengths = np.linalg.norm(normals, axis=1)
        if np.any(lengths == 0) or not np.isfinite(normals).all():
            raise ValueError(side + ": intrinsic native cap has a degenerate source facet.")
        signed = normals @ outward
        if np.any(signed <= 0):
            raise ValueError(side + ": current source cap leaves its registered normal cone.")
        inward = -outward
        support = list(range(len(positions), len(positions) + len(cycle)))
        positions.extend((vertices[cycle] + inward * section).tolist())
        cap_start = len(positions)
        native_to_cap = {native: cap_start + ordinal for ordinal, native in enumerate(source_ids)}
        positions.extend((vertices[source_ids] + inward * depth).tolist())
        cap_boundary = [native_to_cap[native] for native in cycle]
        for previous, ring in ((cycle, support), (support, cap_boundary)):
            for index, first in enumerate(previous):
                nxt = (index + 1) % len(cycle)
                appended.append([first, previous[nxt], ring[nxt], ring[index]])
        cap_cells = [[native_to_cap[native] for native in cell] for cell in source_cells]
        appended.extend(cap_cells)
        removed.update(selected)
        bindings = [{"id": target, "nativeParents": [{"id": native, "weight": 1}],
                     "offsetBlenderMetres": (inward * section).tolist()}
                    for native, target in zip(cycle, support)]
        bindings.extend({"id": native_to_cap[native], "nativeParents": [{"id": native, "weight": 1}],
                         "offsetBlenderMetres": (inward * depth).tolist()} for native in source_ids)
        records.append({"side": side, "dimensions": asdict(dimensions),
                        "removedNativePolygonOrdinals": selected, "sharedNativeRim": cycle,
                        "generatedRings": [support, cap_boundary], "capNativeParents": source_ids,
                        "capSourceCells": selected, "terminalCapCells": cap_cells,
                        "appendedBindings": bindings, "outwardSourceAxis": outward.tolist(),
                        "minimumCurrentNativeNormalDot": float((signed / lengths).min()),
                        "chart": "embedded original native130-cell patch; source-family normal-cone ruled sections",
                        "qualification": "authored3D source section and closed vestibule; not clinical aperture or airway"})
    retained = [polygon for index, polygon in enumerate(polygons) if index not in removed]
    return np.asarray(positions, dtype="<f8"), retained + appended, records
