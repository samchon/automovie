"""Regenerate visceral adipose on new registered internals and one frozen N domain.

From the repository root:
  python test/scripts/human-source/body-anatomy/author_registered_visceral.py OUTPUT --registered-assembly ASSEMBLY --target-body-view BODY --physical-body-view CURRENT_BODY --bone-operator OPERATORS --domain-field FIELD_NPZ --domain-audit AUDIT --domain-receipt RECEIPT --domain-recipe ORIGINAL_RECIPE

The archived target skin, original domain recipe and authoring quantities bind
one already produced body-envelope/skin-boundary/origin/pitch/neck domain. This
operation reads those immutable domain data, verifies identical current physical
skin positions and triangles, and creates no cap or new exterior domain. It never
reads the archived fascia, bone, subcutaneous or visceral fields. Every internal
support and mesenteric field is regenerated from the actual new registered
source. Only abdominalVisceralAdipose is emitted; native SAT remains its owner.
This preserves an authored generic compartment, not segmented clinical anatomy.
"""
import argparse
import ctypes
import gzip
import hashlib
import json
import os
import sys
import time
from pathlib import Path

import numpy as np
import scipy
import trimesh
from scipy import ndimage

from atlas_inputs import read_raw_obj
from source_field_isosurface import extract_source_field

ROOT = Path(__file__).resolve().parents[4]
DATA = ROOT / ".references/bodyparts3d"
COVERAGE = ROOT / ".wiki/08-campaigns/2707-human/artifacts/all-parts/measurement-interface-coverage.json"
COMPARTMENTS = DATA / "compartment-references"


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def read_mesh(file, receipts):
    vertices, faces = read_raw_obj(file, {}, ROOT)
    data = file.read_bytes()
    lines = data.decode().splitlines()
    receipts[str(file.relative_to(ROOT)).replace("\\", "/")] = {"sha256": sha256(data), "vertices": len(vertices), "triangles": len(faces), "originalHeader": [line for line in lines if line.startswith("#")]}
    return trimesh.Trimesh(vertices=vertices, faces=faces, process=False)


def rasterize(points, origin, shape, pitch):
    indices = np.rint((points - origin) / pitch).astype(np.int64)
    inside = np.all((indices >= 0) & (indices < np.asarray(shape)), axis=1)
    field = np.zeros(shape, dtype=bool)
    coordinates = indices[inside]
    field[coordinates[:, 0], coordinates[:, 1], coordinates[:, 2]] = True
    return field


def occupy(mesh, origin, shape, pitch):
    return rasterize(mesh.voxelized(pitch).fill().points, origin, shape, pitch)


class ProcessMemoryCounters(ctypes.Structure):
    _fields_ = [("cb", ctypes.c_ulong), ("PageFaultCount", ctypes.c_ulong)] + [(name, ctypes.c_size_t) for name in ("PeakWorkingSetSize", "WorkingSetSize", "QuotaPeakPagedPoolUsage", "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage", "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage")]


def peak_memory_bytes():
    if os.name != "nt":
        return None
    counters = ProcessMemoryCounters()
    counters.cb = ctypes.sizeof(counters)
    kernel = ctypes.windll.kernel32
    kernel.GetCurrentProcess.restype = ctypes.c_void_p
    psapi = ctypes.windll.psapi
    psapi.GetProcessMemoryInfo.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong]
    if not psapi.GetProcessMemoryInfo(kernel.GetCurrentProcess(), ctypes.byref(counters), counters.cb):
        raise OSError("Actual source-authoring peak memory query failed.")
    return int(counters.PeakWorkingSetSize)


def muscle_region(identity, coverage):
    side = "left" if identity.startswith("left") else "right"
    for row in coverage["rows"]:
        path = row["path"]
        if not path.endswith(".muscleBellyVolume") or side not in path:
            continue
        fields = path.split(".")[:-1]
        for length in (1, 2, 3):
            name = side + "".join(field[0].upper() + field[1:] for field in fields[-length:])
            if name != identity:
                continue
            if fields[0] in ("trunk", "pelvis"):
                return "trunk-pelvic-support"
            return ".".join(fields[:2])
    raise ValueError("No actual named muscle region in measurement graph: " + identity)


def write_boundary(identity, field, origin, pitch, output):
    if not np.any(field):
        raise ValueError("Authored adipose field is empty: " + identity)
    # One PL tetrahedral source field owns exact shared edge intersections.
    # The fixed .5 level is not tuned to a desired volume or existing mesh.
    vertices, triangles = extract_source_field(field, origin, pitch)
    mesh = trimesh.Trimesh(vertices=vertices, faces=triangles, process=False)
    if mesh.volume < 0:
        mesh.invert()
    triangles = mesh.faces
    normals = mesh.vertex_normals
    lines = ["# Reproducibly authored target-neutral hypothesis, not clinical adipose segmentation.", "# Part ID : " + identity, "# Units : target source-neutral metres; +X left, +Y up, +Z anterior"]
    lines.extend("v " + " ".join(format(value, ".17g") for value in point) for point in vertices)
    lines.extend("vn " + " ".join(format(value, ".17g") for value in normal) for normal in normals)
    lines.extend("f " + " ".join(str(index + 1) + "//" + str(index + 1) for index in face) for face in triangles)
    target = output / (identity + ".obj")
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"id": identity, "file": str(target.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(target.read_bytes()), "vertices": len(vertices), "triangles": len(triangles), "occupiedCells": int(field.sum()), "voxelVolumeCubicMetres": float(field.sum() * pitch ** 3), "boundarySignedVolumeCubicMetres": float(mesh.volume), "sourceIndexWatertight": bool(mesh.is_watertight), "windingConsistent": bool(mesh.is_winding_consistent), "zeroAreaFaces": int(np.count_nonzero(mesh.area_faces == 0)), "components": len(mesh.split(only_watertight=False)), "qualification": "Coarse authored compartment hypothesis; not clinical segmentation, personal reconstruction, physiological validation or source-body registration."}

def main():
    started, cpu_started = time.perf_counter(), time.process_time()
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    for name in ("registered-assembly", "target-body-view", "physical-body-view", "bone-operator", "domain-field", "domain-audit", "domain-receipt", "domain-recipe"):
        parser.add_argument("--" + name, type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ROOT / ".wiki/08-campaigns/2707-human/artifacts"):
        raise ValueError("New visceral source belongs under the campaign artifacts owner.")
    files = {name: getattr(args, name.replace("-", "_")).resolve() for name in ("registered-assembly", "target-body-view", "physical-body-view", "bone-operator", "domain-field", "domain-audit", "domain-receipt", "domain-recipe")}
    files["coverage"] = COVERAGE
    blobs = {name: file.read_bytes() for name, file in files.items()}
    receipts = {str(file.relative_to(ROOT)).replace("\\", "/"): {"sha256": sha256(blobs[name]), "meaning": name} for name, file in files.items()}
    registered = json.loads(blobs["registered-assembly"])
    operator = json.loads(blobs["bone-operator"])
    domain_receipt = json.loads(blobs["domain-receipt"])
    audit = json.loads(blobs["domain-audit"])
    coverage = json.loads(blobs["coverage"])
    target = json.loads(gzip.decompress(blobs["target-body-view"]))
    physical = json.loads(gzip.decompress(blobs["physical-body-view"]))
    body, current = target["body"], physical["body"]
    if registered["basis"] != body["id"] or operator["targetBodyBasis"] != body["id"] or target["id"] != physical["id"]:
        raise ValueError("Visceral source, operators and physical skin need the same identified target frame.")
    geometry_checks = {name: body["surfaces"][0][name] == current["surfaces"][0][name] for name in ("positions", "indices")}
    if not all(geometry_checks.values()):
        raise ValueError("Frozen domain cannot be reused after actual target skin geometry changes.")
    target_id = body["id"]
    if domain_receipt["sourceFrame"] != "target source-neutral canonical metres" or domain_receipt["recipeSha256"] != sha256(blobs["domain-recipe"]):
        raise ValueError("Frozen domain lacks its actual target-neutral recipe identity.")
    quantities = domain_receipt["artistSourceQuantities"]
    for name in ("skin_port_closing_cells", "fascial_support_clearance_cells", "visceral_reference_band_cells", "minimum_subcutaneous_source_clearance_cells"):
        if type(quantities[name]) is not int or quantities[name] < 0:
            raise ValueError("Original material-domain authoring counts must remain nonnegative integers: " + name)
    if registered.get("mode") != "neutral-only" or any(value != 0 for value in registered["shape"].values()):
        raise ValueError("The archived exterior domain supports its actual held-neutral source only.")
    if quantities["target_skin_stage"] is not None:
        raise ValueError("This frozen domain needs its original staged skin bytes, not another view.")
    target_references = [value for value in domain_receipt["sourceReferences"].values() if value.get("meaning") == "actual target exterior, source-neutral canonical metres"]
    if len(target_references) != 1 or target_references[0]["sha256"] != sha256(blobs["target-body-view"]):
        raise ValueError("Frozen exterior domain does not bind the actual archived target skin input.")
    with np.load(files["domain-field"], allow_pickle=False) as domain:
        origin = domain["origin"].copy()
        pitch = float(domain["pitch"])
        body_envelope = domain["body"].copy()
        skin_boundary = domain["skin"].copy()
    shape = body_envelope.shape
    if body_envelope.dtype != bool or skin_boundary.dtype != bool or skin_boundary.shape != shape or len(shape) != 3:
        raise ValueError("Frozen exterior domain needs its original three-dimensional boolean fields.")
    if not np.array_equal(origin, audit["originMetres"]) or list(shape) != audit["shape"] or pitch != audit["pitchMetres"] or pitch != quantities["voxel_pitch_metres"] or not np.isfinite(origin).all() or pitch <= 0:
        raise ValueError("Frozen exterior origin, pitch and shape differ from their own observation.")
    if int(body_envelope.sum()) != domain_receipt["fieldRoles"]["grossBodyEnvelopeCells"] or int(skin_boundary.sum()) != domain_receipt["fieldRoles"]["skinBoundaryCells"]:
        raise ValueError("Frozen exterior field populations differ from their own receipt.")
    neck_limit = float(audit["neckLimitMetres"])
    if neck_limit != quantities["neckTerminationMetres"]:
        raise ValueError("Frozen neck termination differs from its actual exterior domain.")
    del target, physical, body, current
    output.parent.mkdir(parents=True, exist_ok=True)
    output.mkdir()
    source_groups = {}
    for part in registered["parts"]:
        if part["tissue"] == "skeletal-muscle":
            region = muscle_region(part["id"], coverage)
            for surface in part["surfaces"]:
                source_groups.setdefault(region, []).append(np.asarray(surface["mesh"]["positions"]).reshape((-1, 3)))
    fascial_support = np.zeros(shape, dtype=bool)
    group_accounts = []
    for region, members in source_groups.items():
        hull = trimesh.convex.convex_hull(np.vstack(members))
        fascial_support |= occupy(hull, origin, shape, pitch)
        group_accounts.append({"region": region, "supportSourcePointCount": sum(len(member) for member in members), "authoredEnvelopeVolumeCubicMetres": float(hull.volume)})
    bone_support = np.zeros(shape, dtype=bool)
    for part in registered["parts"]:
        if part["tissue"] == "bone":
            for surface in part["surfaces"]:
                mesh = surface["mesh"]
                bone_support |= occupy(trimesh.Trimesh(vertices=np.asarray(mesh["positions"]).reshape((-1, 3)), faces=np.asarray(mesh["indices"]).reshape((-1, 3)), process=False), origin, shape, pitch)
    fascial_support |= bone_support
    clearance = quantities["fascial_support_clearance_cells"]
    if clearance:
        fascial_support = ndimage.binary_dilation(fascial_support, iterations=clearance)
    fascial_support = ndimage.binary_fill_holes(fascial_support)
    minimum_clearance = quantities["minimum_subcutaneous_source_clearance_cells"]
    if minimum_clearance:
        fascial_support &= ndimage.binary_erosion(body_envelope, iterations=minimum_clearance)
    below_neck = origin[1] + np.arange(shape[1]) * pitch < neck_limit
    excluded_superficial_domain = body_envelope & ~fascial_support & ~bone_support & below_neck[None, :, None]
    visceral_support = np.zeros(shape, dtype=bool)
    abdominal = next(item for item in operator["transforms"] if item["bone"] == "l3")
    matrix = np.asarray(abdominal["atlasToTarget"]["linear"]).reshape((3, 3))
    translation = np.asarray(abdominal["atlasToTarget"]["translation"])
    for file_id in ("FJ3396", "FJ3397", "FJ3398"):
        reference = read_mesh(COMPARTMENTS / (file_id + ".obj"), receipts)
        reference.vertices = reference.vertices @ matrix.T + translation
        visceral_support |= occupy(reference, origin, shape, pitch)
    band_cells = quantities["visceral_reference_band_cells"]
    visceral_band = ndimage.binary_dilation(visceral_support, iterations=band_cells) if band_cells else visceral_support
    visceral = visceral_band & body_envelope & ~skin_boundary & ~bone_support & ~excluded_superficial_domain
    fields = {"deepFascialSupport": fascial_support, "boneInteriorSupport": bone_support, "visceralSourceSupport": visceral_support, "visceralMaterial": visceral}
    readings = {}
    for name, field in fields.items():
        _, six = ndimage.label(field, structure=ndimage.generate_binary_structure(3, 1))
        _, twenty_six = ndimage.label(field, structure=ndimage.generate_binary_structure(3, 3))
        readings[name] = {"cells": int(field.sum()), "sixNeighbourComponents": int(six), "twentySixNeighbourComponents": int(twenty_six)}
    (output / "source-field-audit.json").write_text(json.dumps({"originMetres": origin.tolist(), "shape": shape, "pitchMetres": pitch, "neckLimitMetres": neck_limit, "frozenDomainAuditSha256": sha256(blobs["domain-audit"]), "fields": readings, "qualification": "New internal support and visceral field on the unchanged archived target domain; no new skin domain, cap or SAT source"}, indent=2) + "\n", encoding="utf-8")
    np.savez_compressed(output / "source-material-fields.npz", origin=origin, pitch=pitch, fascia=fascial_support, bone=bone_support, visceral=visceral)
    parts = [write_boundary("abdominalVisceralAdipose", visceral, origin, pitch, output)]
    execution = {"wallSeconds": time.perf_counter() - started, "cpuSeconds": time.process_time() - cpu_started, "peakWorkingSetBytes": peak_memory_bytes()}
    recipe = {file.name: sha256(file.read_bytes()) for file in (Path(__file__), Path(__file__).with_name("atlas_inputs.py"), Path(__file__).with_name("source_field_isosurface.py"))}
    receipt = {"recipeSha256": recipe[Path(__file__).name], "producer": recipe, "basis": target_id, "measurementGraphSha256": sha256(blobs["coverage"]), "sourceFrame": "target source-neutral canonical metres", "sourceReferences": receipts, "frozenDomain": {"fieldSha256": sha256(blobs["domain-field"]), "receiptSha256": sha256(blobs["domain-receipt"]), "auditSha256": sha256(blobs["domain-audit"]), "bodyViewSha256": sha256(blobs["target-body-view"]), "physicalBodyViewSha256": sha256(blobs["physical-body-view"]), "sameGeometryChecks": geometry_checks, "readFields": ["origin", "pitch", "body", "skin"], "neckLimitMetres": neck_limit}, "artistSourceQuantities": quantities, "fascialSupportAuthoring": group_accounts, "parts": parts, "clinical": "unavailable", "rights": domain_receipt["rights"], "limitations": domain_receipt["limitations"] + ["Frozen target-domain provenance is retained; its original runtime versions were not recorded here.", "Only visceral adipose is emitted; native subcutaneous tissue remains a separate owner."]}
    (output / "authoring-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    (output / "execution-profile.json").write_text(json.dumps(execution, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output.relative_to(ROOT)), "parts": parts, "execution": execution, "python": sys.version.split()[0], "numpy": np.__version__, "scipy": scipy.__version__, "trimesh": trimesh.__version__}))


if __name__ == "__main__":
    main()
