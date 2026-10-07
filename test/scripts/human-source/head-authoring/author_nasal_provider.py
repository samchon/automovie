"""Write frozen shared nasal sections through their canonical owner formula.

Each immutable component output binds pinned sample, recipe and source bytes.
Failed raw outputs retain refused publication authority; a completed component
does not claim a completed human generation or accepted anatomy.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
from evaluate_nasal_provider import evaluate_nasal_provider
from read_native_points import read_native_points
from read_native_polygons import read_native_polygons
from SourceAuthoringInputObservation import SourceAuthoringInputObservation
from read_source_profile import read_source_profile

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourcePublication import SourcePublication


def _main():
    parser = argparse.ArgumentParser()
    for name in ("sample", "ports", "recipe", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--neutral", type=Path)
    parser.add_argument("--sockets", type=Path)
    parser.add_argument("--source", type=Path, default=Path(__file__).parent)
    args = parser.parse_args()
    if args.out.exists() and any(args.out.iterdir()):
        raise ValueError("Nasal authoring requires a new immutable component output directory.")
    with SourcePublication(args.out) as publication:
        _author(args, publication)


def _author(args, publication):
    source = args.neutral if args.neutral is not None else args.sample / "neutral.f64"
    observed = SourceAuthoringInputObservation(args.sample, args.source,
                                               [Path(__file__), source, args.ports, args.recipe,
                                                *([] if args.sockets is None else [args.sockets])])
    socket_path = args.sockets if args.sockets is not None else args.source / observed.authored["profiles"]["nasalSocket"]["path"]
    authority = json.loads(args.ports.read_text(encoding="utf-8"))
    recipe = json.loads(args.recipe.read_text(encoding="utf-8"))
    sockets = json.loads(socket_path.read_text(encoding="utf-8")) if args.sockets is not None else read_source_profile(args.source, observed.authored, "nasalSocket")
    native = read_native_points(source)
    polygons = read_native_polygons(args.sample, len(native)).polygons
    axes = read_source_profile(args.source, observed.authored, "nasalAxis")
    points, cells, records = evaluate_nasal_provider(native, polygons, authority, sockets, recipe, axes)
    args.out.mkdir(parents=True, exist_ok=True)
    path = args.out / "neutral-provider.f64"
    points.astype("<f8").tofile(path)
    (args.out / "polygons.json").write_text(json.dumps(cells, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    record = {"schema": "automovie-authored-head-provider/1", "stage": "shared nasal section source component", "generationBasis": authority["generation"],
              "frame": authority["frame"], "nativeVertices": len(native), "vertices": len(points), "polygons": len(cells),
              "positionsSha256": hashlib.sha256(path.read_bytes()).hexdigest(), "recipeSha256": hashlib.sha256(args.recipe.read_bytes()).hexdigest(),
              "nasalSections": records, "incomingNeutralSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
              "socketAuthority": {"path": str(socket_path), "sha256": hashlib.sha256(socket_path.read_bytes()).hexdigest()},
              "nativeCorrespondence": "original53514 IDs retained; new rings replay their fixed source rim",
              "invalidatedDescendants": ["source tree", "cut intersections", "head/body partitions", "endpoint rows", "normal/UV/material regions", "landmarks", "hair/contact derivatives"],
              "pending": ["C1/clearance", "all upstream common-root derivatives", "actual sameperson/editor/staticF32/hardwareGPU"]}
    receipt = args.out / "provider-provenance.json"
    receipt.write_text(json.dumps(record, indent=2, allow_nan=False), encoding="utf-8")
    publication.complete(hashlib.sha256(receipt.read_bytes()).hexdigest(), observed.verify)
    print("[head-provider]", len(points), "vertices", len(cells), "mixed cells", flush=True)


if __name__ == "__main__":
    _main()
