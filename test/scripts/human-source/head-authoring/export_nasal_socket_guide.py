"""Publish a frozen authored native cell selection through its actual incidence.

The maintained recipe explicitly retains the old cut's native cells. It does
not recover the historical selection predicate or establish clinical anatomy.
The shared native boundary reader derives each oriented rim; actual original
cap cells are retained. The preserved raw cut supplies correspondence evidence
before publication, never a fabricated expected geometry or a cap replacement.
Run with --sample DIRECTORY --guides HEAD_COMPONENT --out NEW_DIRECTORY.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

from native_patch_boundary import native_patch_boundary
from native_safe_integer import native_safe_integer
from read_native_points import read_native_points
from read_native_polygons import read_native_polygons

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourceInputObservation import SourceInputObservation
from SourcePublication import SourcePublication
from read_source_publication import read_source_publication


def _main():
    parser = argparse.ArgumentParser()
    for name in ("sample", "guides", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--recipe", type=Path, default=Path(__file__).parent / "nasal-socket-selection-recipe.json")
    parser.add_argument("--reference", type=Path, default=Path(__file__).parent / "nasal-socket-ports.json")
    args = parser.parse_args()
    if args.out.exists() and any(args.out.iterdir()):
        raise ValueError("Socket export requires a new immutable component output directory.")
    with SourcePublication(args.out) as publication:
        _export(args, publication)


def _export(args, publication):
    root = Path(__file__).resolve().parent
    observed = SourceInputObservation([args.recipe, args.reference, args.sample / "manifest.json",
        args.guides / "source-publication.json", Path(__file__), root / "native_patch_boundary.py",
        root / "native_safe_integer.py", root / "read_native_points.py", root / "read_native_polygons.py",
        root / "read_native_array.py", root / "NativePolygonTable.py", root.parent / "SourceInputObservation.py",
        root.parent / "SourcePublication.py", root.parent / "read_source_publication.py"])
    captured = read_source_publication(args.guides, ["ear-source-registration.json"])
    observed.extend([args.guides / name for name in captured])
    for name, payload in captured.items():
        observed.expect(args.guides / name, len(payload), hashlib.sha256(payload).hexdigest())
    registration = json.loads(captured["ear-source-registration.json"])
    recipe = json.loads(args.recipe.read_text(encoding="utf-8"))
    if recipe["schema"] != "automovie-authored-nasal-socket-selection/1" or not recipe["qualification"].strip():
        raise ValueError("Socket selection requires its explicit authored recipe and qualification.")
    observed.expect_digest(args.reference, recipe["sourceSha256"])
    reference = json.loads(args.reference.read_text(encoding="utf-8"))
    if recipe["sourceBasis"] != reference["basis"]:
        raise ValueError("Socket recipe and preserved cut have different authoring bases.")
    sample = json.loads((args.sample / "manifest.json").read_text(encoding="utf-8"))
    observed.extend([args.sample / name for name in sample["files"]])
    for name, expected in sample["files"].items():
        observed.expect(args.sample / name, expected["bytes"], expected["sha256"])
    for name in ("neutral.f64", "loop-start.i32", "loop-total.i32", "loop-vertex.i32"):
        observed.expect_digest(args.sample / name, registration["sample"][name])
    polygons = read_native_polygons(args.sample, len(read_native_points(args.sample / "neutral.f64"))).polygons
    ports = []
    if [port["side"] for port in recipe["ports"]] != [port["side"] for port in reference["ports"]]:
        raise ValueError("Socket recipe changed the preserved sided owner population.")
    for selected, original in zip(recipe["ports"], reference["ports"]):
        cells = [native_safe_integer(index) for index in selected["nativePolygonOrdinals"]]
        if cells != original["nativePolygonOrdinals"]:
            raise ValueError("Socket selection differs from its frozen native cell order.")
        boundary = native_patch_boundary("nasal-socket-" + selected["side"], cells, polygons)
        if boundary != original["orderedNativeBoundary"]:
            raise ValueError("Socket native incidence differs from its preserved oriented rim.")
        ports.append({"side": selected["side"], "nativePolygonOrdinals": cells,
                      "orderedNativeBoundary": boundary, "nativeCapCells": [polygons[index] for index in cells]})
    result = {"schema": "automovie-authored-nasal-socket/1", "basis": reference["basis"],
              "nativeGeneration": registration["generation"], "ports": ports,
              "recipeSha256": hashlib.sha256(args.recipe.read_bytes()).hexdigest(),
              "preservedCutSha256": recipe["sourceSha256"], "qualification": recipe["qualification"]}
    receipt = args.out / "nasal-socket-ports.json"
    receipt.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    publication.complete(hashlib.sha256(receipt.read_bytes()).hexdigest(), observed.verify)
    print("[nasal-socket]", len(ports), "exact native cell and boundary correspondences", flush=True)


if __name__ == "__main__":
    _main()
