"""Prepare the licensed neutral skin for the shared head-provider authoring.

This is the actual Blender source-preparation entry, not a measurement probe.
It retains native sample IDs, polygon winding and loop UVs from the pinned
MPFB sample. Blender positions are float32; the original float64 sample remains
the coordinate authority until an authored provider is explicitly exported.
No topology graft, guessed aperture or clinical boundary is produced here.
Head-view region IDs are translated only by exact sourcePartition.samples.
Non-native refined oral samples are reported and never nearest-point fitted.

Run Blender --background --python this_file -- --sample DIRECTORY
--candidate DIRECTORY --out DIRECTORY. The output is an editable .blend and
a provenance/port record for the upstream common-root provider, not a shipped
human generation or evidence of final viewer appearance.
"""

import argparse
import gzip
import hashlib
import json
import sys
from pathlib import Path

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from read_ear_port import read_ear_port
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourceInputObservation import SourceInputObservation


def digest(path):
    """Bind every source input to its actual bytes before constructing a scene."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path, observed):
    payload = path.read_bytes()
    observed.expect(path, len(payload), hashlib.sha256(payload).hexdigest())
    return json.loads(gzip.decompress(payload) if path.suffix == ".gz" else payload)


def prepare():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=Path, required=True)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    args.out.mkdir(parents=True, exist_ok=True)
    head_path = args.candidate / "head.json.gz"
    generation_path = args.candidate / "generation-manifest.json"
    observed = SourceInputObservation([args.sample / "manifest.json", head_path, generation_path,
        Path(__file__), Path(__file__).resolve().parent / "read_ear_port.py",
        Path(__file__).resolve().parent / "native_patch_boundary.py",
        Path(__file__).resolve().parent / "native_safe_integer.py",
        Path(__file__).resolve().parent.parent / "SourceInputObservation.py"])
    manifest = read_json(args.sample / "manifest.json", observed)
    arrays = {}
    authority = {}
    for name, dtype in (
        ("neutral.f64", "<f8"),
        ("loop-start.i32", "<i4"),
        ("loop-total.i32", "<i4"),
        ("loop-vertex.i32", "<i4"),
        ("loop-uv.f64", "<f8"),
    ):
        path = args.sample / name
        observed.extend([path])
        payload = path.read_bytes()
        actual = hashlib.sha256(payload).hexdigest()
        observed.expect(path, len(payload), actual)
        if actual != manifest["files"][name]["sha256"]:
            raise ValueError("Pinned sample byte mismatch: " + name)
        authority[name] = actual
        arrays[name] = np.frombuffer(payload, dtype=dtype)
    positions = arrays["neutral.f64"].reshape((-1, 3))
    corners = arrays["loop-vertex.i32"]
    starts = arrays["loop-start.i32"]
    totals = arrays["loop-total.i32"]
    uv = arrays["loop-uv.f64"].reshape((-1, 2))
    if not np.isfinite(positions).all() or not np.isfinite(uv).all():
        raise ValueError("Nonfinite native geometry or loop UV.")
    if len(positions) != manifest["vertices"] or len(starts) != manifest["polygons"]:
        raise ValueError("Native sample population disagrees with its manifest.")
    polygons = [corners[start:start + count].tolist() for start, count in zip(starts, totals)]
    # A new isolated scene is the source consumer; no resident viewer is used.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mesh = bpy.data.meshes.new("head-provider-native-neutral")
    mesh.from_pydata(positions.tolist(), [], polygons)
    mesh.update()
    actual_corners = np.empty(len(mesh.loops), dtype=np.int32)
    mesh.loops.foreach_get("vertex_index", actual_corners)
    if not np.array_equal(actual_corners, corners):
        raise ValueError("Blender construction changed native polygon winding.")
    layer = mesh.uv_layers.new(name="native-loop-uv")
    layer.data.foreach_set("uv", uv.reshape(-1))
    ids = mesh.attributes.new("native_sample_id", "INT", "POINT")
    ids.data.foreach_set("value", np.arange(len(positions), dtype=np.int32))
    obj = bpy.data.objects.new("shared-neutral-skin", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    obj["frame"] = "Blender metres; +X left, +Z up, -Y anterior"
    obj["coordinate_authority"] = str((args.sample / "neutral.f64").resolve())
    obj["authoring_status"] = "native baseline; independent patches not yet authored"
    head_payload, generation_payload = head_path.read_bytes(), generation_path.read_bytes()
    candidate_inputs = {str(head_path): hashlib.sha256(head_payload).hexdigest(),
                        str(generation_path): hashlib.sha256(generation_payload).hexdigest()}
    observed.expect(head_path, len(head_payload), candidate_inputs[str(head_path)])
    observed.expect(generation_path, len(generation_payload), candidate_inputs[str(generation_path)])
    head = json.loads(gzip.decompress(head_payload))["face"]
    provenance = json.loads(generation_payload)
    partition = head["surfaces"][0]["sourcePartition"]
    samples = partition["samples"]
    records = []
    for name, region in head["skinRegions"].items():
        if region["surface"] != 0:
            continue
        resident = []
        derived = []
        for index in region["vertices"]:
            native = samples[index]
            (resident if native < len(positions) else derived).append(native)
        if resident:
            obj.vertex_groups.new(name="source:" + name).add(sorted(set(resident)), 1.0, "REPLACE")
        records.append({"name": name, "nativeSamples": sorted(set(resident)),
                        "derivedSamples": sorted(set(derived)),
                        "meaning": "inherited registration; sparse selections are not clinical boundaries"})
    ports = []
    for attachment in provenance["headRegions"]:
        name = attachment["name"]
        native = next(record["nativeSamples"] for record in records if record["name"] == name)
        ports.append(read_ear_port(name, native, attachment["loop"], polygons))
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    scene_path = args.out / "hybrid-head-source.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(scene_path.resolve()))
    resident = np.empty(positions.size, dtype=np.float32)
    mesh.vertices.foreach_get("co", resident)
    quantization = np.abs(resident.reshape((-1, 3)).astype(np.float64) - positions)
    record = {
        "schema": "automovie-hybrid-head-authoring/1",
        "stage": "native source preparation; independent geometry pending",
        "generation": partition["generation"],
        "blender": bpy.app.version_string,
        "frame": obj["frame"],
        "sampleInputs": authority,
        "candidateInputs": candidate_inputs,
        "vertices": len(mesh.vertices), "polygons": len(mesh.polygons), "loops": len(mesh.loops),
        "blenderFloat32MaxCoordinateDifferenceMetres": quantization.max(axis=0).tolist(),
        "regions": records,
        "replacementPorts": ports,
        "attachmentReadings": provenance["headRegions"],
        "sparseReadings": provenance["headSampleSelections"],
        "unknown": ["nose socket and true aperture rim",
                    "ordered184 neck cut cycle", "authored independent section and relief",
                    "upstream provider target/weight/normal/UV regeneration", "final viewer appearance"],
        "scene": {"path": str(scene_path), "sha256": digest(scene_path)},
    }
    observed.verify()
    (args.out / "authoring-provenance.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
    print("[hybrid-head-source]", len(mesh.vertices), len(mesh.polygons), len(records), "native source ready", flush=True)


if __name__ == "__main__":
    prepare()
