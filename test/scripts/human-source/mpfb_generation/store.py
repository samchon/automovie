"""Deterministic binary layout of one sampling run.

`rows.i32` holds little-endian int32 vertex indices and `rows.f64` the matching
little-endian float64 XYZ deltas, state after state; `landmarks.f64` holds one
dense (landmarks, 3) delta per state. `manifest.json` names every state with
its element offsets so the reader never infers an order. Values are Blender
coordinates exactly as sampled: no rounding, no frame conversion.
"""
import hashlib
import json
import os

import numpy as np


class Store:
    def __init__(self, directory):
        if os.path.exists(directory):
            raise ValueError("Sampling output already exists: " + directory)
        os.makedirs(directory)
        self.directory = directory
        self.rows_i32 = open(os.path.join(directory, "rows.i32"), "wb")
        self.rows_f64 = open(os.path.join(directory, "rows.f64"), "wb")
        self.marks_f64 = open(os.path.join(directory, "landmarks.f64"), "wb")
        self.row_count = 0
        self.mark_count = 0
        self.states = []

    def state(self, name, kind, skin_delta, landmark_delta, recipe):
        """Append one sampled state; rows are every vertex whose delta is not exactly zero."""
        moved = np.nonzero(np.any(skin_delta != 0.0, axis=1))[0]
        moved.astype("<i4").tofile(self.rows_i32)
        np.ascontiguousarray(skin_delta[moved], dtype="<f8").tofile(self.rows_f64)
        np.ascontiguousarray(landmark_delta, dtype="<f8").tofile(self.marks_f64)
        self.states.append({
            "name": name, "kind": kind, "recipe": recipe,
            "rowOffset": self.row_count, "rowCount": int(len(moved)),
            "landmarkOffset": self.mark_count,
        })
        self.row_count += int(len(moved))
        self.mark_count += int(landmark_delta.shape[0])

    def array(self, name, values, dtype):
        path = os.path.join(self.directory, name)
        np.ascontiguousarray(values, dtype=dtype).tofile(path)
        return name

    def close(self, manifest):
        for file in (self.rows_i32, self.rows_f64, self.marks_f64):
            file.close()
        manifest["states"] = self.states
        files = {}
        for entry in sorted(os.listdir(self.directory)):
            with open(os.path.join(self.directory, entry), "rb") as file:
                data = file.read()
            files[entry] = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        manifest["files"] = files
        with open(os.path.join(self.directory, "manifest.json"), "w", encoding="utf-8", newline="\n") as file:
            json.dump(manifest, file, indent=1)
            file.write("\n")
