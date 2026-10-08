"""Join actual target-rest depot boundaries into the registered source assembly.

From the repository root:
  python test/scripts/human-source/body-anatomy/join_registered_neutral_depots.py ASSEMBLY DEPOTS SOURCE_BODY TARGET_BODY OUTPUT

ASSEMBLY is the actual static registered bone/tissue payload before adipose.
DEPOTS is the existing target-field producer receipt. Both body views identify
the registration and target exterior. The resulting assembly and receipt feed
join-registered-members.mjs with its static-source mode before the normal
typed anatomical compiler. This source entry retains its authored metre OBJ
reader locally, so replay needs no ignored preparation-program import.

The actual registered bones/tissues and target-field depot sources are read
without changing their geometry. Each depot retains its field receipt and its
separate coarse support/weight account. Generation rebinding requires unchanged
source joints, landmarks, channels and toe rays; the target's corrected exterior
is independently preserved. Clinical/contact/appearance admission is separate.
The receipt binds the exact serialized output and the bytes of every actual
input and reader recipe, so Node object sealing cannot substitute another
payload or silently inherit a superseded producer. Output bytes are serialized
once and hashed directly; original source and earlier receipts stay unchanged.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[4]


def digest(data):
    return hashlib.sha256(data).hexdigest()



def read_authored_obj(path):
    """Read authored metre XYZ/normal triples and corresponding triangle ordinals.

    These depot OBJs already use the registered target frame; no atlas axis or
    millimetre conversion occurs. Vertex and corner-normal indices must agree.
    The native typed source compiler owns subsequent geometry admission.
    """
    positions, normals, indices = [], [], []
    for line in path.read_text().splitlines():
        fields = line.split()
        if not fields or fields[0].startswith("#"):
            continue
        if fields[0] in ("v", "vn"):
            (positions if fields[0] == "v" else normals).extend(map(float, fields[1:]))
        elif fields[0] == "f":
            for corner in fields[1:]:
                vertex, normal = corner.split("//")
                if vertex != normal:
                    raise ValueError("Authored surface has unregistered corner correspondence: " + str(path))
                indices.append(int(vertex) - 1)
        else:
            raise ValueError("Unsupported authored source record: " + fields[0])
    return {"positions": positions, "normals": normals, "indices": indices, "uvs": None, "skin": None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("assembly", type=Path)
    parser.add_argument("depots", type=Path)
    parser.add_argument("source_body", type=Path)
    parser.add_argument("target_body", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    assembly_bytes, depot_bytes = args.assembly.read_bytes(), args.depots.read_bytes()
    assembly = json.loads(assembly_bytes)
    depots = json.loads(depot_bytes)
    source_body_bytes, target_body_bytes = args.source_body.read_bytes(), args.target_body.read_bytes()
    source_view = json.loads(gzip.decompress(source_body_bytes))
    target_view = json.loads(gzip.decompress(target_body_bytes))
    omitted_empty_landmark_targets = []
    source_landmarks = source_view["body"]["landmarks"]
    target_landmarks = target_view["body"]["landmarks"]
    for endpoint, values in source_landmarks["targets"].items():
        if endpoint not in target_landmarks["targets"]:
            if values != []:
                raise ValueError("Published source removed a real landmark contribution: " + endpoint)
            omitted_empty_landmark_targets.append(endpoint)
    registered_landmarks = {**source_landmarks, "targets": {
        endpoint: values for endpoint, values in source_landmarks["targets"].items()
        if endpoint not in omitted_empty_landmark_targets}}
    if registered_landmarks != target_landmarks:
        raise ValueError("Actual source landmark positions or resident contributions changed.")
    for field in ("joints", "channels", "toeRays"):
        if source_view["body"][field] != target_view["body"][field]:
            raise ValueError("Actual registered source rest changed before target rebinding: " + field)
    names = [node["id"] for node in assembly["rig"]["nodes"]]
    points = np.asarray([[node["rest"]["position"][axis] for axis in ("x", "y", "z")] for node in assembly["rig"]["nodes"]])
    tree = cKDTree(points)
    receipts = []
    for record in depots["parts"]:
        file = ROOT / record["file"]
        data = file.read_bytes()
        if digest(data) != record["sha256"]:
            raise ValueError("Actual authored depot bytes changed: " + record["id"])
        mesh = read_authored_obj(file)
        source_points = np.asarray(mesh["positions"]).reshape((-1, 3))
        distances, indices = tree.query(source_points, k=4)
        weights = 1 / np.maximum(distances, 1e-12)**2
        weights /= weights.sum(axis=1)[:, None]
        member = record["id"] + "/registered-source-field"
        site = "region:" + record["id"] + ":sourceFrameSupport"
        if not any(node["id"] == "sacrum" and any(one["id"] == site for one in node["sites"]) for node in assembly["rig"]["nodes"]):
            raise ValueError("Actual target neutral depot support site is absent.")
        source = {"uri": record["file"], "revision": "registered-neutral-material-field/" + digest(depot_bytes), "sha256": digest(data),
                  "license": depots["rights"], "licenseUri": "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
                  "attribution": "BodyParts3D/DBCLS source references and independently authored target-rest depot adaptation for automovie.",
                  "anatomicalIdentity": record["id"], "acquisition": "Actual source-neutral exterior/cut volume and statically registered internal support field; not personal adipose segmentation or clinical tissue."}
        assembly["parts"].append({"id": record["id"], "tissue": "adipose", "qualification": record["qualification"] + "; generated on the same target exterior and registered internal sources; contact/render/F32/clinical acceptance remains independent",
            "attachments": [{"bone": "sacrum", "site": site, "role": "support", "account": "Actual registered neutral source frame support; per-vertex anatomical carry is separately authored and is not a rigid depot motion claim."}],
            "surfaces": [{"id": member, "mesh": mesh, "source": source, "compiledMeshSha256": "", "binding": {"bones": names, "boneIndices": indices.reshape(-1).tolist(), "weights": weights.reshape(-1).tolist(),
                "account": "Authored inverse-square four-slot carry on the actual registered target bone frames; immutable source data, not biological motion or contact."}}]})
        receipts.append({"part": record["id"], "member": member, "source": source, "vertices": len(source_points), "indices": len(mesh["indices"])})
    assembly["basis"] = target_view["body"]["id"]
    generation = "registered-whole-neutral-" + digest(assembly_bytes + depot_bytes + target_body_bytes)[:20]
    assembly["generation"] = generation
    assembly["rig"]["generation"] = generation
    assembly["registration"] += "; same actual joint/landmark/channel/ray definitions rebound to corrected target " + target_view["id"]
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    output_bytes = (json.dumps(assembly, separators=(",", ":"), allow_nan=False)+"\n").encode("utf-8")
    (output / "source-assembly-before-node-digest.json").write_bytes(output_bytes)
    actual_inputs = ((args.assembly, assembly_bytes), (args.depots, depot_bytes),
                     (args.source_body, source_body_bytes), (args.target_body, target_body_bytes),
                     (Path(__file__), Path(__file__).read_bytes()))
    source_inputs = {str(file.resolve().relative_to(ROOT)).replace("\\", "/"): digest(data)
                     for file, data in actual_inputs}
    (output / "joined-source-receipt.json").write_text(json.dumps({"sourceAssemblySha256": digest(assembly_bytes), "depotReceiptSha256": digest(depot_bytes),
        "sourceAssemblyOutputSha256": digest(output_bytes), "recipeSha256": digest(Path(__file__).read_bytes()), "sourceInputs": source_inputs,
        "originalTargetBodySha256": digest(source_body_bytes), "currentTargetBodySha256": digest(target_body_bytes), "generation": generation,
        "parts": len(assembly["parts"]), "members": sum(len(part["surfaces"]) for part in assembly["parts"]), "depots": receipts,
        "publisherOmittedEmptyLandmarkTargets": sorted(omitted_empty_landmark_targets),
        "meaning": "All actual source parts joined into one neutral source; runtime/model/F32/GPU acceptance and refinements remain separate"}, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"generation": generation, "parts": len(assembly["parts"]), "members": sum(len(part["surfaces"]) for part in assembly["parts"])}))


if __name__ == "__main__":
    main()
