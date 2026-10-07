"""Write paired source sections through their single shared evaluator.

Each immutable component output binds pinned sample, recipe and source bytes.
Failed raw outputs retain refused publication authority; a completed component
does not claim a completed human generation or accepted anatomy.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
from evaluate_ear_sections import evaluate_ear_sections
from read_native_points import read_native_points
from read_native_polygons import read_native_polygons
from SourceAuthoringInputObservation import SourceAuthoringInputObservation

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourcePublication import SourcePublication


def _main():
    parser = argparse.ArgumentParser()
    for name in ("sample", "neutral", "ports", "recipe", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--source", type=Path, default=Path(__file__).parent)
    args = parser.parse_args()
    if args.out.exists() and any(args.out.iterdir()):
        raise ValueError("Ear authoring requires a new immutable component output directory.")
    with SourcePublication(args.out) as publication:
        _author(args, publication)


def _author(args, publication):
    observed = SourceAuthoringInputObservation(args.sample, args.source,
                                               [Path(__file__), args.neutral, args.ports, args.recipe])
    authority = json.loads(args.ports.read_text(encoding="utf-8"))
    recipe = json.loads(args.recipe.read_text(encoding="utf-8"))
    positions = read_native_points(args.neutral)
    polygons = read_native_polygons(args.sample, len(positions)).polygons
    shaped, records = evaluate_ear_sections(positions, polygons, authority, recipe)
    args.out.mkdir(parents=True, exist_ok=True)
    path = args.out / "native-ear-sections.f64"
    shaped.astype("<f8").tofile(path)
    record = {"schema": "automovie-authored-ear-sections/1", "basis": authority["generation"], "frame": authority["frame"],
              "sourceIncomingSha256": hashlib.sha256(args.neutral.read_bytes()).hexdigest(), "positionsSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
              "parts": records, "affectedNativeVertices": int(np.any(shaped != positions, axis=1).sum()),
              "pending": ["source C1/clearance admission", "all common-root derivatives", "actual sameperson/editor/F32/hardwareGPU"]}
    receipt = args.out / "ear-provenance.json"
    receipt.write_text(json.dumps(record, indent=2, allow_nan=False), encoding="utf-8")
    publication.complete(hashlib.sha256(receipt.read_bytes()).hexdigest(), observed.verify)
    print("[ear-sections]", record["affectedNativeVertices"], "native source points", flush=True)


if __name__ == "__main__":
    _main()
