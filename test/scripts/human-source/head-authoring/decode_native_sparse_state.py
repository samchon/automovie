"""Admit a complete native sparse span before NumPy can wrap any index.

Safe-integer offsets/counts, complete triples, ordered unique native indices
and finite deltas mirror the TypeScript decoder's raw contract. Python keeps
Blender-frame deltas; the public-frame conversion belongs to the TS adapter.
"""

import numpy as np
from NativeSparseStateInput import NativeSparseStateInput
from native_safe_integer import native_safe_integer


def decode_native_sparse_state(source: NativeSparseStateInput) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    vertices = native_safe_integer(source.vertices)
    start, count = native_safe_integer(source.row_offset), native_safe_integer(source.row_count)
    joint_start, joint_count = native_safe_integer(source.landmark_offset), native_safe_integer(source.landmark_count)
    native_safe_integer(3 * vertices)
    if source.rows_vertex.ndim != 1 or source.rows_delta.shape != (len(source.rows_vertex), 3) or \
            source.landmark_delta.ndim != 2 or source.landmark_delta.shape[1] != 3 or \
            count > len(source.rows_vertex) or start > len(source.rows_vertex) - count or \
            joint_count > len(source.landmark_delta) or joint_start > len(source.landmark_delta) - joint_count:
        raise ValueError("Invalid native sparse row or landmark span: " + source.name)
    ids = source.rows_vertex[start:start + count]
    delta = source.rows_delta[start:start + count]
    joints = source.landmark_delta[joint_start:joint_start + joint_count]
    if not np.issubdtype(ids.dtype, np.integer) or np.any(ids < 0) or np.any(ids >= vertices) or \
            np.any(ids[1:] <= ids[:-1]) or not np.isfinite(delta).all() or not np.isfinite(joints).all():
        raise ValueError("Invalid native sparse identity or delta: " + source.name)
    return ids.copy(), delta.copy(), joints.copy()
