"""Sample the pinned MPFB human for the human source generation (#2689).

Run headless in Blender with the isolated profile prepared by
`prepare-mpfb-profile.py` (the orchestrator `sample-source-generation.ts`
does both):

    BLENDER_USER_RESOURCES=<work>/blender-profile \
    blender --background --factory-startup --python-exit-code 1 \
      --python test/scripts/human-source/sample-mpfb-generation.py -- \
      --data <work>/upstream/mpfb2/src/mpfb/data \
      --extra <work>/upstream/mpfb-extra-targets \
      --assets <work>/upstream/makehuman-system-assets \
      --makehuman <work>/upstream/makehuman \
      --out <work>/sample

What is sampled, all on one default human and one subdivided skin:

1. The neutral skin, its polygons, loop UVs, the interpolated game_engine bone
   weights and the face attachment weights, and the joint-cube centroids.
2. The nipple-exclusion fill operator from the source's own nipple targets.
3. Every state the published bases name as a source endpoint or that the face
   recipe recovery uses as a candidate: body regional targets, body macro
   nodes and every macro pair, face-region targets, the face macro nodes and
   every extra-targets expression file. Each state stores the exact skin delta
   and the landmark delta in Blender coordinates.
4. Restore and require the neutral skin and the landmarks back bit for bit.
5. Load the five attached face parts and refit them in the neutral and every
   body macro node, pair and face macro node state, at subdivision levels 0-2.

Nothing here rounds, clips, flattens or converts frames; the compiler owns
those steps so every published convention is applied in one visible place.
"""
import json
import os
import sys
import time

import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mpfb_generation import catalogue  # noqa: E402
from mpfb_generation.flatten import fill_operator  # noqa: E402
from mpfb_generation.landmarks import centroids, joint_groups  # noqa: E402
from mpfb_generation.session import Session  # noqa: E402
from mpfb_generation.parts import LEVELS, Parts, part_files  # noqa: E402
from mpfb_generation.store import Store  # noqa: E402


def log(*parts):
    print("[human-source]", *parts, flush=True)


def argument(arguments, name):
    if name not in arguments:
        raise SystemExit("Missing argument " + name)
    return os.path.abspath(arguments[arguments.index(name) + 1])


def main():
    arguments = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    data = argument(arguments, "--data")
    extra = argument(arguments, "--extra")
    assets = argument(arguments, "--assets")
    makehuman = argument(arguments, "--makehuman")
    output = argument(arguments, "--out")
    started = time.time()
    store = Store(output)
    session = Session(data)
    neutral = session.sample_skin()
    topology = session.read_topology()
    groups = joint_groups(data)
    marks_neutral = centroids(session.sample_helpers(), groups)
    log("neutral", neutral.shape, "polygons", len(topology["loop_start"]), "landmarks", marks_neutral.shape)

    store.array("neutral.f64", neutral, "<f8")
    store.array("landmarks-neutral.f64", marks_neutral, "<f8")
    store.array("loop-start.i32", topology["loop_start"], "<i4")
    store.array("loop-total.i32", topology["loop_total"], "<i4")
    store.array("loop-vertex.i32", topology["loop_vertex"], "<i4")
    store.array("loop-uv.f64", topology["loop_uv"], "<f8")
    with open(os.path.join(output, "weights.json"), "w", encoding="utf-8", newline="\n") as file:
        json.dump({"bones": topology["bones"], "attachments": topology["attachments"], "rays": topology["rays"]}, file, separators=(",", ":"))

    def sample():
        skin = session.sample_skin() - neutral
        marks = centroids(session.sample_helpers(), groups) - marks_neutral
        return skin, marks

    def target_path(name):
        return os.path.join(data, "targets", name + ".target.gz")

    # One fill operator per excluded region. The nipple files keep the names
    # the published body's extractor gave them.
    for label, names, prefix in (("nipple", catalogue.NIPPLE_TARGETS, "flatten"), ("genital", catalogue.GENITAL_TARGETS, "genital-fill")):
        region = set()
        for name in names:
            session.set_target_file(name, target_path(name), 1.0)
            skin, _ = sample()
            session.set_target_file(name, target_path(name), 0.0)
            region |= set(np.nonzero(np.linalg.norm(skin, axis=1) > 1e-9)[0].tolist())
        interior, boundary, operator = fill_operator(topology, sorted(region))
        store.array(prefix + "-interior.i32", interior, "<i4")
        store.array(prefix + "-boundary.i32", boundary, "<i4")
        store.array(prefix + "-operator.f64", operator, "<f8")
        log(label, "fill", len(interior), "interior", len(boundary), "boundary")

    sampled = set()

    def target_state(name, path, kind):
        if name in sampled:
            return
        sampled.add(name)
        session.set_target_file(name, path, 1.0)
        skin, marks = sample()
        session.set_target_file(name, path, 0.0)
        store.state(name, kind, skin, marks, {"target": os.path.relpath(path, os.path.dirname(data) if kind != "extra-target" else extra).replace(os.sep, "/")})

    def macro_state(name, macro, kind, recipe):
        if name in sampled:
            return
        sampled.add(name)
        session.set_macro(**macro)
        skin, marks = sample()
        session.set_macro()
        store.state(name, kind, skin, marks, {"macro": macro, **recipe})

    regional = catalogue.body_regional_channels(data)
    for channel in regional:
        for name in (channel["negative"], channel["positive"]):
            target_state(name, target_path(name), "body-target")
    log("body regional endpoints", len(sampled))
    for name, macro in catalogue.body_macro_states().items():
        macro_state(name, macro, "body-macro", {})
    for pair in catalogue.body_macro_pairs():
        macro_state(pair["id"], pair["macro"], "body-macro-pair", {"endpoints": pair["endpoints"]})
    log("body macro states and pairs done", len(sampled))
    for name in catalogue.face_region_targets(data):
        target_state(name, target_path(name), "face-target")
    for name, macro in catalogue.FACE_MACRO_STATES.items():
        macro_state(name, macro, "face-macro", {})
    for name, path in catalogue.extra_target_files(extra).items():
        target_state(name, path, "extra-target")
    log("all states", len(sampled))

    session.restore()
    skin, marks = sample()
    recovery = float(np.abs(skin).max())
    landmark_recovery = float(np.abs(marks).max())
    log("neutral recovery", recovery, "landmarks", landmark_recovery)
    if recovery != 0.0 or landmark_recovery != 0.0:
        raise SystemExit("Restoring every control did not recover the neutral exactly.")

    # Attached parts, refitted per macro state. Loaded only after the skin pass
    # and its recovery check, so a proxy can never alter a skin sample.
    parts = Parts(session, part_files(assets, makehuman))
    part_states = ["neutral"] + [state["name"] for state in store.states if state["kind"] in ("body-macro", "body-macro-pair", "face-macro")]
    samples = {}
    for name in part_states:
        if name == "neutral":
            session.set_macro()
        else:
            state = next(state for state in store.states if state["name"] == name)
            session.set_macro(**state["recipe"]["macro"])
        samples[name] = parts.sample()
    session.set_macro()
    part_records = []
    for index, part in enumerate(parts.items):
        files = {}
        for level in LEVELS:
            stack = np.stack([samples[name][part][level] for name in part_states])
            files[str(level)] = store.array(f"part-{index}-level-{level}.f64", stack, "<f8")
        part_records.append({"id": part, "files": files, "vertices": {str(level): int(samples["neutral"][part][level].shape[0]) for level in LEVELS}})
    log("parts", [(record["id"], record["vertices"]) for record in part_records])

    manifest_path = os.path.join(os.path.dirname(data), "blender_manifest.toml")
    with open(manifest_path, encoding="utf-8") as file:
        extension = [line.strip() for line in file if line.startswith("version") or line.startswith("blender_version_min")]
    store.close({
        "schema": "automovie-human-source-sample/1",
        "blender": bpy.app.version_string,
        "extension": extension,
        "extensionModule": session.HumanService.__module__,
        "numpy": np.__version__,
        "vertices": int(neutral.shape[0]),
        "polygons": int(len(topology["loop_start"])),
        "loops": int(len(topology["loop_vertex"])),
        "landmarkIds": list(groups.keys()),
        "parts": part_records,
        "partStates": part_states,
        "regionalChannels": regional,
        "neutralRecoveryMetres": recovery,
        "landmarkRecoveryMetres": landmark_recovery,
        "coordinates": "Blender metres, Z up, facing -Y; no rounding, clipping, flattening or frame conversion",
    })
    # The manifest is content: a rerun that samples the same bytes writes the
    # same manifest. The run clock is a fact about this run, kept beside it.
    with open(os.path.join(output, "run-environment.json"), "w", encoding="utf-8", newline="\n") as file:
        json.dump({"elapsedSeconds": round(time.time() - started, 1)}, file, indent=1)
        file.write("\n")
    log("written", output)


if __name__ == "__main__":
    main()
