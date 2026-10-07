"""Author paired complete pinna section charts against their shared native root.

The source batch consumes this operator after the head envelope and before
nasal insertion/common-root compilation. All members read one unchanged input;
their differences compose once. The source-private profile anchors follow
actual native sample IDs. Public numerical requests contain no curve or vertex.
Convex outline and source-local fork supports are authoring conventions, never
clinical helix/concha segmentation or measured cartilage thickness. The dense
attachment cycle remains one shared scalp/pinna definition. Sulcus recession
acts on both sides of that cycle, not on a separate embedded ear primitive.
"""

from dataclasses import asdict
import numpy as np
from scipy.spatial import ConvexHull, cKDTree
from EarSection import EarSection


def evaluate_ear_sections(positions, polygons, authority, recipe):
    """Evaluate paired source sections from one unchanged native state."""
    result = positions.copy()
    xyz = positions[np.asarray(polygons)]
    face_normals = np.cross(xyz[:, 1] - xyz[:, 0], xyz[:, 2] - xyz[:, 0])
    normals = np.zeros_like(positions)
    for ordinal in range(4):
        np.add.at(normals, np.asarray(polygons)[:, ordinal], face_normals)
    # Source vertex normals define front/back section ownership, not a painted
    # normal-map substitute. No caller input changes this incidence.
    lengths = np.linalg.norm(normals, axis=1)
    normals[lengths > 0] /= lengths[lengths > 0, None]
    records = []
    for side, sign in (("right", -1), ("left", 1)):
        request = EarSection(**recipe[side])
        if not np.isfinite(list(asdict(request).values())).all():
            raise ValueError(side + ": ear section differences must be finite.")
        port = next(port for port in authority["replacementPorts"] if port["name"] == "ear-" + side)
        source_region = next(region for region in authority["regions"] if region["name"] == "ear-" + side)
        root_ids = port["orderedNativeBoundary"]
        ids = np.asarray(sorted(set(source_region["nativeSamples"]) | set(root_ids)), dtype=int)
        points = positions[ids]
        roots = positions[root_ids]
        lower, upper = points[:, 1:].min(axis=0), points[:, 1:].max(axis=0)
        extent = upper - lower
        if np.any(extent <= 0):
            raise ValueError(side + ": pinna support lacks a positive source span.")
        root_distance = cKDTree(roots).query(points)[0]
        support = recipe["foldSupportMillimetres"] / 1000
        if not np.isfinite(support) or support <= 0:
            raise ValueError("Ear source fold support must be finite and positive.")
        t = np.clip(root_distance / support, 0, 1)
        attachment = t * t * (3 - 2 * t)
        front = np.clip(sign * normals[ids, 0], 0, 1)
        def source_anchor(y_ratio, z_ratio):
            target = lower + extent * np.array([y_ratio, z_ratio])
            candidates = np.flatnonzero(front > 0)
            if len(candidates) == 0:
                raise ValueError(side + ": no outward source surface for its profile anchor.")
            chosen = candidates[np.argmin(np.linalg.norm(points[candidates, 1:] - target, axis=1))]
            return int(ids[chosen])
        anchors = {
            "stem": source_anchor(0.46, 0.23), "fork": source_anchor(0.48, 0.61),
            "superior": source_anchor(0.52, 0.88), "inferior": source_anchor(0.22, 0.73),
            "tragus": source_anchor(0.12, 0.48), "antitragus": source_anchor(0.28, 0.25),
        }
        outline = ConvexHull(points[:, 1:]).vertices
        outline_ids = ids[outline].tolist()
        def stroke_weight(native_ids):
            curve = positions[native_ids, 1:]
            squared = np.full(len(ids), np.inf)
            for first, last in zip(curve[:-1], curve[1:]):
                edge = last - first
                denominator = float(edge @ edge)
                if denominator == 0:
                    raise ValueError(side + ": source fold has a degenerate segment.")
                along = np.clip((points[:, 1:] - first) @ edge / denominator, 0, 1)
                delta = points[:, 1:] - first - along[:, None] * edge
                squared = np.minimum(squared, np.sum(delta * delta, axis=1))
            return np.exp(-squared / support ** 2) * front * attachment
        weights = {
            "helix": stroke_weight(outline_ids + outline_ids[:1]),
            "antihelix": stroke_weight([anchors["stem"], anchors["fork"]]),
            "superiorCrus": stroke_weight([anchors["fork"], anchors["superior"]]),
            "inferiorCrus": stroke_weight([anchors["fork"], anchors["inferior"]]),
        }
        lobe = next(region for region in authority["regions"] if region["name"] == "lobule-" + side)
        lobe_points = positions[lobe["nativeSamples"]]
        lobe_top = float(lobe_points[:, 2].max())
        lobe_fraction = np.clip((lobe_top - points[:, 2]) / (lobe_top - float(points[:, 2].min())), 0, 1)
        lobe_weight = lobe_fraction * lobe_fraction * (3 - 2 * lobe_fraction) * attachment
        weights["helix"] *= 1 - lobe_weight
        delta_x = (request.helixRimProjectionOffsetMillimetres * weights["helix"] +
                   request.antihelixProjectionOffsetMillimetres * weights["antihelix"] +
                   request.superiorCrusProjectionOffsetMillimetres * weights["superiorCrus"] +
                   request.inferiorCrusProjectionOffsetMillimetres * weights["inferiorCrus"])
        floor_anchors = {}
        for name, amount in (("cymba-conchae", request.cymbaFloorRecessionOffsetMillimetres),
                             ("cavum-conchae", request.cavumFloorRecessionOffsetMillimetres)):
            region = next(region for region in authority["regions"] if region["name"] == name + "-" + side)
            candidates = np.asarray(region["nativeSamples"], dtype=int)
            anchor = int(candidates[np.argmin(sign * positions[candidates, 0])])
            floor_anchors[name] = anchor
            distance = np.linalg.norm(points[:, 1:] - positions[anchor, 1:], axis=1)
            delta_x -= amount * np.exp(-(distance / (support * 2)) ** 2) * front * attachment
        for name, amount in (("tragus", request.tragusProjectionOffsetMillimetres),
                             ("antitragus", request.antitragusProjectionOffsetMillimetres)):
            distance = np.linalg.norm(points[:, 1:] - positions[anchors[name], 1:], axis=1)
            delta_x += amount * np.exp(-(distance / support) ** 2) * front * attachment
        result[ids, 0] += sign * delta_x / 1000
        result[ids] += request.pinnaSectionThicknessOffsetMillimetres / 2000 * normals[ids] * attachment[:, None]
        result[ids, 2] -= request.lobuleHeightOffsetMillimetres / 1000 * lobe_weight
        lobe_centre = float(lobe_points[:, 1].mean())
        lobe_radius = float(np.max(np.abs(lobe_points[:, 1] - lobe_centre)))
        if lobe_radius <= 0:
            raise ValueError(side + ": source lobule support has zero anterior/posterior span.")
        result[ids, 1] += ((points[:, 1] - lobe_centre) / lobe_radius) * request.lobuleBreadthOffsetMillimetres / 2000 * lobe_weight
        # Recession modifies the common host and its ear root together; there
        # is no separate scalp-root copy to fall out of alignment.
        root_distance_all = cKDTree(roots).query(positions)[0]
        posterior = np.clip((positions[:, 1] - roots[:, 1].min()) / np.ptp(roots[:, 1]), 0, 1)
        sulcus = np.exp(-(root_distance_all / support) ** 2) * posterior * posterior
        result[:, 0] -= sign * request.retroauricularSulcusRecessionOffsetMillimetres / 1000 * sulcus
        # Inclination follows the composed sections. A root-zero support keeps
        # the source's shared64 attachment points fixed under this rotation;
        # its derivative is zero at that boundary. Sulcus edits remain shared.
        angle = np.deg2rad(request.pinnaInclinationOffsetDegrees)
        centre = roots.mean(axis=0)
        local = result[ids] - centre
        rotated = local.copy()
        rotated[:, 1] = local[:, 1] * np.cos(angle) - local[:, 2] * np.sin(angle)
        rotated[:, 2] = local[:, 1] * np.sin(angle) + local[:, 2] * np.cos(angle)
        result[ids] += (rotated - local) * attachment[:, None]
        records.append({"side": side, "request": asdict(request), "rootNativeCycle": root_ids,
                        "outlineNativeProfile": outline_ids, "foldNativeAnchors": anchors,
                        "conchalSourceSupports": floor_anchors,
                        "qualification": "authored source profile/section; sparse conchal witnesses are not clinical floors or boundaries"})
    if not np.isfinite(result).all():
        raise ValueError("Ear source sections produce nonfinite geometry.")
    return result, records
