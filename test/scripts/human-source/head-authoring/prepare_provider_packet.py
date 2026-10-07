"""Bind authored provider cells, corner UVs and native support into one packet.

This consumes the actual source-authoring output for the single upstream
publisher. Retained native corner UVs are copied exactly; new sections own
source-private UV charts and every appended point names its original rim
support. The packet is source data, not a personal mesh authoring input.
It does not publish a generation or certify normal/weight/contact derivatives.
Provider data is consumed from admitted buffers. Recipe and all input entry
digests stay bound to their original observations, never a later replacement.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from read_native_array import read_native_array
from read_native_points import read_native_points
from read_native_polygons import read_native_polygons
from native_safe_integer import native_safe_integer
from SourceAuthoringInputObservation import SourceAuthoringInputObservation
from read_source_profile import read_source_profile

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from SourcePublication import SourcePublication
from read_source_publication import read_source_publication


def prepare():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--provider", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if any((args.out / name).exists() for name in ("provider-cells.json", "head-provider-packet.json", "run-locators.json")):
        raise ValueError("Provider packet cannot overwrite an existing immutable packet.")
    with SourcePublication(args.out) as publication:
        _prepare(args, publication)


def _prepare(args, publication):
    provider_names = ("provider-provenance.json", "polygons.json", "neutral-provider.f64", "joints-provider.f64")
    captured = read_source_publication(args.provider, list(provider_names), "provider-evaluation-publication.json")
    observation = SourceAuthoringInputObservation(args.sample, args.source, [Path(__file__),
        *[args.provider / name for name in provider_names], args.provider / "provider-evaluation-publication.json",
        args.sample.parent / "upstream/makehuman/LICENSE.ASSETS.md",
        Path(__file__).resolve().parent.parent / "SourceInputObservation.py",
        Path(__file__).resolve().parent.parent / "SourcePublication.py",
        Path(__file__).resolve().parent.parent / "read_source_publication.py"])
    for name in provider_names:
        payload = captured[name]
        observation.expect(args.provider / name, len(payload), hashlib.sha256(payload).hexdigest())
    authored = observation.authored
    code = [args.source / record["path"] for record in authored["files"]
            if Path(record["path"]).suffix == ".py"]
    profiles = {name: args.source / entry["path"] for name, entry in authored["profiles"].items()}
    authority = read_source_profile(args.source, authored, "earGuide")
    generated = json.loads(captured["provider-provenance.json"])
    sample_manifest = observation.sampled
    observation.extend([Path(file) for file in generated["recipeAuthority"].values()])
    if set(generated["recipeInputs"]) != set(generated["recipeAuthority"]):
        raise ValueError("Provider recipe identities must match the original consumed recipe population.")
    for name, file in generated["recipeAuthority"].items():
        expected = generated["recipeInputs"][name]
        observation.expect(Path(file), expected["bytes"], expected["sha256"])
    polygons = json.loads(captured["polygons.json"])
    positions = read_native_points(args.provider / "neutral-provider.f64", owned_bytes=captured["neutral-provider.f64"])
    native_count = native_safe_integer(generated["nativeVertices"])
    if native_count != sample_manifest["vertices"] or native_count > len(positions):
        raise ValueError("Provider original native population disagrees with its source sample.")
    topology = read_native_polygons(args.sample, native_count)
    starts, totals, source_polygons = topology.starts, topology.totals, topology.polygons
    uv_values = read_native_array(args.sample / "loop-uv.f64", "<f8")
    if len(uv_values) != 2 * len(topology.corners) or not np.isfinite(uv_values).all():
        raise ValueError("Provider UV tuples must match the original native corner population.")
    uv = uv_values.reshape((-1, 2))
    for polygon in polygons:
        for vertex in polygon:
            if native_safe_integer(vertex) >= len(positions):
                raise ValueError("Provider output cell has an invalid physical vertex.")
    for section in generated["nasalSections"]:
        for index in section["removedNativePolygonOrdinals"] + section["capSourceCells"]:
            if native_safe_integer(index) >= len(source_polygons):
                raise ValueError("Provider section names a nonexistent original source cell.")
        for vertex in section["sharedNativeRim"]:
            if native_safe_integer(vertex) >= native_count:
                raise ValueError("Provider source rim has an invalid original native vertex.")
        for ring in section["generatedRings"]:
            if len(ring) != len(section["sharedNativeRim"]):
                raise ValueError("Provider generated ring lost its original rim correspondence.")
            for vertex in ring:
                if native_safe_integer(vertex) >= len(positions):
                    raise ValueError("Provider generated ring references a nonexistent vertex.")
        if len(section["capSourceCells"]) != len(section["terminalCapCells"]):
            raise ValueError("Provider cap source/output cell populations disagree.")
    removed = set(index for section in generated["nasalSections"] for index in section["removedNativePolygonOrdinals"])
    cells = []
    for index, polygon in enumerate(source_polygons):
        if index in removed:
            continue
        start, count = int(starts[index]), int(totals[index])
        cells.append({"id": "native-skin:" + str(index), "vertices": polygon,
                      "cornerUV": uv[start:start + count].tolist(), "materialRole": "inherited-native-skin",
                      "partId": "native-skin", "originalNativePolygon": index})
    bindings = []
    for section in generated["nasalSections"]:
        bindings.extend(section["appendedBindings"])
        cycle = section["sharedNativeRim"]
        rings = section["generatedRings"]
        side = section["side"]
        root = positions[cycle]
        distances = np.linalg.norm(np.roll(root, -1, axis=0) - root, axis=1)
        stations = np.concatenate(([0], np.cumsum(distances)))
        if not np.isfinite(stations[-1]) or stations[-1] <= 0:
            raise ValueError("New nasal UV chart needs a finite actual rim length.")
        stations /= stations[-1]
        previous = cycle
        for ordinal, ring in enumerate(rings):
            for index, (native, appended) in enumerate(zip(cycle, ring)):
                nxt = (index + 1) % len(cycle)
                corners_for_cell = [previous[index], previous[nxt], ring[nxt], ring[index]]
                if ordinal == 0:
                    # Exact inherited boundary UVs stay at the root. Each
                    # support cell extends into its removed source cell's UV
                    # interior; corner charts may split without splitting the
                    # shared geometry. No texture pixel invents a skin point.
                    owners = [p for p in section["removedNativePolygonOrdinals"]
                              if native in source_polygons[p] and cycle[nxt] in source_polygons[p]]
                    if len(owners) != 1:
                        raise ValueError("Nasal support edge needs one removed native UV owner.")
                    owner = owners[0]
                    native_cell = source_polygons[owner]
                    native_uv = uv[int(starts[owner]):int(starts[owner] + totals[owner])]
                    a = native_uv[native_cell.index(native)]
                    b = native_uv[native_cell.index(cycle[nxt])]
                    interior = native_uv.mean(axis=0)
                    inward = interior - (a + b) / 2
                    fraction = section["dimensions"]["rimSupportDepthMillimetres"] / section["dimensions"]["liningDepthMillimetres"]
                    chart = [a.tolist(), b.tolist(), (b + fraction * inward).tolist(), (a + fraction * inward).tolist()]
                    role, part = "inherited-native-skin", "nasal-rim-" + side
                else:
                    chart = [[float(stations[index]), 0], [float(stations[index + 1]), 0],
                             [float(stations[index + 1]), 1], [float(stations[index]), 1]]
                    role, part = "authored-nasal-lining", "nasal-vestibule-" + side
                cells.append({"id": part + ":" + str(ordinal) + ":" + str(index),
                              "vertices": corners_for_cell, "cornerUV": chart, "materialRole": role, "partId": part})
            previous = ring
        for native_cell, generated_cell in zip(section["capSourceCells"], section["terminalCapCells"]):
            start, count = int(starts[native_cell]), int(totals[native_cell])
            cells.append({"id": "nasal-floor-" + side + ":" + str(native_cell), "vertices": generated_cell,
                          "cornerUV": uv[start:start + count].tolist(), "materialRole": "authored-nasal-lining",
                          "partId": "nasal-vestibule-" + side, "replacementNativePolygon": native_cell})
    if [cell["vertices"] for cell in cells] != polygons:
        raise ValueError("Provider cell/UV packet disagrees with the actual generated polygon order.")
    active = sorted(set(vertex for polygon in polygons for vertex in polygon))
    retained = [vertex for vertex in active if vertex < generated["nativeVertices"]]
    retired = sorted(set(range(generated["nativeVertices"])) - set(retained))
    args.out.mkdir(parents=True, exist_ok=True)
    cell_path = args.out / "provider-cells.json"
    with cell_path.open("x", encoding="utf-8") as output:
        output.write(json.dumps(cells, separators=(",", ":"), allow_nan=False))
    run_locators = {}
    repository = Path(__file__).resolve().parents[4]
    def entry(path, repository_bound=False, source_role=None, *, is_output=False):
        """Name an owned output or bind input bytes to their already admitted observation."""
        resolved = path.resolve()
        payload = path.read_bytes()
        sha256 = hashlib.sha256(payload).hexdigest()
        if not is_output:
            observation.expect(path, len(payload), sha256)
        if repository_bound:
            if not resolved.is_relative_to(repository):
                raise ValueError("Provider profile/code authority must remain repository-bound.")
            logical = resolved.relative_to(repository).as_posix()
        elif source_role is not None:
            # A maintained recipe has its full portable repository address.
            # An explicitly supplied external recipe retains the CLI's domain;
            # its semantic role is the portable source namespace and its physical
            # path stays in run evidence. Neither address depends on a basename.
            logical = resolved.relative_to(repository).as_posix() if resolved.is_relative_to(repository) else "authoring-recipe/" + source_role
        elif resolved.is_relative_to(args.source.resolve()):
            logical = "head-authoring/" + resolved.relative_to(args.source.resolve()).as_posix()
        elif resolved.is_relative_to(args.sample.resolve()):
            logical = "sample/" + resolved.relative_to(args.sample.resolve()).as_posix()
        elif resolved.name == "LICENSE.ASSETS.md":
            logical = "upstream/makehuman/LICENSE.ASSETS.md"
        else:
            logical = "provider-output/" + resolved.name
        previous = run_locators.get(logical)
        if previous is not None and previous != str(resolved):
            raise ValueError("Provider source address names two different physical inputs: " + logical)
        run_locators[logical] = str(resolved)
        return {"logicalPath": logical, "sha256": sha256}

    packet = {
        "schema": "automovie-authored-head-provider/1", "stage": "author packet; callable replay/publisher integration pending",
        "sourceId": "automovie-hybrid-head-20261006-source-authoring", "sourceBasisGeneration": authority["generation"],
        "authoringInputs": entry(args.source / "source-inputs.json", True),
        "frame": authority["frame"], "originalNativeCount": generated["nativeVertices"],
        "sampleInputs": sample_manifest["files"], "producerCode": [entry(path, True) for path in sorted(code)],
        "producerRecipe": {name: entry(Path(path), source_role=name) for name, path in generated["recipeAuthority"].items()},
        "rights": {"nativeMesh": "CC0 MakeHuman asset; exact pinned sample and license authority",
                   "nativeLicense": entry(args.sample.parent / "upstream/makehuman/LICENSE.ASSETS.md"),
                   "authoredCode": "automovie source-authoring code under repository MIT license; no third-party implementation text copied"},
        "retainedNativeIds": retained, "retiredNativeIds": retired, "appendedBindings": bindings,
        "cells": entry(cell_path, is_output=True), "positions": entry(args.provider / "neutral-provider.f64"),
        "sourceGuide": entry(profiles["sourceGuide"], True), "earGuide": entry(profiles["earGuide"], True),
        "nasalExteriorGuide": entry(profiles["nasalExteriorGuide"], True),
        "nasalSocket": entry(profiles["nasalSocket"], True), "nasalAxisFit": entry(profiles["nasalAxis"], True),
        "bonepoints": entry(args.provider / "joints-provider.f64"),
        "orderedPorts": {"ears": authority["replacementPorts"],
                         "nose": [{"side": section["side"], "orderedNativeBoundary": section["sharedNativeRim"]} for section in generated["nasalSections"]],
                         "eyes": {"status": "publisher native read margins/lash roots; exact mapping pending same packet"},
                         "oral": {"status": "publisher registered44/37 source margin; exact mapping pending same packet"},
                         "neck": {"status": "publisher ordered184 common-root cut; original intersection authority retained"}},
        "qualifications": ["Source-private charts and explicit prototype dimensions, not personal reconstruction or clinical norms.",
                           "Neutral envelope and explicit authored ear/nasal source have distinct recipe authority; nonzero head variants are separate.",
                           "Retired naris witnesses must not read original-rest phantom coordinates."],
        "invalidatedDescendants": generated["invalidatedDescendants"],
        "pending": ["full743 intrinsic source replay and canonical publication",
                    "C1/clearance/normal/weight/UV/material admission", "actual full person/motion/editor/save/F32/hardwareGPU"],
    }
    packet_path = args.out / "head-provider-packet.json"
    with packet_path.open("x", encoding="utf-8") as output:
        output.write(json.dumps(packet, indent=2, allow_nan=False))
    with (args.out / "run-locators.json").open("x", encoding="utf-8") as output:
        output.write(json.dumps(run_locators, indent=2))
    print("[head-provider-packet]", len(cells), "oriented UV cells", len(bindings), "native support bindings", len(retired), "retired samples", flush=True)
    publication.complete(hashlib.sha256(packet_path.read_bytes()).hexdigest(), observation.verify)


if __name__ == "__main__":
    prepare()
