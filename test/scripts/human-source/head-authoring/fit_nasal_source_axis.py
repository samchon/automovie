"""Fit a source-family extrusion axis from its actual native cap normals.

This is source preparation, not a fixture, correctness probe or clinical
measurement. Every original native state contributes both triangles of each
licensed130-cell cap. A strict positive common normal halfspace provides an
axis along which the entire existing cap, rather than an invented boundary
fan, can be carried. The fit embeds the exact source inputs and cell basis;
changing either invalidates it. No state is removed or source bound reduced.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from scipy.optimize import linprog
from NativeSparseStateInput import NativeSparseStateInput
from decode_native_sparse_state import decode_native_sparse_state
from read_native_array import read_native_array
from read_native_points import read_native_points
from read_native_polygons import read_native_polygons
from native_safe_integer import native_safe_integer

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourceInputObservation import SourceInputObservation


def _main():
    parser = argparse.ArgumentParser()
    for name in ("sample", "sockets", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    observed = SourceInputObservation([args.sample / "manifest.json", args.sockets, Path(__file__)])
    manifest = json.loads((args.sample / "manifest.json").read_text(encoding="utf-8"))
    sockets = json.loads(args.sockets.read_text(encoding="utf-8"))
    input_names = ("neutral.f64", "rows.i32", "rows.f64", "landmarks.f64",
                   "loop-start.i32", "loop-total.i32", "loop-vertex.i32")
    observed.extend([args.sample / name for name in input_names])
    for name in input_names:
        expected = manifest["files"][name]
        observed.expect(args.sample / name, expected["bytes"], expected["sha256"])
    neutral = read_native_points(args.sample / "neutral.f64")
    polygons = read_native_polygons(args.sample, len(neutral)).polygons
    normals = {port["side"]: [] for port in sockets["ports"]}
    row_ids = read_native_array(args.sample / "rows.i32", "<i4")
    row_deltas = read_native_array(args.sample / "rows.f64", "<f8").reshape((-1, 3))
    landmark_deltas = read_native_array(args.sample / "landmarks.f64", "<f8").reshape((-1, 3))
    states = [None, *manifest["states"]]
    for ordinal, state in enumerate(states):
        positions = neutral.copy()
        if state is not None:
            ids, delta, _ = decode_native_sparse_state(NativeSparseStateInput(state["name"], len(neutral),
                row_ids, row_deltas, state["rowOffset"], state["rowCount"], landmark_deltas,
                state["landmarkOffset"], len(manifest["landmarkIds"])))
            positions[ids] += delta
        for port in sockets["ports"]:
            selected = [native_safe_integer(index) for index in port["nativePolygonOrdinals"]]
            if not selected or len(set(selected)) != len(selected) or any(index >= len(polygons) for index in selected):
                raise ValueError("Source normal fit requires distinct existing native cap cells.")
            source_cells = [polygons[index] for index in selected]
            if any(len(cell) != 4 for cell in source_cells):
                raise ValueError("Source normal fit requires its original quad cap incidence.")
            cells = positions[np.asarray(source_cells)]
            triangles = np.concatenate((cells[:, [0, 1, 2]], cells[:, [0, 2, 3]]))
            normal = np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])
            lengths = np.linalg.norm(normal, axis=1)
            if not np.isfinite(normal).all() or not np.isfinite(lengths).all() or np.any(lengths == 0):
                raise ValueError("Actual native source cap has a degenerate facet at state " + str(ordinal) + ".")
            normals[port["side"]].append(normal / lengths[:, None])
        if ordinal % 100 == 0:
            print("[nasal-source-axis] actual state", ordinal, flush=True)
    fitted = []
    for side, contributions in normals.items():
        directions = np.concatenate(contributions)
        # The box bounds select a deterministic source-frame representative.
        # Positive t is the actual halfspace certificate, not a softened
        # crossing threshold. Normalization afterward preserves its sign.
        result = linprog([0, 0, 0, -1], A_ub=np.column_stack((-directions, np.ones(len(directions)))),
                         b_ub=np.zeros(len(directions)), bounds=[(-1, 1)] * 3 + [(None, None)], method="highs")
        if not result.success or not np.isfinite(result.x).all() or result.x[3] <= 0:
            raise ValueError("Full native source family has no positive cap-normal halfspace: " + side + ".")
        axis = result.x[:3] / np.linalg.norm(result.x[:3])
        minimum = float((directions @ axis).min())
        if not np.isfinite(minimum) or minimum <= 0:
            raise ValueError("Normalized source cap axis lost its positive normal certificate.")
        fitted.append({"side": side, "outwardAxisBlender": axis.tolist(), "minimumNativeNormalDot": minimum,
                       "nativeFacetConstraints": len(directions)})
    receipt = {"schema": "automovie-nasal-source-normal-axis/1", "sourceBasis": sockets["basis"],
               "frame": "Blender metres; +X left, +Z up, -Y anterior", "states": len(states),
               "sampleInputs": {name: manifest["files"][name] for name in input_names},
               "socketSha256": hashlib.sha256(args.sockets.read_bytes()).hexdigest(), "axes": fitted,
               "qualification": "source-family normal-cone fit; neither clinical nasal axis nor airway acquisition",
               "pending": ["translated3D cap/wall selfintersection", "host/paired-clearance", "full provider replay", "sameperson SDK/F32/GPU"]}
    args.out.parent.mkdir(parents=True, exist_ok=True)
    observed.verify()
    with args.out.open("x", encoding="utf-8", newline="\n") as output:
        output.write(json.dumps(receipt, indent=2, allow_nan=False) + "\n")
    print("[nasal-source-axis] fitted", len(states), "actual native states", fitted, flush=True)


if __name__ == "__main__":
    _main()
