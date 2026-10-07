"""The single in-memory source formula consumed by CLI and endpoint replay.

One constructor loads source IDs/topology, sparse neck endpoint witnesses and
the authored ports. Each call consumes the current native XYZ and joint state
with named numerical recipe; no source file, Blender, subprocess or global
mutation is needed during replay. Original input arrays stay unchanged.
The dense nasal socket/cap incidence is frozen once, so all endpoint states
retain the same appended IDs and mixed cell population. The source publisher
must admit current geometry and regenerate every invalidated descendant.
"""

import json
from pathlib import Path

import numpy as np

from HeadSourceEvaluation import HeadSourceEvaluation
from evaluate_ear_sections import evaluate_ear_sections
from evaluate_head_envelope import evaluate_head_envelope
from evaluate_nasal_provider import evaluate_nasal_provider
from evaluate_nasal_envelope import evaluate_nasal_envelope
from NativeSparseStateInput import NativeSparseStateInput
from decode_native_sparse_state import decode_native_sparse_state
from read_native_array import read_native_array
from read_native_points import read_native_points
from read_native_polygons import read_native_polygons
from read_source_profile import read_source_profile


class HeadSourceProvider:
    def __init__(self, sample: Path, authored: Path):
        self.manifest = json.loads((sample / "manifest.json").read_text(encoding="utf-8"))
        inputs = json.loads((authored / "source-inputs.json").read_text(encoding="utf-8"))
        self.guide = read_source_profile(authored, inputs, "sourceGuide")
        self.authority = read_source_profile(authored, inputs, "earGuide")
        self.axes = read_source_profile(authored, inputs, "nasalAxis")
        self.sockets = read_source_profile(authored, inputs, "nasalSocket")
        self.nasal_guide = read_source_profile(authored, inputs, "nasalExteriorGuide") if "nasalExteriorGuide" in inputs["profiles"] else None
        self.polygons = read_native_polygons(sample, self.manifest["vertices"]).polygons
        self.neck_fields = {}
        rows_vertex = read_native_array(sample / "rows.i32", "<i4")
        rows_delta = read_native_points(sample / "rows.f64")
        landmark_delta = read_native_points(sample / "landmarks.f64")
        for sign in ("incr", "decr"):
            name = "neck/measure-neck-height-" + sign
            state = next(record for record in self.manifest["states"] if record["name"] == name)
            ids, skin, joints = decode_native_sparse_state(NativeSparseStateInput(name, self.manifest["vertices"],
                rows_vertex, rows_delta, state["rowOffset"], state["rowCount"], landmark_delta,
                state["landmarkOffset"], len(self.manifest["landmarkIds"])))
            self.neck_fields[name] = (ids, skin, joints)

    def evaluate(self, nativeXYZ, numericRecipe: dict, nativeJointWitness) -> HeadSourceEvaluation:
        positions = np.asarray(nativeXYZ, dtype=np.float64).reshape((-1, 3))
        joints = np.asarray(nativeJointWitness, dtype=np.float64).reshape((-1, 3))
        if len(positions) != self.manifest["vertices"] or len(joints) != len(self.manifest["landmarkIds"]):
            raise ValueError("Head provider needs the original native population and this state's exact joint witness.")
        if not np.isfinite(positions).all() or not np.isfinite(joints).all():
            raise ValueError("Head provider refuses nonfinite current native XYZ or joint witness.")
        envelope, shaped_joints, record = evaluate_head_envelope(
            positions, joints, self.manifest, self.guide, numericRecipe["head"], self.neck_fields,
        )
        if "nasalExterior" in numericRecipe:
            if self.nasal_guide is None:
                raise ValueError("Requested nasal exterior has no authored native source guide, including zero requests.")
            envelope, shaped_joints, exterior_record = evaluate_nasal_envelope(
                envelope, shaped_joints, self.nasal_guide, numericRecipe["nasalExterior"],
            )
            record["nasalExterior"] = exterior_record
        ears, ear_records = evaluate_ear_sections(envelope, self.polygons, self.authority, numericRecipe["ears"])
        complete, cells, nasal_records = evaluate_nasal_provider(
            ears, self.polygons, self.authority, self.sockets, numericRecipe["nose"], self.axes,
        )
        return HeadSourceEvaluation(complete, shaped_joints, cells, record, ear_records, nasal_records)
