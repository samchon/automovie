"""Bake one shared static source registration into the actual tissue sources.

From the repository root:
  python test/scripts/human-source/body-anatomy/bake_static_joint_registration.py ASSEMBLY OPERATORS NEW_OUTPUT_DIRECTORY

ASSEMBLY is the unchanged pre-bake atlas-plus-common-translation source. The
operator's canonical-to-target form consumes that translation exactly once;
an already target-registered assembly is not an interchangeable input.

The maintained static joint registration owner supplies source-to-target
matrices and target rest frames. This
consumer maps every boundary and attachment through those same bone operators;
it never fits a member independently or adds public motion support. Bone joint
spans are authored source adaptation anchors, not maximum clinical bone lengths.
Original receipts and face/index lineage remain immutable input evidence.

Old adipose is excluded from this bake because its source field combined the
unregistered atlas and native exterior. It must be regenerated using the mapped
musculoskeletal sources and the target generation's real exterior/cut boundary.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS = ROOT / ".wiki/08-campaigns/2707-human/artifacts/all-parts"


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def xyz(point):
    return np.asarray([point[axis] for axis in ("x", "y", "z")], dtype=np.float64)


def vector(point):
    return dict(zip(("x", "y", "z"), map(float, point)))


def rotation_matrix(q):
    x, y, z, w = (q[axis] for axis in ("x", "y", "z", "w"))
    if not np.isfinite([x, y, z, w]).all() or abs(x*x+y*y+z*z+w*w-1) > 1e-6:
        raise ValueError("Static source rest requires a finite unit quaternion.")
    return np.asarray([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
                       [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
                       [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])


def normals(positions, indices):
    points = np.asarray(positions).reshape((-1, 3))
    faces = np.asarray(indices, dtype=np.int64).reshape((-1, 3))
    sides = points[faces]
    areas = np.cross(sides[:, 1]-sides[:, 0], sides[:, 2]-sides[:, 0])
    if not np.isfinite(areas).all() or np.any(np.linalg.norm(areas, axis=1) == 0):
        raise ValueError("Static registration collapsed an actual source triangle.")
    directions = np.zeros_like(points)
    for corner in range(3):
        np.add.at(directions, faces[:, corner], areas)
    lengths = np.linalg.norm(directions, axis=1)
    if np.any(lengths == 0) or not np.isfinite(lengths).all():
        raise ValueError("Static registration has cancelled actual area-weighted normals.")
    return (directions/lengths[:, None]).reshape(-1).tolist()


def map_surface(values, binding, operators, directions=False):
    points = np.asarray(values, dtype=np.float64).reshape((-1, 3))
    indices = np.asarray(binding["boneIndices"], dtype=np.int64).reshape((-1, 4))
    weights = np.asarray(binding["weights"], dtype=np.float64).reshape((-1, 4))
    matrices = np.asarray([operators[bone][0] for bone in binding["bones"]])
    translations = np.asarray([operators[bone][1] for bone in binding["bones"]])
    if len(indices) != len(points) or indices.shape != weights.shape or np.any(indices < 0) or np.any(indices >= len(matrices)):
        raise ValueError("Actual source boundary and anatomical binding disagree.")
    if not np.isfinite(weights).all() or np.any(weights < 0) or np.any(abs(weights.sum(axis=1)-1) > 1e-8):
        raise ValueError("Actual source binding must preserve admitted nonnegative unit weights.")
    mapped = np.zeros_like(points)
    for start in range(0, len(points), 65536):
        end = min(start+65536, len(points))
        for slot in range(4):
            selected = indices[start:end, slot]
            moved = np.einsum("nij,nj->ni", matrices[selected], points[start:end])
            if not directions:
                moved += translations[selected]
            mapped[start:end] += moved * weights[start:end, slot, None]
    if not np.isfinite(mapped).all():
        raise ValueError("Static source adaptation emitted a nonfinite boundary.")
    return mapped.reshape(-1).tolist()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("assembly", type=Path)
    parser.add_argument("operator", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ARTIFACTS):
        raise ValueError("Static adapted sources require the owning campaign artifact path.")
    assembly_bytes = args.assembly.read_bytes()
    operator_bytes = args.operator.read_bytes()
    assembly = json.loads(assembly_bytes)
    registration = json.loads(operator_bytes)
    operators, targets = {}, {}
    for record in registration["transforms"]:
        bone = record["bone"]
        mapping = record["canonicalToTarget"]
        matrix = np.asarray(mapping["linear"], dtype=np.float64).reshape((3, 3))
        translation = np.asarray(mapping["translation"], dtype=np.float64)
        if bone in operators or translation.shape != (3,) or not np.isfinite(matrix).all() or not np.isfinite(translation).all() or np.linalg.det(matrix) <= 0:
            raise ValueError("Static bone registration requires one finite positive-determinant operator: " + bone)
        operators[bone] = (matrix, translation)
        targets[bone] = record["targetRest"]
    if set(operators) != {node["id"] for node in assembly["rig"]["nodes"]}:
        raise ValueError("Static adaptation must own the entire actual anatomical bone population.")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.mkdir()
    nodes = []
    for original in assembly["rig"]["nodes"]:
        node = copy.deepcopy(original)
        if node["joint"]["kind"] != "fixed" or node["projections"]:
            raise ValueError("This source bake supplies held neutral geometry only.")
        matrix, translation = operators[node["id"]]
        old_rest = node["rest"]
        target = targets[node["id"]]
        target_rotation = rotation_matrix(target["rotation"])
        old_rotation = rotation_matrix(old_rest["rotation"])
        target_position = xyz(target["position"])
        if np.max(np.abs(matrix @ xyz(old_rest["position"]) + translation - target_position)) > 1e-9:
            raise ValueError("Bone geometry and target rest have different static registration: " + node["id"])
        for site in node["sites"]:
            world = xyz(old_rest["position"]) + old_rotation @ xyz(site["position"])
            mapped = matrix @ world + translation
            site["position"] = vector(target_rotation.T @ (mapped-target_position))
            site["account"] += "; same source-owned static registration " + sha256(operator_bytes)
            site["qualification"] += "; authored generic target-rest adaptation, not measured target anatomy"
        node["rest"] = copy.deepcopy(target)
        node["account"] += "; source joint-span/frame static adaptation " + sha256(operator_bytes)
        node["qualification"] += "; source lengths/volumes may change through the declared adaptation; clinical fit unavailable"
        nodes.append(node)
    parts, receipts, pending = [], [], []
    for original in assembly["parts"]:
        if original["tissue"] == "adipose":
            pending.append({"part": original["id"], "reason": "regenerate-depot-from-target-exterior-and-registered-internals; old mixed-rest field is not retargeted"})
            continue
        part = copy.deepcopy(original)
        for surface in part["surfaces"]:
            old_mesh = surface["mesh"]
            binding = surface["binding"]
            mesh = {**old_mesh, "positions": map_surface(old_mesh["positions"], binding, operators)}
            mesh["normals"] = normals(mesh["positions"], mesh["indices"])
            for field in part.get("shapeFields", []):
                for field_surface in field["surfaces"]:
                    if field_surface["member"] == surface["id"]:
                        field_surface["displacements"] = map_surface(field_surface["displacements"], binding, operators, True)
                        if any(any(value != 0 for value in field_surface["displacements"][3*vertex:3*vertex+3]) for vertex in field_surface["heldVertices"]):
                            raise ValueError("Static source adaptation released a held shape-field attachment.")
            member = surface["id"].replace("/", "-").replace(":", "-")
            file = output / (part["id"] + "--" + member + ".mesh.json")
            mesh_bytes = json.dumps(mesh, separators=(",", ":"), allow_nan=False).encode()
            file.write_bytes(mesh_bytes)
            original_source = copy.deepcopy(surface["source"])
            source = {**original_source, "uri": str(file.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(mesh_bytes),
                      "revision": "static-generic-anatomical-adaptation/" + sha256(operator_bytes),
                      "acquisition": original_source["acquisition"] + "; source generic adaptation from " + original_source["uri"] + " original SHA-256 " + original_source["sha256"] + "; not MRI-derived target reconstruction"}
            surface.update({"mesh": mesh, "source": source, "compiledMeshSha256": ""})
            binding["account"] += "; baked with the same static bone operators and held target rest"
            receipts.append({"part": part["id"], "member": surface["id"], "originalSource": original_source, "bakedFile": source["uri"],
                             "bakedRawMeshSha256": source["sha256"], "vertices": len(mesh["positions"])//3, "triangles": len(mesh["indices"])//3,
                             "indexLineagePreserved": mesh["indices"] == old_mesh["indices"]})
        part["qualification"] += "; generic shared target-neutral static adaptation; same bone/site/field operator, no clinical target anatomy or pose capability"
        parts.append(part)
    result = {**assembly, "basis": registration["targetBodyBasis"], "generation": "static-adapted-neutral-" + sha256(operator_bytes + assembly_bytes)[:20],
              "mode": "neutral-only", "shape": registration["targetShape"], "parts": parts,
              "registration": "One source-owned anatomical joint-span/frame static operator " + sha256(operator_bytes) + "; derived generic anatomy, not patient reconstruction; adipose target-field generation pending"}
    result["rig"] = {"generation": result["generation"], "nodes": nodes}
    (output / "adapted-assembly-before-depot.json").write_text(json.dumps(result, separators=(",", ":"), allow_nan=False)+"\n", encoding="utf-8")
    (output / "static-source-bake-receipt.json").write_text(json.dumps({"assemblySha256": sha256(assembly_bytes), "operatorSha256": sha256(operator_bytes),
        "recipeSha256": sha256(Path(__file__).read_bytes()), "boneNodes": len(nodes), "parts": len(parts), "members": receipts, "pending": pending,
        "qualification": "Actual source adaptation bake; resident/Float32/skin fit/clinical/current-GPU admission pending"}, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"parts": len(parts), "sourceMembers": len(receipts), "pendingDepots": len(pending), "output": str(output.relative_to(ROOT))}))


if __name__ == "__main__":
    main()
