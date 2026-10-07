"""Birth authored support tissues in the target-neutral anatomical frame.

Usage: python author_native_support_parts.py ASSEMBLY PLAN LAYERS OUTPUT

The plan's actual other-parts packet owns the population and artist profiles.
Its bone ports resolve on the registered rig, not in atlas Cartesian space.
Shortest paths on the target fascial triangle graph define surface footprints;
their native triangles birth closed depth sheets. No old authored vertex is
projected, shrunk or carried by an undefined exterior extension of Phi.

This is a coarse shared-source authoring convention, not anatomical inference.
The geodesic footprint and depth profile cannot establish muscle layering,
fascicle twist, teres-major clearance, ligament fibre paths or physiological
mechanics. A bone port's nearest fascial address is recorded separately from
that real bone site: it is not asserted to be a coincident muscle attachment.
Current typed/static/layer/GPU inspection must judge the emitted tissues and
their actual neighbours. Source unknowns are not filled from population means.

Each complete replacement preserves every existing member identity and emits
new binding arrays and native triangle lineage. Numerical derivatives cannot
silently survive changed source geometry; a source with existing quantity
fields requires its own native field author before this producer can replace
it. The target-native coccyx is already supported and remains unchanged.
"""
import argparse
import copy
import json
import os
import time
from pathlib import Path
from datetime import datetime, timezone

import numpy as np
import trimesh
from scipy.sparse.csgraph import dijkstra
from scipy.spatial import cKDTree
from scipy.spatial.transform import Rotation

from atlas_inputs import read_target, sha256
from closest_surface import ClosestSurface
from native_surface_graph import native_surface_graph
from native_column_directions import native_column_directions

ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS = ROOT / ".wiki/08-campaigns/2707-human/artifacts"


def depth_profile(profile):
    """Existing authored depth quantities in metres, never clinical bounds."""
    for name in ("bellyThicknessMm", "thicknessMm"):
        if name in profile:
            value = profile[name]
            values = np.asarray(value if isinstance(value, list) else [value, value], dtype=np.float64) / 1000
            if len(values) != 2 or not np.isfinite(values).all() or np.any(values <= 0):
                raise ValueError("The source tissue profile needs positive finite depth quantities.")
            return values
    if "bellyHalfDepthMm" in profile:
        depth = 2 * profile["bellyHalfDepthMm"] / 1000
        return np.asarray([depth * profile["tendinousWaistFraction"], depth])
    raise ValueError("An authored tissue has no native depth-profile contract.")


def port(node, site_id):
    """World position of one actual registered bone site, in target metres."""
    site = next(site for site in node["sites"] if site["id"] == site_id)
    q = node["rest"]["rotation"]
    rotation = Rotation.from_quat([q[axis] for axis in "xyzw"]).as_matrix()
    return np.asarray([node["rest"]["position"][axis] for axis in "xyz"]) + rotation @ np.asarray([site["position"][axis] for axis in "xyz"])


def footprint(graph, points, source_ports, profile):
    """A native geodesic fan from source origin/support sites to insertions.

    Each origin has its own route. Their union forms a broad fan when origins
    are spread; an isolated origin uses the source profile's stated width.
    The route's excess length gives a tube on the surface, tapering toward the
    stated terminal span where present. This is an authored footprint, not a
    reconstruction of an unseen muscle or an anatomical permitted range.
    """
    tree = cKDTree(points)
    starts = [tree.query(point)[1] for role, point in source_ports if role in ("origin", "support")]
    ends = [tree.query(point)[1] for role, point in source_ports if role == "insertion"]
    if not starts or not ends:
        raise ValueError("A native tissue fan needs real source and terminal ports.")
    from_end = np.min(dijkstra(graph, directed=False, indices=ends), axis=0)
    selected = np.zeros(len(points), dtype=bool)
    phase = np.full(len(points), np.nan)
    origin_points = points[starts]
    spread = float(np.linalg.norm(origin_points[:, None] - origin_points[None, :], axis=2).max()) / 2
    if "bellyHalfWidthMm" in profile:
        width = profile["bellyHalfWidthMm"] / 1000
    elif spread > 0:
        width = spread
    elif "midlineHalfGapMm" in profile:
        # The aponeurosis consumes the rectus footprint in the caller; this
        # fallback does not invent a broad region from a midline gap.
        raise ValueError("A rectus-sheath sheet requires its shared rectus support.")
    else:
        raise ValueError("The native fan has no source-supported footprint width.")
    terminal = profile.get("terminalSpanMm", profile.get("terminalWidthMm", 2 * width * 1000)) / 2000
    for start in starts:
        from_start = dijkstra(graph, directed=False, indices=int(start))
        total = from_start + from_end
        t = np.divide(from_start, total, out=np.zeros_like(total), where=np.isfinite(total) & (total > 0))
        route = from_end[start]
        if not np.isfinite(route) or route <= 0:
            raise ValueError("Native tissue ports have no distinct connected surface route.")
        half_width = (1 - t) * width + t * terminal
        # The excess of a two-focus distance sum vanishes on a shortest path.
        # This authored fan broadens by its own width, not by a vertex epsilon.
        reached = np.isfinite(total) & (total - route <= 2 * half_width)
        phase[reached & ~selected] = t[reached & ~selected]
        selected |= reached
    return selected, phase


def shell(points, faces, normals, selected_faces, thickness, outside_depth=0):
    """Closed source sheet born from native faces and their depth coordinates."""
    native = np.unique(faces[selected_faces])
    ordinal = np.full(len(points), -1, dtype=np.int64)
    ordinal[native] = np.arange(len(native))
    cells = ordinal[faces[selected_faces]]
    exterior = points[native] - outside_depth * normals[native]
    interior = exterior - thickness[native, None] * normals[native]
    positions = np.vstack((exterior, interior))
    triangles = np.vstack((cells, cells[:, [0, 2, 1]] + len(native))).tolist()
    directed = np.vstack((cells[:, [0, 1]], cells[:, [1, 2]], cells[:, [2, 0]]))
    _, inverse, counts = np.unique(np.sort(directed, axis=1), axis=0, return_inverse=True, return_counts=True)
    rim = directed[counts[inverse] == 1]
    for a, b in rim:
        triangles.extend(([int(a), int(a + len(native)), int(b)], [int(b), int(a + len(native)), int(b + len(native))]))
    mesh = trimesh.Trimesh(vertices=positions, faces=triangles, process=False)
    if mesh.volume < 0:
        mesh.invert()
    if not mesh.is_watertight or not mesh.is_winding_consistent or mesh.volume <= 0:
        raise ValueError("A native support sheet has no closed outward source boundary.")
    lineage = [{"nativeVertex": int(vertex), "depthMetres": float(outside_depth)} for vertex in native]
    lineage.extend({"nativeVertex": int(vertex), "depthMetres": float(outside_depth + thickness[vertex])} for vertex in native)
    return mesh, lineage


def bone_fan(ports, profile):
    """A deep tract's native origin fan, not a superficial fascial footprint.

    The actual bone-origin span supplies the broad end, and the artist
    terminal width supplies the insertion end. Constant source thickness
    closes the planar fan. This preserves named bone support and its frame;
    curved fibre routing and neighbouring hamstring fusion remain unknown.
    """
    origins = np.asarray([point for role, point in ports if role in ("origin", "support")])
    ends = np.asarray([point for role, point in ports if role == "insertion"])
    if len(origins) != 2 or len(ends) != 1:
        raise ValueError("This deep source fan needs two declared bone origins and one insertion.")
    across = origins[1] - origins[0]
    width = np.linalg.norm(across)
    axis = ends[0] - origins.mean(axis=0)
    normal = np.cross(across, axis)
    length = np.linalg.norm(normal)
    if width <= 0 or length <= 0:
        raise ValueError("Deep source ports do not define a native fan plane.")
    across, normal = across / width, normal / length
    terminal = profile["terminalWidthMm"] / 2000
    depth = float(profile["thicknessMm"]) / 1000
    if terminal <= 0 or depth <= 0 or not np.isfinite([terminal, depth]).all():
        raise ValueError("A deep source fan needs positive artist width and thickness.")
    centre = np.asarray([origins[0], origins[1], ends[0] + terminal * across, ends[0] - terminal * across])
    positions = np.vstack((centre + depth / 2 * normal, centre - depth / 2 * normal))
    faces = [[0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6]]
    for a, b in ((0, 1), (1, 2), (2, 3), (3, 0)):
        faces.extend(([a, a + 4, b], [b, a + 4, b + 4]))
    mesh = trimesh.Trimesh(vertices=positions, faces=faces, process=False)
    if mesh.volume < 0:
        mesh.invert()
    if not mesh.is_watertight or not mesh.is_winding_consistent or mesh.volume <= 0:
        raise ValueError("A deep native fan has no closed outward source boundary.")
    return mesh, [{"sourcePortRoles": [role for role, _ in ports], "sourcePlaneCorner": at % 4, "normalDepthMetres": depth / 2 * (1 if at < 4 else -1)} for at in range(8)]


def main():
    started = time.perf_counter()
    parser = argparse.ArgumentParser()
    for name in ("assembly", "plan", "layers", "output"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    started_utc = datetime.now(timezone.utc).isoformat()
    print(json.dumps({"stage": "producer-started", "pid": os.getpid(), "startedUtc": started_utc}), flush=True)
    output = args.output.resolve()
    if not output.is_relative_to(ARTIFACTS):
        raise ValueError("Native source candidates require campaign artifact ownership.")
    assembly_bytes, plan_bytes = args.assembly.read_bytes(), args.plan.read_bytes()
    assembly, plan = json.loads(assembly_bytes), json.loads(plan_bytes)
    receipts = {}
    body_file = (args.plan.resolve().parent / plan["bodyView"]).resolve()
    basis, skin, faces, _, _ = read_target(body_file, receipts, ROOT)
    layer_bytes = (args.layers / "layer-surfaces.json").read_bytes()
    layer = json.loads(layer_bytes)
    packet_file = (args.plan.resolve().parent / plan["otherParts"]).resolve()
    packet_bytes = packet_file.read_bytes()
    packet = json.loads(packet_bytes)
    # Keep unknown observations distinct from an observed non-refusal. A
    # historical packet without these counts needs current layer observation.
    layer_counts = [layer.get(name) for name in (
        "beyondReachVertices", "unmeasuredReachVertices", "dermalInvertedTriangles", "invertedTriangles")]
    if assembly["basis"] != basis or layer["basis"] != basis or any(type(count) is not int or count != 0 for count in layer_counts):
        raise ValueError("Native tissues require one body basis, complete opposite-sheet observations and no reported offset inversion or reach refusal; global embedding remains unproved.")
    points = np.asarray(layer["fascia"], dtype=np.float64).reshape((-1, 3))
    normals = native_column_directions(np.asarray(layer["dermis"]).reshape((-1, 3)), points)
    if points.shape != skin.shape or normals.shape != skin.shape:
        raise ValueError("Native support sheets do not address the source skin vertices.")
    graph = native_surface_graph(points, faces)
    surface = ClosestSurface(points, faces)
    nodes = {node["id"]: node for node in assembly["rig"]["nodes"]}
    originals = {part["id"]: part for part in assembly["parts"]}
    failures = []
    for record in packet["parts"]:
        original = originals.get(record["id"])
        if original is None:
            failures.append({"part": record["id"], "reason": "source-part-unavailable"})
            continue
        if original["tissue"] == "bone":
            continue
        if len(original["surfaces"]) != 1:
            failures.append({"part": record["id"], "reason": "complete-multi-member-author-required"})
        if original.get("shapeFields") or original.get("quantityBindings"):
            failures.append({"part": record["id"], "reason": "existing-numerical-fields-need-native-source-author"})
        for attachment in original["attachments"]:
            node = nodes.get(attachment["bone"])
            if node is None or not any(site["id"] == attachment["site"] for site in node["sites"]):
                failures.append({"part": record["id"], "reason": "registered-port-unavailable", "attachment": attachment})
    if failures:
        raise ValueError("Native source population preflight failed: " + json.dumps(failures))
    output.mkdir(parents=True, exist_ok=True)
    authored, members, readings, shared = [], [], [], {}
    # Rectus is produced before the aponeurosis which consumes its surface.
    ordered = sorted(packet["parts"], key=lambda item: "Aponeurosis" in item["id"])
    for record in ordered:
        part = copy.deepcopy(originals[record["id"]])
        if part["tissue"] == "bone":
            continue
        ports = [(attachment["role"], port(nodes[attachment["bone"]], attachment["site"])) for attachment in part["attachments"]]
        profile = record["artistProfile"]
        if "terminalWidthMm" in profile:
            mesh, lineage = bone_fan(ports, profile)
            selected_faces = None
        else:
            depths = depth_profile(profile)
            outside_depth = 0
            if "sharedSupport" in profile:
                owner = part["id"].replace("ExternalObliqueAponeurosis", "RectusAbdominis")
                chosen, phase = shared[owner]
            else:
                chosen, phase = footprint(graph, points, ports, profile)
            selected_faces = np.all(chosen[faces], axis=1)
            if not selected_faces.any():
                raise ValueError("A native source fan has no complete triangles: " + part["id"])
            t = np.nan_to_num(phase, nan=0)
            belly = np.sin(np.pi * t)
            if "tendinousWaistFraction" in profile:
                belly = np.sin(4 * np.pi * t) ** 2
                # The sheath's stated thickness is the shared superficial layer.
                sheath = next(item for item in packet["parts"] if item["id"] == part["id"].replace("RectusAbdominis", "ExternalObliqueAponeurosis"))
                outside_depth = sheath["artistProfile"]["thicknessMm"] / 1000
                shared[part["id"]] = (chosen, phase)
            thickness = depths[0] + (depths[1] - depths[0]) * belly
            mesh, lineage = shell(points, faces, normals, selected_faces, thickness, outside_depth)
        source_surface = part["surfaces"][0]
        source_surface["mesh"] = {"positions": mesh.vertices.reshape(-1).tolist(), "indices": mesh.faces.reshape(-1).tolist(),
                                  "normals": mesh.vertex_normals.reshape(-1).tolist(), "uvs": None, "skin": None}
        bones = list(dict.fromkeys(attachment["bone"] for attachment in part["attachments"]))
        anchors = np.asarray([point for _, point in ports])
        distances, port_ids = cKDTree(anchors).query(mesh.vertices, k=min(4, len(anchors)))
        distances, port_ids = np.asarray(distances).reshape((len(mesh.vertices), -1)), np.asarray(port_ids).reshape((len(mesh.vertices), -1))
        weights = np.zeros_like(distances)
        coincident = distances == 0
        exact = coincident.any(axis=1)
        weights[exact] = coincident[exact] / coincident[exact].sum(axis=1)[:, None]
        weights[~exact] = 1 / distances[~exact] ** 2
        weights[~exact] /= weights[~exact].sum(axis=1)[:, None]
        slots = np.zeros((len(mesh.vertices), 4), dtype=np.int64)
        shares = np.zeros((len(mesh.vertices), 4))
        port_bones = np.asarray([bones.index(attachment["bone"]) for attachment in part["attachments"]])
        slots[:, :port_ids.shape[1]], shares[:, :weights.shape[1]] = port_bones[port_ids], weights
        source_surface["binding"] = {"bones": bones, "boneIndices": slots.reshape(-1).tolist(), "weights": shares.reshape(-1).tolist(),
            "account": "Coarse inverse-square carry over this native source's actual declared bone ports; neutral-only graph, no physiological sliding or muscle mechanics."}
        projected, gaps, triangles = surface.nearest(np.asarray([point for _, point in ports]))
        source_file = part["id"] + ".native-source.json"
        source = {"mesh": source_surface["mesh"], "nativeLineage": lineage, "artistProfile": profile,
                  "sourceBodyBasis": basis, "layerSurfacesSha256": sha256(layer_bytes), "nativeTriangles": None if selected_faces is None else np.flatnonzero(selected_faces).tolist(),
                  "bonePorts": [{"attachment": attachment, "pointMetres": point.tolist(), "fascialTriangle": int(triangle), "fascialPointMetres": image.tolist(), "fascialGapMetres": float(gap)}
                                for attachment, (_, point), image, gap, triangle in zip(part["attachments"], ports, projected, gaps, triangles)],
                  "qualification": "New target-native source from actual bone ports and declared artist profile; superficial tissues consume a geodesic depth sheet and deep tracts a bone-port fan. Contact gaps, tissue layering, fascicle/ligament routes and physiological mechanics remain unverified."}
        part["qualification"] = source["qualification"]
        (output / source_file).write_text(json.dumps(source, separators=(",", ":"), allow_nan=False), encoding="utf-8")
        payload_file = part["id"] + ".source-part.json"
        part_bytes = json.dumps(part, separators=(",", ":"), allow_nan=False).encode()
        (output / payload_file).write_bytes(part_bytes)
        authored.append({"part": part["id"], "file": payload_file, "sha256": sha256(part_bytes)})
        name = part["id"] + "--" + source_surface["id"].replace("/", "-")
        (output / (name + ".positions.f64")).write_bytes(np.asarray(mesh.vertices, dtype="<f8").tobytes())
        (output / (name + ".indices.i32")).write_bytes(np.asarray(mesh.faces, dtype="<i4").tobytes())
        members.append({"part": part["id"], "member": source_surface["id"], "vertices": len(mesh.vertices), "positions": name + ".positions.f64", "indices": name + ".indices.i32", "authoredSource": source_file,
                        "account": "Target-native source birth on a geodesic fascial support footprint; actual native ordinal/depth lineage and original bone sites retained."})
        readings.append({"part": part["id"], "vertices": len(mesh.vertices), "triangles": len(mesh.faces), "volumeMillilitres": float(mesh.volume * 1e6), "bonePortFascialGapsMetres": gaps.tolist()})
        print(json.dumps({"stage": "native-part-authored", "part": part["id"], "completed": len(authored),
                          "vertices": len(mesh.vertices), "triangles": len(mesh.faces)}), flush=True)
    (output / "source-rig-nodes.json").write_text(json.dumps(assembly["rig"]["nodes"], separators=(",", ":")), encoding="utf-8")
    receipt = {"schema": "automovie-native-support-source/1", "targetBodyBasis": basis, "members": members, "authoredParts": authored, "readings": readings,
               "inputs": receipts, "assemblySha256": sha256(assembly_bytes), "planSha256": sha256(plan_bytes), "layerSurfacesSha256": sha256(layer_bytes),
               "originalArtistPacketSha256": sha256(packet_bytes), "producerSha256": sha256(Path(__file__).read_bytes()),
               "helpers": {name: sha256(Path(__file__).with_name(name).read_bytes()) for name in
                           ("atlas_inputs.py", "closest_surface.py", "native_surface_graph.py", "native_column_directions.py")},
               "qualification": "Whole authored soft support source birth only; all original part/member identities preserved, clinical and same-generation static/layer/GPU acceptance unverified."}
    (output / "registration-receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    (output / "run-receipt.json").write_text(json.dumps({"pid": os.getpid(), "startedUtc": started_utc,
        "endedUtc": datetime.now(timezone.utc).isoformat(), "wallSeconds": time.perf_counter() - started,
        "registrationReceiptSha256": sha256((output / "registration-receipt.json").read_bytes())}, indent=2), encoding="utf-8")
    print(json.dumps({"parts": len(authored), "output": str(output.relative_to(ROOT)), "readings": readings}))


if __name__ == "__main__":
    main()
