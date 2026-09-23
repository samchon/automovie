"""Extract the face's articulation attachments from the pinned MPFB revision (offline).

Run from the repository root:

    blender --background --factory-startup --python test/scripts/face-review/extract-face-attachments.py -- [--write]

Without `--write` the extraction runs to the end, prints the receipt and
writes nothing under `test/studies/`. With it, `face-attachments.json.gz` and
`face-attachments-receipt.json` are written beside the committed face basis.

What it produces, and why each part is measured rather than authored:

1. Skin attachment weights. The CC0 `default` rig paints every base vertex
   with bone weights; the mandibular weight of a vertex is the sum over the
   `jaw` subtree and each globe's weight is its `eye.*` bone. Blender
   interpolates those groups through the same limit-surface subdivision that
   produced the face basis, and the correspondence reads them back in the
   basis's vertex order, so the weights are the source's own statement of
   which tissue the mandible carries, transported exactly.
2. Joint landmarks. The centroids of the source's `joint-*` helper cubes
   (mouth, jaw, both eyes and their targets, head, neck, tongue chain) in the
   face frame at the neutral.
3. Landmark motion per shape endpoint. Every published shape endpoint is
   matched to the source target or macro node it was sampled from (see
   `recipes`), which also recovers the binocular frame shift the extraction
   applied; the cube centroids are sampled in the same state and published
   as sparse landmark deltas under that shift, so a joint follows the shape
   that moves it exactly as the source's joint cubes do. An endpoint whose
   recipe cannot be recovered within tolerance is reported as unmatched and
   receives no landmark row; the preparation step decides what that means.
4. Neutral recovery. Restoring every state must return the skin and the cubes
   to the last bit, or nothing is published.

The document layout is consumed by `prepare-articulated-basis.ts`, whose
TypeScript admission is the authority on what it accepts.
"""
import datetime
import gzip
import hashlib
import json
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from face_extraction import recipes  # noqa: E402
from face_extraction.correspondence import Correspondence, load_face_basis, to_face_frame  # noqa: E402
from face_extraction.session import MPFB_DATA, ROOT, Session  # noqa: E402

OUTPUT = os.path.join(ROOT, "test", "studies", "human-face", "connected-basis", "global-face")
SOURCE_COMMIT = "817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5"
OWNERS = ["jaw", "eyeL", "eyeR"]
CUBES = [
    "joint-mouth", "joint-jaw", "joint-l-eye", "joint-r-eye", "joint-l-eye-target", "joint-r-eye-target",
    "joint-head", "joint-head-2", "joint-neck", "joint-tongue-1", "joint-tongue-2", "joint-tongue-3", "joint-tongue-4",
]


def log(*parts):
    print("[face]", *parts, flush=True)


def cube_groups():
    with open(os.path.join(MPFB_DATA, "mesh_metadata", "basemesh_vertex_groups.json"), encoding="utf-8") as file:
        groups = json.load(file)
    return {name: np.concatenate([np.arange(a, b + 1) for a, b in groups[name]]) for name in CUBES}


def cube_centroids(helpers, groups, offset):
    """(cubes, 3) centroids in the face frame."""
    raw = np.array([helpers[rows].mean(axis=0) for rows in groups.values()])
    return to_face_frame(raw, offset)


def sparse(delta, decimals=7):
    rounded = np.round(delta, decimals)
    moved = np.nonzero(np.any(rounded != 0.0, axis=1))[0]
    flat = []
    for index in moved:
        flat.append(int(index))
        flat.extend(float(v) for v in rounded[index])
    return flat


def main():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    write = "--write" in arguments
    started = time.time()
    session = Session()
    basis = load_face_basis()
    neutral_full = session.sample_skin()
    topology = session.read_topology()
    helpers_neutral = session.sample_helpers()
    log("neutral skin", neutral_full.shape, "helpers", helpers_neutral.shape)
    correspondence = Correspondence(neutral_full, topology["edges"], basis)
    report = correspondence.report()
    log("correspondence", report)
    neutral = correspondence.evaluate(neutral_full)
    neutral_error = float(np.abs(neutral - correspondence.face).max())
    if report["worstMatchMetres"] > 1e-7 or neutral_error > 1e-7:
        raise SystemExit("The subdivided skin does not reproduce the face basis; refusing to publish.")
    weights = correspondence.weights(topology["weights"], OWNERS)
    weight_report = {
        owner: {
            "vertices": int((weights[:, k] > 0).sum()),
            "fullyAttached": int((weights[:, k] >= 0.999).sum()),
            "maximum": float(weights[:, k].max()),
        }
        for k, owner in enumerate(OWNERS)
    }
    log("weights", weight_report)
    groups = cube_groups()
    landmarks_neutral = cube_centroids(helpers_neutral, groups, correspondence.offset)

    candidates = {}
    candidate_marks = {}

    def sample(name):
        candidates[name] = correspondence.evaluate(session.sample_skin()) - neutral
        candidate_marks[name] = cube_centroids(session.sample_helpers(), groups, correspondence.offset) - landmarks_neutral

    for name in recipes.candidate_targets():
        session.set_target(name, 1.0)
        sample(name)
        session.set_target(name, 0.0)
    for name, state in recipes.MACRO_STATES.items():
        session.set_macro(**state)
        sample(name)
        session.set_macro()
    log("candidates", len(candidates), "elapsed", round(time.time() - started, 1))

    session.restore()
    recovery = float(np.abs(correspondence.evaluate(session.sample_skin()) - neutral).max())
    landmark_recovery = float(np.abs(cube_centroids(session.sample_helpers(), groups, correspondence.offset) - landmarks_neutral).max())
    log("neutral recovery", recovery, "landmarks", landmark_recovery)
    if recovery != 0.0 or landmark_recovery != 0.0:
        raise SystemExit("Restoring every control did not recover the neutral exactly; refusing to publish.")

    published = recipes.published_endpoints(basis)
    matches = recipes.match(published, candidates)
    recipe_record, unmatched, landmark_targets = {}, {}, {}
    for name, (candidate, shift, residual) in matches.items():
        entry = {"source": candidate, "shiftMetres": [float(v) for v in shift], "residualMetres": residual}
        if residual <= recipes.TOLERANCE:
            recipe_record[name] = entry
            rows = sparse(candidate_marks[candidate] - shift)
            if rows:
                landmark_targets[name] = rows
        else:
            unmatched[name] = entry
    log("recipes matched", len(recipe_record), "unmatched", len(unmatched))
    for name, entry in unmatched.items():
        log("unmatched", name, entry)

    face_bytes = correspondence.face.astype("<f8").tobytes()
    document = {
        "basis": basis["id"],
        "sourceCommit": SOURCE_COMMIT,
        "surface": "Human",
        "neutralFloat64LESha256": hashlib.sha256(face_bytes).hexdigest(),
        "owners": OWNERS,
        "weights": {owner: [v for index in np.nonzero(weights[:, k] > 0)[0] for v in (int(index), float(round(weights[index, k], 7)))] for k, owner in enumerate(OWNERS)},
        "landmarks": {
            "ids": CUBES,
            "positions": [float(v) for v in landmarks_neutral.reshape(-1)],
            "targets": landmark_targets,
        },
        "recipes": recipe_record,
        "unmatched": unmatched,
    }
    payload = json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    with open(os.path.abspath(__file__), "rb") as file:
        script_digest = hashlib.sha256(file.read()).hexdigest()
    record = {
        "recorded": datetime.date.today().isoformat(),
        "sourceCommit": SOURCE_COMMIT,
        "script": {"path": "test/scripts/face-review/extract-face-attachments.py", "sha256": script_digest},
        "blender": __import__("bpy").app.version_string,
        "correspondence": {**report, "neutralErrorMetres": neutral_error},
        "weights": {**weight_report, "owners": {"jaw": "sum of the default rig's jaw subtree", "eyeL": "eye.L", "eyeR": "eye.R"}},
        "landmarks": {"cubes": CUBES, "endpointsWithMotion": len(landmark_targets)},
        "recipes": {"candidates": len(candidates), "toleranceMetres": recipes.TOLERANCE, "matched": len(recipe_record), "unmatched": sorted(unmatched)},
        "neutralRecoveryMaximumMetres": {"Human": recovery, "landmarks": landmark_recovery},
        "uncompressedSha256": hashlib.sha256(payload).hexdigest(),
        "uncompressedBytes": len(payload),
        "elapsedSeconds": round(time.time() - started, 1),
        "limits": [
            "Weights are the source rig's painted attachment, transported through the subdivision; not measured tissue mechanics",
            "Landmarks are the source's joint cube centroids; not clinical joint centres",
            "Expression endpoints move no landmark by design",
        ],
    }
    if write:
        path = os.path.join(OUTPUT, "face-attachments.json.gz")
        with open(path, "wb") as raw:
            with gzip.GzipFile(fileobj=raw, mode="wb", mtime=0, compresslevel=9) as file:
                file.write(payload)
        with open(path, "rb") as file:
            record["compressedSha256"] = hashlib.sha256(file.read()).hexdigest()
        record["compressedBytes"] = os.path.getsize(path)
        with open(os.path.join(OUTPUT, "face-attachments-receipt.json"), "w", encoding="utf-8", newline="\n") as file:
            json.dump(record, file, indent=2)
            file.write("\n")
        log("written", path)
    else:
        log("dry run; receipt follows")
    print(json.dumps(record, indent=2), flush=True)


if __name__ == "__main__":
    main()
