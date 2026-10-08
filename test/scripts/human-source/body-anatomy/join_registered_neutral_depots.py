"""Join actual target-rest depot boundaries into the registered source assembly.

From the repository root:
  python test/scripts/human-source/body-anatomy/join_registered_neutral_depots.py ASSEMBLY DEPOTS SOURCE_BODY TARGET_BODY OUTPUT --source-preparation-receipt PREPARATION --cranial-assembly CRANIAL --cranial-receipt CRANIAL_RECEIPT --cranial-head-view ORIGINAL_HEAD --target-head-view HEAD

ASSEMBLY is the actual static registered bone/tissue payload before adipose.
DEPOTS is the maintained visceral-only target-field producer receipt. Both body views identify
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
Existing cranial members and fixed world frames are read from their original
assembly/head receipt and retained in N without another atlas transformation.
The returned preparation describes this actual static population, keeps the
original refusals, and leaves native SAT to its separate registration owner.
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
    parser.add_argument("--source-preparation-receipt", type=Path, required=True)
    for name in ("cranial-assembly", "cranial-receipt", "cranial-head-view", "target-head-view"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    assembly_bytes, depot_bytes = args.assembly.read_bytes(), args.depots.read_bytes()
    assembly = json.loads(assembly_bytes)
    depots = json.loads(depot_bytes)
    preparation_bytes = args.source_preparation_receipt.read_bytes()
    preparation = json.loads(preparation_bytes)
    if not isinstance(preparation["sourceGaps"], list):
        raise ValueError("Visceral source join needs the complete original preparation refusals.")
    if [part["id"] for part in depots["parts"]] != ["abdominalVisceralAdipose"]:
        raise ValueError("Only the regenerated visceral source may join; native SAT keeps its separate owner.")
    if any(part["tissue"] == "adipose" for part in assembly["parts"]) or assembly.get("exteriorBinding") is not None:
        raise ValueError("Visceral join requires the unbound nonadipose source; existing tissue or binding cannot be replaced.")
    cranial_inputs = [(getattr(args, name), getattr(args, name).read_bytes()) for name in ("cranial_assembly", "cranial_receipt", "cranial_head_view", "target_head_view")]
    cranial = json.loads(cranial_inputs[0][1])
    cranial_receipt = json.loads(cranial_inputs[1][1])
    old_head = json.loads(gzip.decompress(cranial_inputs[2][1]))
    target_head = json.loads(gzip.decompress(cranial_inputs[3][1]))
    if digest(cranial_inputs[0][1]) != cranial_receipt["assemblySha256"] or digest(cranial_inputs[2][1]) != cranial_receipt["headSha256"]:
        raise ValueError("Cranial target-rest source lacks its original assembly/head receipt identity.")
    for field in ("positions", "indices"):
        if old_head["face"]["surfaces"][0][field] != target_head["face"]["surfaces"][0][field]:
            raise ValueError("Existing cranial target-rest placement does not match this head skin: " + field)
    cranial_ids = set(cranial_receipt["addedParts"])
    cranial_parts = [part for part in cranial["parts"] if part["id"] in cranial_ids]
    cranial_nodes = [node for node in cranial["rig"]["nodes"] if node["id"] in cranial_ids]
    if len(cranial_parts) != len(cranial_ids) or len(cranial_nodes) != len(cranial_ids) or any(part["id"] in cranial_ids for part in assembly["parts"]):
        raise ValueError("Cranial source identity population is missing or duplicated.")
    source_body_bytes, target_body_bytes = args.source_body.read_bytes(), args.target_body.read_bytes()
    source_view = json.loads(gzip.decompress(source_body_bytes))
    target_view = json.loads(gzip.decompress(target_body_bytes))
    if target_head["id"] != target_view["id"] or old_head["id"] != source_view["id"]:
        raise ValueError("Retained cranial and new body sources need their actual common generation frame.")
    for field in ("positions", "indices"):
        if source_view["body"]["surfaces"][0][field] != target_view["body"]["surfaces"][0][field]:
            raise ValueError("Registered visceral target skin changed before packaging: " + field)
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
    # Keep the existing visceral carry on the registered body graph. Cranial
    # geometry and fixed world frames already use N and append unchanged;
    # the new atlas-to-N operators never carry those source points again.
    assembly["parts"].extend(cranial_parts)
    assembly["rig"]["nodes"].extend(cranial_nodes)
    assembly["basis"] = target_view["body"]["id"]
    assembly["exteriorBinding"] = {"neighbours": 8, "power": 2,
        "account": "Existing coarse neutral convention: source members, unit field endpoints and held graph world origins/sites share the inverse-squared displacement of eight nearest neutral skin vertices. Bone rigidity, tissue volume/contact and global injectivity are not certified."}
    generation = "registered-whole-neutral-" + digest(assembly_bytes + depot_bytes + target_body_bytes + preparation_bytes + b"".join(data for _, data in cranial_inputs) + Path(__file__).read_bytes())[:20]
    assembly["generation"] = generation
    assembly["rig"]["generation"] = generation
    assembly["registration"] += "; same actual joint/landmark/channel/ray definitions rebound to corrected target " + target_view["id"]
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.mkdir()
    output_bytes = (json.dumps(assembly, separators=(",", ":"), allow_nan=False)+"\n").encode("utf-8")
    (output / "source-assembly-before-node-digest.json").write_bytes(output_bytes)
    actual_inputs = ((args.assembly, assembly_bytes), (args.depots, depot_bytes),
                     (args.source_body, source_body_bytes), (args.target_body, target_body_bytes),
                     (args.source_preparation_receipt, preparation_bytes),
                     (Path(__file__), Path(__file__).read_bytes()), *cranial_inputs)
    source_inputs = {str(file.resolve().relative_to(ROOT)).replace("\\", "/"): digest(data)
                     for file, data in actual_inputs}
    prepared = {"generation": generation, "parts": [part["id"] for part in assembly["parts"]],
        "parentPreparation": {"uri": str(args.source_preparation_receipt.resolve().relative_to(ROOT)).replace("\\", "/"), "sha256": digest(preparation_bytes)},
        "originalInputs": {**preparation["originalInputs"], **source_inputs, **{depot["source"]["uri"]: depot["source"]["sha256"] for depot in receipts}},
        "sourceGaps": preparation["sourceGaps"], "producerSha256": digest(Path(__file__).read_bytes()),
        "qualification": "Actual static population before native SAT registration; original source refusals retained, visceral regenerated, subcutaneous identity remains with its native field owner."}
    (output / "source-preparation-receipt.json").write_text(json.dumps(prepared, indent=2) + "\n", encoding="utf-8")
    (output / "joined-source-receipt.json").write_text(json.dumps({"sourceAssemblySha256": digest(assembly_bytes), "depotReceiptSha256": digest(depot_bytes),
        "sourceAssemblyOutputSha256": digest(output_bytes), "recipeSha256": digest(Path(__file__).read_bytes()), "sourceInputs": source_inputs,
        "originalTargetBodySha256": digest(source_body_bytes), "currentTargetBodySha256": digest(target_body_bytes), "generation": generation,
        "parts": len(assembly["parts"]), "members": sum(len(part["surfaces"]) for part in assembly["parts"]), "depots": receipts,
        "publisherOmittedEmptyLandmarkTargets": sorted(omitted_empty_landmark_targets),
        "meaning": "All actual source parts joined into one neutral source; runtime/model/F32/GPU acceptance and refinements remain separate"}, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"generation": generation, "parts": len(assembly["parts"]), "members": sum(len(part["surfaces"]) for part in assembly["parts"])}))


if __name__ == "__main__":
    main()
