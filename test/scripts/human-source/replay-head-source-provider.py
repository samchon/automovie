"""Replay the owned head provider over every actual sampled source state.

This is offline source production, not a test or a runtime person evaluator.
The source formula is imported once from the canonical authoring directory.
One process streams sparse endpoint differences and exact joint witnesses;
no state spawns Blender/Python, and no clinical mean or expected result is used.
Original sample bytes and authored topology/UV receipts remain separate inputs.
"""

import argparse
import hashlib
import importlib
import platform
import json
from pathlib import Path
import sys

import numpy as np
from SourcePublication import SourcePublication
sys.path.insert(0, str(Path(__file__).resolve().parent / "head-authoring"))
from SourceAuthoringInputObservation import SourceAuthoringInputObservation
from source_module_directory import source_module_directory


RUN_RECORD = "run-environment.json"


def digest(path):
    """SHA-256 of actual file bytes, without execution path or timestamp."""
    with path.open("rb") as stream:
        result = hashlib.sha256()
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def replay(sample_path, authoring_path, output):
    """Stream the real manifest's complete state population through one owner."""
    if output.exists() and any(output.iterdir()):
        raise ValueError("Head source replay needs a new or empty authoring output directory.")
    observed = SourceAuthoringInputObservation(sample_path, authoring_path, [Path(__file__)])
    manifest, authoring = observed.sampled, observed.authored
    sys.dont_write_bytecode = True
    module_directory = source_module_directory(authoring_path, authoring, "HeadSourceProvider")
    sys.path.insert(0, str(module_directory))
    provider_type = importlib.import_module("HeadSourceProvider").HeadSourceProvider
    sparse_input = importlib.import_module("NativeSparseStateInput").NativeSparseStateInput
    decode_sparse = importlib.import_module("decode_native_sparse_state").decode_native_sparse_state
    read_array = importlib.import_module("read_native_array").read_native_array
    read_points = importlib.import_module("read_native_points").read_native_points
    provider = provider_type(sample_path, authoring_path)
    recipe = {name: json.loads((authoring_path / entry["path"]).read_text(encoding="utf-8"))
              for name, entry in authoring["recipe"].items()}
    original = read_points(sample_path / "neutral.f64")
    original_joints = read_points(sample_path / "landmarks-neutral.f64")
    neutral = provider.evaluate(original, recipe, original_joints)
    runtime = {
        "executable": sys.executable,
        "executableSha256": digest(Path(sys.executable)),
        "python": sys.version,
        "platform": platform.platform(),
        "numpy": np.__version__,
        "importedProviderCode": {
            name: {"path": str(Path(module.__file__).resolve()), "sha256": digest(Path(module.__file__))}
            for name, module in sorted(sys.modules.items())
            if getattr(module, "__file__", None) is not None
            and Path(module.__file__).resolve().is_relative_to(module_directory)
        },
        "importedNumericalCode": {
            name: {"path": str(Path(module.__file__).resolve()), "sha256": digest(Path(module.__file__))}
            for name, module in sorted(sys.modules.items())
            if (name == "numpy" or name.startswith("numpy.") or name == "scipy" or name.startswith("scipy."))
            and getattr(module, "__file__", None) is not None
            and Path(module.__file__).is_file()
        },
        "qualification": "Actual interpreter/imported-module identity for this run; linked numerical DLL closure and offline fit reproduction remain final producer responsibilities.",
    }
    positions = np.asarray(neutral.positions, dtype="<f8")
    joints = np.asarray(neutral.joints, dtype="<f8")
    if not np.isfinite(positions).all() or not np.isfinite(joints).all():
        raise ValueError("Head source neutral contains nonfinite geometry.")
    if len(positions) > np.iinfo(np.int32).max + 1:
        raise ValueError("Head source native row identities exceed their signed int32 representation.")
    with SourcePublication(output) as publication:
        (output / RUN_RECORD).write_text(json.dumps(runtime, indent=1) + "\n", encoding="utf-8")
        positions.tofile(output / "neutral.f64")
        joints.tofile(output / "landmarks-neutral.f64")
        (output / "polygons.json").write_text(json.dumps(neutral.polygons) + "\n", encoding="utf-8")
        row_ids = read_array(sample_path / "rows.i32", "<i4")
        row_deltas = read_array(sample_path / "rows.f64", "<f8").reshape((-1, 3))
        joint_deltas = read_array(sample_path / "landmarks.f64", "<f8").reshape((-1, 3))
        states = []
        refusals = []
        row_offset = 0
        joint_offset = 0
        with (output / "rows.i32").open("wb") as ids_out, \
                (output / "rows.f64").open("wb") as deltas_out, \
                (output / "landmarks.f64").open("wb") as joints_out:
            for ordinal, state in enumerate(manifest["states"], start=1):
                ids, delta, joint_delta = decode_sparse(sparse_input(state["name"], len(original), row_ids, row_deltas,
                    state["rowOffset"], state["rowCount"], joint_deltas, state["landmarkOffset"], len(original_joints)))
                current = original.copy()
                current[ids] += delta
                current_joints = original_joints + joint_delta
                try:
                    evaluated = provider.evaluate(current, recipe, current_joints)
                    current_positions = np.asarray(evaluated.positions, dtype="<f8")
                    current_joints = np.asarray(evaluated.joints, dtype="<f8")
                    if current_positions.shape != positions.shape or current_joints.shape != joints.shape:
                        raise ValueError("Head source replay changed its declared population.")
                    if evaluated.polygons != neutral.polygons:
                        raise ValueError("Head source replay changed its frozen cell incidence.")
                    if not np.isfinite(current_positions).all() or not np.isfinite(current_joints).all():
                        raise ValueError("Head source state contains nonfinite geometry.")
                    delta = current_positions - positions
                    joint_difference = current_joints - joints
                    if not np.isfinite(delta).all() or not np.isfinite(joint_difference).all():
                        raise ValueError("Head source sparse differences are not representable finite coordinates.")
                except ValueError as error:
                    refusals.append({"ordinal": ordinal, "name": state["name"], "reason": str(error)})
                    print("[head-source-replay-refusal]", ordinal, state["name"], str(error), flush=True)
                    continue
                active = np.flatnonzero(np.any(delta != 0, axis=1)).astype("<i4")
                active.tofile(ids_out)
                delta[active].astype("<f8", copy=False).tofile(deltas_out)
                joint_difference.astype("<f8", copy=False).tofile(joints_out)
                states.append({**state, "rowOffset": row_offset, "rowCount": len(active), "landmarkOffset": joint_offset})
                row_offset += len(active)
                joint_offset += len(joints)
                print("[head-source-replay]", ordinal, state["name"], len(active), flush=True)
        # The run record names this host's interpreter and module locations. It
        # stays beside the replay as provenance and never enters the content files,
        # so the same replay bytes carry the same manifest on any host.
        files = {
            path.name: {"bytes": path.stat().st_size, "sha256": digest(path)}
            for path in sorted(output.iterdir()) if path.is_file() and path.name not in (RUN_RECORD, "source-publication.json", "source-publication.json.next")
        }
        receipt = {
            "schema": "automovie-authored-head-source-replay/2",
            "originalNativeVertices": len(original),
            "vertices": len(positions),
            "landmarkIds": manifest["landmarkIds"],
            "states": states,
            "sourceStateCount": len(manifest["states"]),
            "complete": len(states) == len(manifest["states"]) and len(refusals) == 0,
            "refusals": refusals,
            "files": files,
            "sampleInputs": {name: expected["sha256"] for name, expected in manifest["files"].items()},
            "recipe": recipe,
            "authoringInputsSha256": digest(authoring_path / "source-inputs.json"),
            "qualification": "Authored source replay; no biological fit, finite combination, pose, static export or rendered acceptance.",
        }
        observed.verify()
        (output / "replay-manifest.json").write_text(json.dumps(receipt, indent=1, allow_nan=False) + "\n", encoding="utf-8")
        if refusals:
            raise ValueError(f"Actual source replay refused {len(refusals)} of {len(manifest['states'])} states; partial assets are not a complete generation input.")

        publication.complete(digest(output / "replay-manifest.json"), observed.verify)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=Path, required=True)
    parser.add_argument("--authoring", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    replay(args.sample, args.authoring, args.out)


if __name__ == "__main__":
    main()
