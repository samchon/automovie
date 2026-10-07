"""Decode native corner spans without negative slicing or index wrapping.

Original ordered spans and vertex IDs are retained exactly. Empty tables and
empty spans remain empty; malformed referenced spans or vertices refuse.
This admission owns representation bounds, not anatomical qualification.
"""

from pathlib import Path
import numpy as np
from NativePolygonTable import NativePolygonTable
from read_native_array import read_native_array
from native_safe_integer import native_safe_integer


def read_native_polygons(sample: Path, vertices: int) -> NativePolygonTable:
    vertices = native_safe_integer(vertices)
    starts = read_native_array(sample / "loop-start.i32", "<i4")
    totals = read_native_array(sample / "loop-total.i32", "<i4")
    corners = read_native_array(sample / "loop-vertex.i32", "<i4")
    if len(starts) != len(totals):
        raise ValueError("Native polygon start/count populations disagree.")
    polygons = []
    for ordinal, (raw_start, raw_count) in enumerate(zip(starts, totals)):
        start, count = native_safe_integer(raw_start), native_safe_integer(raw_count)
        if start > len(corners) or count > len(corners) - start:
            raise ValueError("Native polygon has an invalid corner span: " + str(ordinal))
        ids = corners[start:start + count]
        if np.any(ids < 0) or np.any(ids >= vertices):
            raise ValueError("Native polygon references an invalid physical vertex: " + str(ordinal))
        polygons.append(ids.tolist())
    return NativePolygonTable(starts, totals, corners, polygons)
