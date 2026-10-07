"""Compile the paired dimensional head endpoints of the owned head provider.

This is offline source production, not a test or a runtime person evaluator:

    python test/scripts/human-source/compile-head-trait-endpoints.py \
      --sample <work>/sample \
      --authoring test/scripts/human-source/head-authoring \
      --provider <provider> \
      --out <traits>

The provider formula and the complete neutral recipe come from the one
authoring directory that `replay-head-source-provider.py` replays, verified
against its `source-inputs.json`, so a sampled state and a dimensional
endpoint are differences of the same function. The provider directory is the
one the generation compiler reads; this run must reproduce its neutral and
joint bytes before any endpoint is written.

Each named dimension of the recipe is moved by one unit around that neutral
and the complete provider is evaluated. One millimetre or one degree is an
explicit prototype sampling interval, not a clinical bound. Single-axis
samples validate no interpolation, combination, contact, attachment or
rendered appearance.

The packet holds content only: digests, counts and the recipe values that
produced each endpoint. This host's interpreter and library versions go to a
separate `run-environment.json`, so the same endpoints carry the same packet
on any machine. No source input is changed.
"""

import argparse
import copy
import hashlib
import importlib
import json
import os
from pathlib import Path
import platform
import sys

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
import numpy as np
from SourcePublication import SourcePublication
from read_source_publication import read_source_publication
sys.path.insert(0, str(Path(__file__).resolve().parent / "head-authoring"))
from SourceAuthoringInputObservation import SourceAuthoringInputObservation
from source_module_directory import source_module_directory

PACKET = "head-trait-endpoints.json"
RUN_RECORD = "run-environment.json"
FIELD_COUNT = 54


def digest(path):
    """SHA-256 of actual file bytes, without execution path or timestamp."""
    with path.open("rb") as stream:
        result = hashlib.sha256()
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def facet_normals(positions, polygons):
    """Both fan triangles' area normals of every quadrilateral provider cell."""
    cells = positions[np.asarray(polygons)]
    triangles = np.concatenate((cells[:, [0, 1, 2]], cells[:, [0, 2, 3]]))
    return np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])


def named_dimensions(recipe):
    """Every independent dimension as (identity, recipe path, key, unit)."""
    groups = [(group, ("head", group)) for group in ("cranial", "facial", "cervical")]
    groups += [("ears." + side, ("ears", side)) for side in ("left", "right")]
    groups.append(("nasalExterior", ("nasalExterior",)))
    result = []
    for group, path in groups:
        node = recipe
        for entry in path:
            node = node[entry]
        for key in node:
            suffix = "OffsetDegrees" if key.endswith("OffsetDegrees") else "OffsetMillimetres"
            if not key.endswith(suffix):
                raise ValueError("A provider recipe entry lacks its exact dimensional unit: " + key)
            result.append((group + "." + key[:-len(suffix)], path, key, "degree" if suffix == "OffsetDegrees" else "mm"))
    return result


def compile_endpoints(sample_path, authoring_path, provider_path, output):
    if output.exists() and any(output.iterdir()):
        raise ValueError("Head trait endpoints need a new or empty output directory.")
    observed = SourceAuthoringInputObservation(sample_path, authoring_path, [Path(__file__),
        provider_path / "neutral-provider.f64", provider_path / "joints-provider.f64", provider_path / "head-provider-packet.json",
        provider_path / "source-publication.json"])
    provider_inputs = read_source_publication(provider_path,
        ["neutral-provider.f64", "joints-provider.f64", "head-provider-packet.json"])
    manifest, authoring = observed.sampled, observed.authored
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(source_module_directory(authoring_path, authoring, "HeadSourceProvider")))
    provider = importlib.import_module("HeadSourceProvider").HeadSourceProvider(sample_path, authoring_path)
    read_points = importlib.import_module("read_native_points").read_native_points
    recipe = {name: json.loads((authoring_path / entry["path"]).read_text(encoding="utf-8"))
              for name, entry in authoring["recipe"].items()}
    native = read_points(sample_path / "neutral.f64")
    joints = read_points(sample_path / "landmarks-neutral.f64")
    baseline = provider.evaluate(native, recipe, joints)
    neutral_bytes = np.asarray(baseline.positions, dtype="<f8").tobytes()
    joint_bytes = np.asarray(baseline.joints, dtype="<f8").tobytes()
    neutral_sha = hashlib.sha256(neutral_bytes).hexdigest()
    joints_sha = hashlib.sha256(joint_bytes).hexdigest()
    if neutral_sha != hashlib.sha256(provider_inputs["neutral-provider.f64"]).hexdigest() or \
            joints_sha != hashlib.sha256(provider_inputs["joints-provider.f64"]).hexdigest():
        raise ValueError("The authoring directory does not reproduce this provider's neutral and joint bytes.")
    baseline_normals = facet_normals(baseline.positions, baseline.polygons)
    dimensions = named_dimensions(recipe)
    if len(dimensions) != FIELD_COUNT:
        raise ValueError(f"The complete anatomical recipe must carry its {FIELD_COUNT} independent dimensional fields.")
    with SourcePublication(output) as publication:
        records, refusals = [], []
        for identity, path, key, unit in dimensions:
            target = recipe
            for entry in path:
                target = target[entry]
            record = {"id": identity, "unit": unit, "recipePath": list(path) + [key],
                      "neutralRecipeValue": target[key], "samplingDifference": 1,
                      "supportQualification": "authored +/-1 dimensional unit samples; no clinical range, interpolation, combination, person-contact or rendered qualification",
                      "endpoints": []}
            for sign, name in ((1, "positive"), (-1, "negative")):
                requested = copy.deepcopy(recipe)
                node = requested
                for entry in path:
                    node = node[entry]
                node[key] = target[key] + sign
                try:
                    result = provider.evaluate(native, requested, joints)
                    if result.polygons != baseline.polygons or result.positions.shape != baseline.positions.shape:
                        raise ValueError("A dimensional endpoint changed the fixed provider correspondence or cell population.")
                    normals = facet_normals(result.positions, result.polygons)
                    lengths = np.linalg.norm(normals, axis=1)
                    if not np.isfinite(result.positions).all() or not np.isfinite(result.joints).all() or np.any(lengths == 0):
                        raise ValueError("An actual dimensional endpoint has nonfinite coordinates or degenerate emitted cells.")
                    cosines = np.sum(normals * baseline_normals, axis=1) / (lengths * np.linalg.norm(baseline_normals, axis=1))
                    if not np.isfinite(cosines).all() or np.any(cosines <= 0):
                        raise ValueError("An actual dimensional endpoint reverses an emitted cell against the same neutral source facet.")
                    changed = np.flatnonzero(np.any(result.positions != baseline.positions, axis=1))
                    if len(changed) == 0:
                        raise ValueError("This named source trait has no actual positional effect in the authored neutral.")
                    positions_path = output / (identity + "." + name + ".f64")
                    joints_path = output / (identity + "." + name + ".joints.f64")
                    np.asarray(result.positions, dtype="<f8").tofile(positions_path)
                    np.asarray(result.joints, dtype="<f8").tofile(joints_path)
                    record["endpoints"].append({
                        "direction": name, "difference": sign, "requestedRecipeValue": node[key],
                        "positions": positions_path.name, "positionsSha256": digest(positions_path),
                        "joints": joints_path.name, "jointsSha256": digest(joints_path),
                        "changedVertices": len(changed), "changedNativeVertices": int((changed < len(native)).sum()),
                        "changedJointWitnesses": int(np.any(result.joints != baseline.joints, axis=1).sum()),
                        "maximumPointDisplacementMillimetres": float(np.linalg.norm(result.positions - baseline.positions, axis=1).max() * 1000),
                        "minimumNeutralFacetCosine": float(cosines.min()),
                    })
                    print("[head-trait-endpoints]", identity, name, len(changed), flush=True)
                except ValueError as error:
                    refusals.append({"id": identity, "direction": name, "request": node[key], "cause": str(error)})
                    print("[head-trait-endpoints-refusal]", identity, name, str(error), flush=True)
            records.append(record)
        packet = {
            "schema": "automovie-authored-head-dimensional-endpoints/2",
            "authoringInputsSha256": digest(authoring_path / "source-inputs.json"),
            "sampleInputs": {name: expected["sha256"] for name, expected in manifest["files"].items()},
            "providerNeutralSha256": neutral_sha,
            "providerJointsSha256": joints_sha,
            "providerPacketSha256": hashlib.sha256(provider_inputs["head-provider-packet.json"]).hexdigest(),
            "providerVertices": len(baseline.positions),
            "polygons": len(baseline.polygons),
            "frame": authoring["frame"],
            "fields": records,
            "refusals": refusals,
            "qualification": "Authored single-axis source samples; no interpolation, combination, contact, static export or rendered acceptance.",
        }
        observed.verify()
        (output / PACKET).write_text(json.dumps(packet, indent=1, allow_nan=False) + "\n", encoding="utf-8", newline="\n")
        runtime = {"executable": sys.executable, "python": sys.version, "platform": platform.platform(), "numpy": np.__version__}
        (output / RUN_RECORD).write_text(json.dumps(runtime, indent=1) + "\n", encoding="utf-8", newline="\n")
        if refusals:
            raise ValueError(f"Actual dimensional endpoints refused {len(refusals)} of {2 * len(records)} samples; partial assets are not a complete generation input.")
        print("[head-trait-endpoints]", "fields", len(records), "endpoints", 2 * len(records), flush=True)

        publication.complete(digest(output / PACKET), observed.verify)


def main():
    parser = argparse.ArgumentParser()
    for name in ("sample", "authoring", "provider", "out"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    compile_endpoints(args.sample, args.authoring, args.provider, args.out)


if __name__ == "__main__":
    main()
