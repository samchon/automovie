"""Publish native ear guides from historical selections and original cell pins.

The head guide component owns region correspondence and original attachment
records. This normal exporter applies the shared replacement-port reader to
the exact pinned native topology. Sparse supports and frame-read attachment
ambiguity remain authored conventions, not acquired clinical boundaries.
Run with --sample DIRECTORY --guides COMPONENT_DIRECTORY --out NEW_DIRECTORY.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

from read_native_points import read_native_points
from read_native_polygons import read_native_polygons
from read_ear_port import read_ear_port

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourceInputObservation import SourceInputObservation
from SourcePublication import SourcePublication
from read_source_publication import read_source_publication


def _main():
    parser = argparse.ArgumentParser()
    for name in ("sample", "guides", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    if args.out.exists() and any(args.out.iterdir()):
        raise ValueError("Ear guide export requires a new immutable component output directory.")
    with SourcePublication(args.out) as publication:
        _export(args, publication)


def _export(args, publication):
    names = ["ear-source-region-guide.json", "ear-source-registration.json"]
    root = Path(__file__).resolve().parent
    observed = SourceInputObservation([args.sample / "manifest.json",
        args.guides / "source-publication.json", Path(__file__),
        root / "read_ear_port.py", root / "native_patch_boundary.py",
        root / "read_native_points.py", root / "read_native_polygons.py",
        root / "read_native_array.py", root / "native_safe_integer.py", root / "NativePolygonTable.py",
        root.parent / "SourceInputObservation.py", root.parent / "SourcePublication.py",
        root.parent / "read_source_publication.py"])
    captured = read_source_publication(args.guides, names)
    observed.extend([args.guides / name for name in captured])
    for name, payload in captured.items():
        observed.expect(args.guides / name, len(payload), hashlib.sha256(payload).hexdigest())
    regions = json.loads(captured[names[0]])
    registration = json.loads(captured[names[1]])
    if regions["generation"] != registration["generation"]:
        raise ValueError("Ear guide regions and attachment receipt have different generations.")
    sample = json.loads((args.sample / "manifest.json").read_text(encoding="utf-8"))
    observed.extend([args.sample / name for name in sample["files"]])
    for name, expected in sample["files"].items():
        observed.expect(args.sample / name, expected["bytes"], expected["sha256"])
    for name in ("neutral.f64", "loop-start.i32", "loop-total.i32", "loop-vertex.i32"):
        observed.expect_digest(args.sample / name, registration["sample"][name])
    vertices = len(read_native_points(args.sample / "neutral.f64"))
    if vertices != regions["originalNativeCount"]:
        raise ValueError("Ear guide native population differs from its historical correspondence.")
    polygons = read_native_polygons(args.sample, vertices).polygons
    ports = []
    for attachment in registration["headRegions"]:
        region = next(region for region in regions["regions"] if region["name"] == attachment["name"])
        ports.append(read_ear_port(attachment["name"], region["nativeSamples"], attachment["loop"], polygons))
    result = {"schema": "automovie-authored-ear-source-guide/1", "generation": regions["generation"],
              "frame": "Blender metres; +X left, +Z up, -Y anterior",
              "originalNativeCount": vertices, "regions": regions["regions"], "replacementPorts": ports,
              "sourceWitness": {"headSourceRevision": regions["sourceRevision"],
                                "headSourceLogicalPath": regions["sourceLogicalPath"],
                                "headSourceBlobSha256": regions["sourceBlobSha256"],
                                "attachmentReceipt": registration,
                                "qualification": "Sparse supports and attachment loops retain authored uncertainty; no clinical boundary or floor is acquired."}}
    receipt = args.out / "ear-source-guide.json"
    receipt.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    publication.complete(hashlib.sha256(receipt.read_bytes()).hexdigest(), observed.verify)
    print("[ear-guide]", len(ports), "native replacement ports", flush=True)


if __name__ == "__main__":
    _main()
