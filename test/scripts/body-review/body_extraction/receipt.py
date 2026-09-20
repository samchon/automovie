"""Measurements that make a body basis revision checkable after the fact.

Nothing here decides geometry. It measures what the extraction produced so
the receipt can state, with numbers, the properties later stages rely on:

- `face_offset` solves the face-frame height offset from the committed face
  basis and proves the correspondence (every non-ring face vertex has an exact
  body twin) and the UV convention (whether V is inverted) before any clipping.
- `ring_agreement` compares the body's ring vertices with the face's ring
  vertices at Y = -0.145 m, the shared edge stencil the combination stage
  joins by position.
- `mirror_pairs` pairs every clipped vertex with its X reflection, reporting
  the pairing residual and the midline population, and `mirror_residual`
  measures a right endpoint against the mirror of its left twin so an
  asymmetric basis cannot quietly inherit a symmetric assumption.
- `sparse_rows` and `displacement_stats` produce the endpoint payload and its
  per-unit statistics (RMS, maximum, moved vertex count) in metres.
- `digest` and `write_gzip` fix the published bytes: the JSON is serialized
  deterministically and gzipped with a zero mtime so the compressed digest is
  reproducible.
"""
import gzip
import hashlib
import json
import os

import numpy as np
from mathutils import Vector, kdtree

from .clip import CUT_Y
from .session import ROOT

FACE_BASIS = os.path.join(ROOT, "test", "studies", "human-face", "connected-basis", "global-face", "basis.json.gz")


def load_face_human():
    with gzip.open(FACE_BASIS, "rt", encoding="utf-8") as file:
        basis = json.load(file)
    surface = next(s for s in basis["surfaces"] if s["id"] == "Human")
    region = next(r for r in surface["regions"] if r["id"] == "Human/skin")
    return basis["id"], np.array(surface["positions"], dtype=np.float64).reshape(-1, 3), np.array(region["indices"]), np.array(region["uvs"]).reshape(-1, 2)


def _tree(points):
    tree = kdtree.KDTree(len(points))
    for index, point in enumerate(points):
        tree.insert(Vector((float(point[0]), float(point[1]), float(point[2]))), index)
    tree.balance()
    return tree


def face_offset(neutral_full, topology):
    """Solve the frame offset and prove the head correspondence and UV convention."""
    face_id, face_positions, face_indices, face_uvs = load_face_human()
    offset = float(neutral_full[:, 2].max() - face_positions[:, 1].max())
    body_face_frame = np.stack([neutral_full[:, 0], neutral_full[:, 2] - offset, -neutral_full[:, 1]], axis=1)
    tree = _tree(body_face_frame)
    above = face_positions[:, 1] > CUT_Y + 1e-6
    worst = 0.0
    twins = {}
    for index in np.nonzero(above)[0]:
        _co, twin, distance = tree.find(Vector(face_positions[index].tolist()))
        worst = max(worst, distance)
        twins[int(index)] = int(twin)
    # UV convention: compare each face corner UV against the body's loop UVs at
    # the twin vertex. A seam vertex carries several UVs, so the nearest one
    # answers; the convention is whichever leaves every corner exact.
    body_uv = {}
    for loop, vertex in enumerate(topology["loop_vertex"]):
        body_uv.setdefault(int(vertex), []).append(topology["loop_uv"][loop])
    plain = flipped = 0.0
    count = 0
    for corner, vertex in enumerate(face_indices):
        twin = twins.get(int(vertex))
        if twin is None:
            continue
        u, v = face_uvs[corner]
        plain = max(plain, min(max(abs(u - bu), abs(v - bv)) for bu, bv in body_uv[twin]))
        flipped = max(flipped, min(max(abs(u - bu), abs(v - (1.0 - bv))) for bu, bv in body_uv[twin]))
        count += 1
    return {
        "faceBasis": face_id,
        "offset": offset,
        "matchedVertices": len(twins),
        "worstMatchMetres": worst,
        "uvCornersCompared": count,
        "uvWorstPlain": float(plain),
        "uvWorstFlipped": float(flipped),
        "invertV": bool(flipped < plain),
    }


def ring_agreement(neutral_clipped, ring_start):
    """Compare the body ring with the face ring at the clip plane."""
    _id, face_positions, _i, _u = load_face_human()
    face_ring = face_positions[np.abs(face_positions[:, 1] - CUT_Y) < 1e-9]
    body_ring = neutral_clipped[ring_start:]
    tree = _tree(body_ring)
    worst = 0.0
    for point in face_ring:
        _co, _index, distance = tree.find(Vector(point.tolist()))
        worst = max(worst, distance)
    return {"faceRing": int(len(face_ring)), "bodyRing": int(len(body_ring)), "worstMetres": worst}


def mirror_pairs(neutral_clipped):
    """Index of each vertex's X-reflected mate, with pairing residuals."""
    tree = _tree(neutral_clipped)
    mate = np.empty(len(neutral_clipped), dtype=np.int64)
    residual = np.empty(len(neutral_clipped), dtype=np.float64)
    for index, point in enumerate(neutral_clipped):
        _co, twin, distance = tree.find(Vector((-float(point[0]), float(point[1]), float(point[2]))))
        mate[index] = twin
        residual[index] = distance
    involution = bool(np.all(mate[mate] == np.arange(len(mate))))
    midline = int(np.sum(mate == np.arange(len(mate))))
    return mate, {
        "rmsMetres": float(np.sqrt(np.mean(residual ** 2))),
        "worstMetres": float(residual.max()),
        "involution": involution,
        "midlineVertices": midline,
    }


def mirror_residual(left_delta, right_delta, mate):
    """Worst distance between a right endpoint and the mirrored left endpoint."""
    mirrored = left_delta[mate].copy()
    mirrored[:, 0] = -mirrored[:, 0]
    return float(np.linalg.norm(right_delta - mirrored, axis=1).max())


def sparse_rows(delta, decimals=7):
    """Flat `[vertex, dx, dy, dz]` rows, rounded, omitting rows that round to zero."""
    rounded = np.round(delta, decimals)
    moved = np.nonzero(np.any(rounded != 0.0, axis=1))[0]
    rows = np.empty((len(moved), 4), dtype=np.float64)
    rows[:, 0] = moved
    rows[:, 1:] = rounded[moved]
    flat = rows.reshape(-1).tolist()
    flat[0::4] = [int(v) for v in flat[0::4]]
    return flat, len(moved)


def displacement_stats(delta):
    norms = np.linalg.norm(delta, axis=1)
    moved = norms > 0
    return {
        "rmsMetres": float(np.sqrt(np.mean(norms[moved] ** 2))) if moved.any() else 0.0,
        "maxMetres": float(norms.max()),
        "movedVertices": int(moved.sum()),
    }


def digest(data):
    return hashlib.sha256(data).hexdigest()


def serialize(document):
    return json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def write_gzip(path, data):
    with open(path, "wb") as raw:
        with gzip.GzipFile(fileobj=raw, mode="wb", mtime=0, compresslevel=9) as file:
            file.write(data)
    with open(path, "rb") as file:
        return digest(file.read()), os.path.getsize(path)
