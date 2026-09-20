"""Extract the connected body basis from the pinned MPFB revision (offline).

Run from the repository root:

    blender --background --python test/scripts/body-review/extract-body-basis.py -- [--write]

Without `--write` the extraction runs to the end, prints every receipt figure
and writes nothing under `test/studies/`. With it, the basis and its receipt
are written to `test/studies/human-body/connected-basis/`.

Order, and why it is this order:

1. Create the default MPFB human with the game_engine weights bound and one
   limit-surface subdivision (`session`). Read the neutral skin, its topology
   and the helper base mesh once.
2. Solve the face-frame offset against the committed face basis and prove that
   every non-ring face vertex has an exact body twin (`receipt.face_offset`);
   the extraction refuses to continue otherwise, because the neck ring would
   not be shared.
3. Build the clip stencil on the neutral (`clip.Stencil`) and check the ring
   against the face's ring.
4. Sample every endpoint state through MPFB itself: regional targets one at a
   time, macro axes one node at a time, and every macro axis pair at every sign
   combination for the combination correctives. Each state yields the clipped
   skin delta and the joint landmark delta in the face frame.
5. Restore everything and require the neutral back to the last bit.
6. Measure mirror pairs, left/right endpoint agreement, per-endpoint statistics,
   then assemble joints (frames, clinical signs, constraints), skin weights and
   the JSON document, and write it with a deterministic gzip and a receipt.

The document layout is the `IAutoMovieHumanBodyBasis` contract of
`@automovie/human`; the TypeScript validator is the authority on what is
admitted, this script only produces it.
"""
import datetime
import hashlib
import json
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from body_extraction import channels as channel_table  # noqa: E402
from body_extraction import receipt as measure  # noqa: E402
from body_extraction import rig  # noqa: E402
from body_extraction.clip import Stencil  # noqa: E402
from body_extraction.session import ROOT, Session  # noqa: E402

REVISION = "mpfb-connected-body-2026-09-20-joints-and-measures"
OUTPUT = os.path.join(ROOT, "test", "studies", "human-body", "connected-basis")
CORRECTIVE_THRESHOLD_METRES = 0.0005
SKIN_MATERIAL = {
    "id": "skin", "name": "skin",
    "baseColor": {"r": 0.58, "g": 0.34, "b": 0.3, "a": 1, "hex": None},
    "roughness": 0.55, "metallic": 0, "opacity": 1, "emissive": None,
    "baseColorTexture": None, "doubleSided": True,
}


def log(*parts):
    print("[body]", *parts, flush=True)


def main():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    write = "--write" in arguments
    started = time.time()
    session = Session()
    neutral_full = session.sample_skin()
    topology = session.read_topology()
    helpers_neutral = session.sample_helpers()
    log("neutral skin", neutral_full.shape, "helpers", helpers_neutral.shape)

    correspondence = measure.face_offset(neutral_full, topology)
    log("face correspondence", correspondence)
    if correspondence["worstMatchMetres"] > 1e-7 or min(correspondence["uvWorstPlain"], correspondence["uvWorstFlipped"]) > 1e-6:
        raise SystemExit("The subdivided body does not reproduce the face basis head or its UVs; refusing to publish.")
    offset = correspondence["offset"]
    stencil = Stencil(neutral_full, topology, offset)
    neutral = stencil.evaluate(neutral_full)
    ring = measure.ring_agreement(neutral, len(stencil.kept))
    log("ring", ring)
    if ring["faceRing"] != ring["bodyRing"] or ring["worstMetres"] > 1e-7:
        raise SystemExit("The body ring does not coincide with the face ring; refusing to publish.")
    groups = rig.landmark_groups()
    landmark_ids = list(groups.keys())
    landmarks_neutral = rig.landmark_positions(helpers_neutral, groups, offset)
    landmark_matrix = np.array([landmarks_neutral[name] for name in landmark_ids])

    def sample_state():
        skin = stencil.evaluate(session.sample_skin()) - neutral
        marks = rig.landmark_positions(session.sample_helpers(), groups, offset)
        return skin, np.array([marks[name] for name in landmark_ids]) - landmark_matrix

    endpoints = {}
    stats = {}
    regional = channel_table.regional_channels()
    for channel in regional:
        for name in (channel["negative"], channel["positive"]):
            if name in endpoints:
                continue
            session.set_target(name, 1.0)
            endpoints[name] = sample_state()
            session.set_target(name, 0.0)
            stats[name] = measure.displacement_stats(endpoints[name][0])
            log("endpoint", name, stats[name])
    macro = channel_table.macro_channels()
    for name, state in channel_table.macro_endpoint_states().items():
        session.set_macro(**state)
        endpoints[name] = sample_state()
        session.set_macro()
        stats[name] = measure.displacement_stats(endpoints[name][0])
        log("endpoint", name, stats[name])
    correctives = []
    corrective_record = []
    for pair in channel_table.macro_pair_states():
        session.set_macro(**pair["macro"])
        skin, marks = sample_state()
        session.set_macro()
        a, b = pair["endpoints"]
        residual_skin = skin - endpoints[a][0] - endpoints[b][0]
        residual_marks = marks - endpoints[a][1] - endpoints[b][1]
        stat = measure.displacement_stats(residual_skin)
        kept = stat["maxMetres"] >= CORRECTIVE_THRESHOLD_METRES
        corrective_record.append({"id": pair["id"], "inputs": pair["inputs"], **stat, "published": kept})
        log("corrective", pair["id"], stat, "published" if kept else "below threshold")
        if kept:
            endpoints[pair["id"]] = (residual_skin, residual_marks)
            correctives.append({"id": pair["id"], "inputs": pair["inputs"], "weight": 1, "target": pair["id"]})

    session.restore()
    recovered = stencil.evaluate(session.sample_skin())
    recovery = float(np.abs(recovered - neutral).max())
    landmark_recovery = float(np.abs(np.array([rig.landmark_positions(session.sample_helpers(), groups, offset)[n] for n in landmark_ids]) - landmark_matrix).max())
    log("neutral recovery", recovery, "landmarks", landmark_recovery)
    if recovery != 0.0 or landmark_recovery != 0.0:
        raise SystemExit("Restoring every control did not recover the neutral exactly; refusing to publish.")

    mate, mirror = measure.mirror_pairs(neutral)
    log("mirror", mirror)
    pair_residuals = {}
    for channel in regional:
        if channel["mirror"] is not None and channel["id"].endswith("Left"):
            other = next(c for c in regional if c["id"] == channel["mirror"])
            pair_residuals[channel["id"]] = {
                "positive": measure.mirror_residual(endpoints[channel["positive"]][0], endpoints[other["positive"]][0], mate),
                "negative": measure.mirror_residual(endpoints[channel["negative"]][0], endpoints[other["negative"]][0], mate),
            }
    worst_pair = max(max(v.values()) for v in pair_residuals.values())
    log("left/right endpoint mirror worst metres", worst_pair)

    cubes = rig.rig_cubes()
    limits = rig.constraints()
    joints = []
    joint_record = []
    for slot, (parent, head_cube, tail_cube) in cubes.items():
        reference, signs = rig.signs(slot, landmarks_neutral, landmarks_neutral[head_cube], landmarks_neutral[tail_cube])
        constraint, source = limits[slot]
        joints.append({
            "bone": slot, "parent": parent, "head": head_cube, "tail": tail_cube,
            "reference": [float(v) for v in reference], "signs": signs, "constraint": constraint,
        })
        joint_record.append({"bone": slot, "constraintSource": source, "signs": signs})

    weight_rows = stencil.weights(topology["weights"])
    joint_names = [slot for slot in cubes]
    mpfb_to_slot = {mpfb: slot for slot, mpfb in rig.BONES.items()}
    bone_indices, weights = [], []
    dropped = 0.0
    for rows in weight_rows:
        named = sorted(((mpfb_to_slot[b], w) for b, w in rows if b in mpfb_to_slot), key=lambda r: -r[1])
        top = named[:4]
        if len(named) > 4:
            dropped = max(dropped, named[4][1])
        total = sum(w for _, w in top)
        if total <= 0:
            raise SystemExit("A skin vertex has no bone weight")
        padded = [(joint_names.index(b), w / total) for b, w in top] + [(0, 0.0)] * (4 - len(top))
        bone_indices.extend(i for i, _ in padded)
        weights.extend(round(w, 7) for _, w in padded)

    # Endpoint rows are rounded to a micrometre: the source positions are
    # single precision, whose resolution over a two-metre body is about a tenth
    # of a micrometre, and a channel's smallest useful commitment is a
    # millimetre. Rows that round to zero are omitted, as the face basis does.
    def rows_for(delta, decimals=6):
        flat, _count = measure.sparse_rows(delta, decimals)
        return flat

    positions = neutral.reshape(-1).tolist()
    uvs = stencil.uvs.copy()
    if correspondence["invertV"]:
        uvs[:, 1] = 1.0 - uvs[:, 1]
    document = {
        "id": REVISION,
        "channels": [
            {"id": c["id"], "kind": "shape", "group": c["group"], "mirror": c["mirror"], "minimum": -1, "maximum": 1, "positive": c["positive"], "negative": c["negative"]}
            for c in regional + macro
        ],
        "correctives": correctives,
        "landmarks": {
            "ids": landmark_ids,
            "positions": landmark_matrix.reshape(-1).tolist(),
            "targets": {name: rows for name, rows in ((n, rows_for(e[1])) for n, e in endpoints.items()) if rows},
        },
        "joints": joints,
        "surfaces": [{
            "id": "Human",
            "positions": positions,
            "indices": stencil.indices.tolist(),
            "targets": {name: rows_for(e[0]) for name, e in endpoints.items()},
            "regions": [{"id": "Human/skin", "material": "skin", "indices": stencil.indices.tolist(), "uvs": uvs.reshape(-1).tolist()}],
            "skin": {"joints": joint_names, "boneIndices": bone_indices, "weights": weights},
        }],
        "materials": [SKIN_MATERIAL],
    }
    payload = measure.serialize(document)
    with open(os.path.abspath(__file__), "rb") as file:
        script_digest = hashlib.sha256(file.read()).hexdigest()
    record = {
        "id": REVISION,
        "recorded": datetime.date.today().isoformat(),
        "sources": "test/studies/human-body/references-receipt.json",
        "script": {"path": "test/scripts/body-review/extract-body-basis.py", "sha256": script_digest},
        "blender": __import__("bpy").app.version_string,
        "frame": {"offset": offset, "groundY": float(neutral[:, 1].min()), "cutY": -0.145},
        "correspondence": correspondence,
        "ring": ring,
        "vertices": {"kept": int(len(stencil.kept)), "ring": int(len(stencil.ring_t)), "triangles": int(len(stencil.indices) // 3)},
        "endpointRowResolutionMetres": 1e-6,
        "neutralRecoveryMaximumMetres": {"Human": recovery, "landmarks": landmark_recovery},
        "basisMirror": {**mirror, "leftRightEndpointWorstMetres": worst_pair, "pairs": pair_residuals},
        "channels": {"regional": len(regional), "macro": len(macro), "endpoints": len(endpoints) - len(correctives)},
        "endpointDisplacement": stats,
        "macroPairCorrectives": {"thresholdMetres": CORRECTIVE_THRESHOLD_METRES, "sampled": corrective_record, "published": len(correctives)},
        "skin": {"influences": 4, "largestDroppedWeight": dropped, "joints": len(joint_names)},
        "joints": joint_record,
        "excludedTargets": sorted(channel_table.EXCLUDED_CATEGORIES) + ["genitals/*", "asym/*", "macro race", "face folders"],
        "limits": [
            "Authored upstream prior, not individual anatomy",
            "Joints are hinge/ball approximations at MPFB joint cube centroids; no scapulohumeral rhythm or knee screw-home",
            "No collision, physiological or likeness acceptance",
        ],
        "uncompressedSha256": measure.digest(payload),
        "uncompressedBytes": len(payload),
        "elapsedSeconds": round(time.time() - started, 1),
    }
    if write:
        os.makedirs(OUTPUT, exist_ok=True)
        compressed, size = measure.write_gzip(os.path.join(OUTPUT, "basis.json.gz"), payload)
        record["compressedSha256"], record["compressedBytes"] = compressed, size
        with open(os.path.join(OUTPUT, "extraction-receipt.json"), "w", encoding="utf-8", newline="\n") as file:
            json.dump(record, file, indent=2)
            file.write("\n")
        log("written", OUTPUT, compressed, size)
    else:
        log("dry run; receipt follows")
        print(json.dumps({k: v for k, v in record.items() if k not in ("endpointDisplacement", "basisMirror", "joints", "macroPairCorrectives")}, indent=2), flush=True)


if __name__ == "__main__":
    main()
