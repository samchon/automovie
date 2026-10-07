"""Write one actual source envelope through the shared in-memory owner formula."""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
from HeadSourceProvider import HeadSourceProvider
from evaluate_head_envelope import evaluate_head_envelope
from read_native_points import read_native_points
from SourceAuthoringInputObservation import SourceAuthoringInputObservation

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourcePublication import SourcePublication


def _main():
    parser = argparse.ArgumentParser()
    for name in ("sample", "recipe", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--source", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args()
    if args.out.exists() and any(args.out.iterdir()):
        raise ValueError("Head envelope authoring needs a new immutable output directory.")
    with SourcePublication(args.out) as publication:
        _author(args, publication)


def _author(args, publication):
    observed = SourceAuthoringInputObservation(args.sample, args.source, [Path(__file__), args.recipe])
    provider = HeadSourceProvider(args.sample, args.source)
    positions = read_native_points(args.sample / "neutral.f64")
    joints = read_native_points(args.sample / "landmarks-neutral.f64")
    recipe = json.loads(args.recipe.read_text(encoding="utf-8"))
    shaped, shaped_joints, record = evaluate_head_envelope(positions, joints, provider.manifest, provider.guide, recipe, provider.neck_fields)
    args.out.mkdir(parents=True, exist_ok=True)
    path = args.out / "native-envelope.f64"
    shaped.astype("<f8").tofile(path)
    shaped_joints.astype("<f8").tofile(args.out / "landmarks-envelope.f64")
    record["positionsSha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    (args.out / "envelope-provenance.json").write_text(json.dumps(record, indent=2, allow_nan=False), encoding="utf-8")
    print("[head-envelope]", record["affectedNativeVertices"], "native skin and", record["affectedSourceJoints"], "joint references", flush=True)
    publication.complete(hashlib.sha256((args.out / "envelope-provenance.json").read_bytes()).hexdigest(), observed.verify)


if __name__ == "__main__":
    _main()
