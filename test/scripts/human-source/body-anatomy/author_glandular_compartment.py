"""Author paired gland envelopes on the target's own dermal/fascial chart.

Usage: python author_glandular_compartment.py ASSEMBLY PLAN LAYERS OUTPUT

This creates shared source geometry, never personal document vertices. The
old atlas-space lobular fans are not projected, shortened or transported.
An intrinsic elliptical footprint about each native nipple address takes
its half-axis lengths from the registered pectoral extent under the existing
source's artist fractions. Geodesic distance and tangent direction define
that footprint on actual native triangles, without assuming the curved chest
is an XY graph. Every vertex reads D and F at one native address. Two smooth
depth profiles between those sheets form one
closed coarse gland envelope. The profile's half-depth fraction is authored,
not a measured gland thickness; the old 12 mm artist fan is superseded, not
claimed to have fitted. No requested millilitre value is changed here.

Ramsay et al., J Anat 206:525-534, 2005, DOI 10.1111/j.1469-7580.2005.00417.x,
observed highly variable gland/fat distribution using ultrasound in 21
lactating women, 1-6 months postpartum. That protocol does not specify this
envelope, its depth, a nonlactating population or a male atlas gland. This
chart is an explicit source convention; retromammary fat, Cooper support and
subject-specific tissue distribution remain unknown.

The output carries complete source parts, bindings, sternum support sites,
linear quantity fields, native-address lineage and producer/input digests.
join-registered-members consumes them together. Normal assembly/static/GPU
admission is still required, including actual D/F containment: barycentric
column addresses alone do not certify triangles between different columns.
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

from atlas_inputs import read_target, sha256
from native_surface_graph import native_surface_graph
from native_column_directions import native_column_directions

ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS = ROOT / ".wiki/08-campaigns/2707-human/artifacts"
PROFILE = {"halfDepthFraction": .25,
           "minimumRetainedDepthFraction": .5, "edgeRetainedDepthFraction": .2}


def envelope(centre, width, height, dermis, fascia, normals, native_faces, graph, anchor):
    """Birth an intrinsic footprint using graph geodesics and native columns.

    The tangent-frame angle is an authored direction convention, while the
    radius is the actual native edge-graph distance. This is not an isometric
    logarithmic map or a measured breast footprint. Keeping native triangles
    avoids inversion/resampling of a chart outside its planar projection.
    """
    normal = normals[anchor] / np.linalg.norm(normals[anchor])
    lateral = np.asarray([1.0, 0.0, 0.0]) - normal[0] * normal
    lateral /= np.linalg.norm(lateral)
    vertical = np.cross(normal, lateral)
    relative = dermis - dermis[anchor]
    x, y = relative @ lateral, relative @ vertical
    chord = np.hypot(x, y)
    radius = dijkstra(graph, directed=False, indices=anchor)
    directional = np.divide(np.hypot(2 * x / width, 2 * y / height), chord, out=np.full_like(chord, np.inf), where=chord > 0)
    rho = radius * directional
    rho[anchor] = 0
    chosen_faces = np.all(rho[native_faces] <= 1, axis=1)
    if not chosen_faces.any():
        raise ValueError("The native gland footprint has no complete host triangles.")
    native = np.unique(native_faces[chosen_faces])
    ordinal = np.full(len(dermis), -1, dtype=np.int64)
    ordinal[native] = np.arange(len(native))
    if ordinal[anchor] < 0:
        raise ValueError("The native gland footprint lost its nipple source anchor.")
    cells = ordinal[native_faces[chosen_faces]]
    span = PROFILE["halfDepthFraction"] * (1 - (1 - PROFILE["edgeRetainedDepthFraction"]) * rho[native])
    fraction = np.r_[.5 - span, .5 + span]
    d, f = np.vstack((dermis[native], dermis[native])), np.vstack((fascia[native], fascia[native]))
    positions = (1 - fraction[:, None]) * d + fraction[:, None] * f
    delta = (fraction - .5)[:, None] * (f - d)
    support = len(native) + int(ordinal[anchor])
    delta[support] = 0
    faces = np.vstack((cells, cells[:, [0, 2, 1]] + len(native))).tolist()
    directed = np.vstack((cells[:, [0, 1]], cells[:, [1, 2]], cells[:, [2, 0]]))
    _, inverse, counts = np.unique(np.sort(directed, axis=1), axis=0, return_inverse=True, return_counts=True)
    for a, b in directed[counts[inverse] == 1]:
        faces.extend(([int(a), int(a + len(native)), int(b)], [int(b), int(a + len(native)), int(b + len(native))]))
    mesh = trimesh.Trimesh(vertices=positions, faces=faces, process=False)
    if mesh.volume < 0:
        mesh.invert()
    if not mesh.is_watertight or not mesh.is_winding_consistent or mesh.volume <= 0:
        raise ValueError("The native gland envelope is not a closed outward solid.")
    lineage = [{"nativeVertex": int(vertex), "depthFraction": float(value)} for vertex, value in zip(np.r_[native, native], fraction)]
    return mesh, delta, lineage, support


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
    basis, skin, faces, _, named = read_target(body_file, receipts, ROOT)
    layer_bytes = (args.layers / "layer-surfaces.json").read_bytes()
    layer = json.loads(layer_bytes)
    gland_file = (args.plan.resolve().parent / plan["glandular"]).resolve()
    gland_bytes = gland_file.read_bytes()
    gland = json.loads(gland_bytes)["artistSourceQuantities"]
    width_fraction, height_fraction = gland["width_reference_fraction"], gland["height_reference_fraction"]
    if not np.isfinite([width_fraction, height_fraction]).all() or width_fraction <= 0 or height_fraction <= 0:
        raise ValueError("The source artist footprint fractions must be finite and positive.")
    # Missing coverage is unknown, including packets from the older observer.
    # These are limited offset conditions, not a clinical embedding certificate.
    layer_counts = [layer.get(name) for name in (
        "beyondReachVertices", "unmeasuredReachVertices", "dermalInvertedTriangles", "invertedTriangles")]
    if assembly["basis"] != basis or layer["basis"] != basis or any(type(count) is not int or count != 0 for count in layer_counts):
        raise ValueError("The native source requires the same body basis, complete opposite-sheet observations and no reported offset inversion or reach refusal.")
    dermis = np.asarray(layer["dermis"], dtype=np.float64).reshape((-1, 3))
    fascia = np.asarray(layer["fascia"], dtype=np.float64).reshape((-1, 3))
    normals = native_column_directions(dermis, fascia)
    if dermis.shape != skin.shape or fascia.shape != skin.shape:
        raise ValueError("The D/F sheets do not address the body's native vertices.")
    output.mkdir(parents=True, exist_ok=True)
    graph = native_surface_graph(dermis, faces)
    skin_tree = cKDTree(skin)
    nodes = copy.deepcopy(assembly["rig"]["nodes"])
    stem = next(node for node in nodes if node["id"] == "sternum")
    from scipy.spatial.transform import Rotation
    q = stem["rest"]["rotation"]
    rotation = Rotation.from_quat([q[axis] for axis in "xyzw"]).as_matrix()
    rest = np.asarray([stem["rest"]["position"][axis] for axis in "xyz"])
    members, authored, measurements = [], [], []
    for side in ("left", "right"):
        part = copy.deepcopy(next(part for part in assembly["parts"] if part["id"] == side + "BreastFibroglandular"))
        if len(part["surfaces"]) != 1 or len(part["attachments"]) != 1 or part["attachments"][0]["bone"] != "sternum":
            raise ValueError("A native gland needs its declared single thoracic support.")
        pectoral = next(part for part in assembly["parts"] if part["id"] == side + "PectoralisMajor")
        extent = np.ptp(np.vstack([np.asarray(surface["mesh"]["positions"]).reshape((-1, 3)) for surface in pectoral["surfaces"]]), axis=0)
        # The maintained source names its left nipple only. Its source recipe
        # declares the opposite nipple as the sagittal twin; this candidate
        # records that authored mirror instead of claiming a missing observed
        # right landmark. Generated vertices still read actual D/F triangles.
        centre = skin[named["nipple-left"]] * np.asarray([1 if side == "left" else -1, 1, 1])
        # These remain the old recipe's artist footprint fractions. They are
        # recomputed on registered support, never atlas Cartesian dimensions.
        anchor = named["nipple-left"] if side == "left" else int(skin_tree.query(centre)[1])
        mesh, delta, lineage, support = envelope(centre, width_fraction * extent[0], height_fraction * extent[1], dermis, fascia, normals, faces, graph, anchor)
        surface = part["surfaces"][0]
        payload = {"positions": mesh.vertices.reshape(-1).tolist(), "indices": mesh.faces.reshape(-1).tolist(),
                   "normals": mesh.vertex_normals.reshape(-1).tolist(), "uvs": None, "skin": None}
        source_file = part["id"] + ".native-source.json"
        source = {"mesh": payload, "nativeLineage": lineage, "profile": PROFILE,
                  "nippleAnchor": {"sourceVertex": named["nipple-left"], "operation": "identity" if side == "left" else "sagittalMirror", "pointMetres": centre.tolist()},
                  "sourceBodyBasis": basis, "layerSurfacesSha256": sha256(layer_bytes),
                  "qualification": "Authored smooth gland envelope between native D/F columns; clinical gland depth, retromammary fat and Cooper support unknown; no individual reconstruction."}
        source_bytes = json.dumps(source, separators=(",", ":"), allow_nan=False).encode()
        (output / source_file).write_bytes(source_bytes)
        surface["mesh"] = payload
        surface["binding"] = {"bones": ["sternum"], "boneIndices": [0] * (len(mesh.vertices) * 4),
                              "weights": [value for _ in mesh.vertices for value in (1, 0, 0, 0)],
                              "account": "Native posterior pole registered to the actual sternum rest frame; held-neutral thoracic carry only, no Cooper mechanics or motion qualification."}
        site = next(site for site in stem["sites"] if site["id"] == part["attachments"][0]["site"])
        site["position"] = dict(zip("xyz", map(float, rotation.T @ (mesh.vertices[support] - rest))))
        part["attachments"][0]["account"] = "Actual native posterior gland pole; source-native support in the sternum frame, not a measured Cooper attachment."
        field_id = "native-gland-compartment-depth"
        minimum = PROFILE["minimumRetainedDepthFraction"] - 1
        maximum = .5 / PROFILE["halfDepthFraction"] - 1
        part["shapeFields"] = [{"id": field_id, "minimumCoefficient": minimum, "maximumCoefficient": maximum,
            "domainAccount": "Authored depth span retains at least half its neutral in-column extent and at most doubles it; all native column fractions remain between D and F, posterior support pole held. Triangle containment and clinical support require separate admission.",
            "surfaces": [{"member": surface["id"], "displacements": delta.reshape(-1).tolist(), "heldVertices": [support]}]}]
        part["quantityBindings"] = [{"path": "trunk." + side + "Breast.fibroglandularVolume", "members": [surface["id"]], "field": field_id,
            "sourceProtocol": "Actual closed target-native authored envelope volume in cubic metres, target millilitres converted once; not gland segmentation or a measured population value.",
            "targetCondition": "Same native D/F source chart and held posterior sternum-frame pole; requested volume remains unchanged and unsupported reach is refused."}]
        part["qualification"] = source["qualification"]
        readings = []
        for coefficient in (minimum, 0, maximum):
            candidate = trimesh.Trimesh(vertices=mesh.vertices + coefficient * delta, faces=mesh.faces, process=False)
            if not candidate.is_watertight or not candidate.is_winding_consistent or candidate.volume <= 0:
                raise ValueError("Native gland depth freedom lost its closed outward boundary.")
            readings.append({"coefficient": coefficient, "volumeMillilitres": float(candidate.volume * 1e6)})
        measurements.append({"part": part["id"], "readings": readings, "supportPole": mesh.vertices[support].tolist(), "supportVertex": support})
        payload_file = part["id"] + ".source-part.json"
        part_bytes = json.dumps(part, separators=(",", ":"), allow_nan=False).encode()
        (output / payload_file).write_bytes(part_bytes)
        authored.append({"part": part["id"], "file": payload_file, "sha256": sha256(part_bytes)})
        name = part["id"] + "--" + surface["id"].replace("/", "-")
        (output / (name + ".positions.f64")).write_bytes(np.asarray(mesh.vertices, dtype="<f8").tobytes())
        (output / (name + ".indices.i32")).write_bytes(np.asarray(mesh.faces, dtype="<i4").tobytes())
        members.append({"part": part["id"], "member": surface["id"], "vertices": len(mesh.vertices),
                        "positions": name + ".positions.f64", "indices": name + ".indices.i32", "authoredSource": source_file,
                        "account": "New target-native D/F compartment envelope; native host triangles and per-vertex depth fractions retain the actual shared column addresses."})
    (output / "source-rig-nodes.json").write_text(json.dumps(nodes, separators=(",", ":")) + "\n", encoding="utf-8")
    receipt = {"schema": "automovie-native-glandular-source/1", "targetBodyBasis": basis, "members": members,
               "authoredParts": authored, "measurements": measurements, "inputs": receipts,
               "assemblySha256": sha256(assembly_bytes), "planSha256": sha256(plan_bytes), "layerSurfacesSha256": sha256(layer_bytes),
               "originalArtistProfileSha256": sha256(gland_bytes), "footprintFractions": {"width": width_fraction, "height": height_fraction},
               "producerSha256": sha256(Path(__file__).read_bytes()), "profile": PROFILE,
               "supportGraphProducerSha256": sha256(Path(__file__).with_name("native_surface_graph.py").read_bytes()),
               "columnDirectionProducerSha256": sha256(Path(__file__).with_name("native_column_directions.py").read_bytes()),
               "qualification": "New shared source birth only; old baseline gland dimensions/volume superseded, caller millilitre values preserved; typed compiler/Float32/GLB/D-F triangle containment/current GPU unverified."}
    (output / "registration-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    (output / "run-receipt.json").write_text(json.dumps({"pid": os.getpid(), "startedUtc": started_utc, "endedUtc": datetime.now(timezone.utc).isoformat(),
        "wallSeconds": time.perf_counter() - started, "registrationReceiptSha256": sha256((output / "registration-receipt.json").read_bytes())}, indent=2), encoding="utf-8")
    print(json.dumps({"parts": len(authored), "output": str(output.relative_to(ROOT)), "measurements": measurements}))


if __name__ == "__main__":
    main()
