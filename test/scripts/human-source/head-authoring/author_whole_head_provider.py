"""Write one actual whole provider through the same endpoint-replay formula.

The explicit source recipe identifies neutral or a variant; neither is chosen
from a person name or a clinical mean. This CLI and the publisher's in-memory
replay both consume HeadSourceProvider.evaluate. Geometry and joint witnesses
belong to one current native state. No additional geometry formula lives here.
The receipt binds the exact recipe bytes consumed by that evaluation; later
packet compilation must retain those identities even for external recipes.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np

from HeadSourceProvider import HeadSourceProvider
from read_native_points import read_native_points
from SourceAuthoringInputObservation import SourceAuthoringInputObservation

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourcePublication import SourcePublication


def _main():
    parser = argparse.ArgumentParser()
    for name in ("sample", "source", "head-recipe", "ear-recipe", "nose-recipe", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--nasal-exterior-recipe", type=Path)
    args = parser.parse_args()
    if args.out.exists() and any(args.out.iterdir()):
        raise ValueError("Whole provider authoring requires a new immutable output directory.")
    with SourcePublication(args.out, "provider-evaluation-publication.json") as publication:
        _author(args, publication)


def _author(args, publication):
    recipes = [args.head_recipe, args.ear_recipe, args.nose_recipe]
    if args.nasal_exterior_recipe is not None:
        recipes.append(args.nasal_exterior_recipe)
    observed = SourceAuthoringInputObservation(args.sample, args.source, [Path(__file__), *recipes])
    provider = HeadSourceProvider(args.sample, args.source)
    recipe_paths = {"head": args.head_recipe, "ears": args.ear_recipe, "nose": args.nose_recipe}
    if args.nasal_exterior_recipe is not None:
        recipe_paths["nasalExterior"] = args.nasal_exterior_recipe
    recipe_payloads = {name: file.read_bytes() for name, file in recipe_paths.items()}
    recipe_inputs = {name: {"bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()}
                     for name, payload in recipe_payloads.items()}
    for name, file in recipe_paths.items():
        observed.expect(file, recipe_inputs[name]["bytes"], recipe_inputs[name]["sha256"])
    recipe = {name: json.loads(payload) for name, payload in recipe_payloads.items()}
    positions = read_native_points(args.sample / "neutral.f64")
    joints = read_native_points(args.sample / "landmarks-neutral.f64")
    result = provider.evaluate(positions, recipe, joints)
    if not np.isfinite(result.positions).all() or not np.isfinite(result.joints).all():
        raise ValueError("Whole source provider refuses nonfinite evaluated coordinates or joints.")
    args.out.mkdir(parents=True, exist_ok=True)
    path = args.out / "neutral-provider.f64"
    result.positions.astype("<f8").tofile(path)
    result.joints.astype("<f8").tofile(args.out / "joints-provider.f64")
    (args.out / "polygons.json").write_text(json.dumps(result.polygons, separators=(",", ":"), allow_nan=False), encoding="utf-8")
    record = {"schema": "automovie-authored-head-provider/1", "stage": "whole shared source authoring; product admission pending",
              "generationBasis": provider.authority["generation"], "frame": provider.authority["frame"],
              "nativeVertices": len(positions), "vertices": len(result.positions), "polygons": len(result.polygons),
              "positionsSha256": hashlib.sha256(path.read_bytes()).hexdigest(), "numericRecipe": recipe,
              "recipeAuthority": {name: str(file) for name, file in recipe_paths.items()},
              "recipeInputs": recipe_inputs,
              "envelope": result.envelope, "earSections": result.ears, "nasalSections": result.nasal,
              "invalidatedDescendants": ["source tree", "cut intersections", "head/body partitions", "endpoint rows",
                                         "normal/UV/material regions", "landmarks", "hair/contact derivatives"],
              "pending": ["C1/clearance/normal/UV/weight/material admission", "743state endpoint replay/common-root/P1",
                          "typed public authoring consequence", "actual person/motion/editor/save/F32/hardwareGPU"]}
    (args.out / "provider-provenance.json").write_text(json.dumps(record, indent=2, allow_nan=False), encoding="utf-8")
    print("[whole-head-provider]", len(result.positions), "vertices", len(result.polygons), "cells", len(result.joints), "joint witnesses", flush=True)
    publication.complete(hashlib.sha256((args.out / "provider-provenance.json").read_bytes()).hexdigest(), observed.verify)


if __name__ == "__main__":
    _main()
