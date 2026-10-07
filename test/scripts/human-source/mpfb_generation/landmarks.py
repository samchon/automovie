"""Joint-cube centroids of the helper base mesh.

MPFB defines each rig joint by a cube of eight helper vertices; the cube's
centroid is the joint and moves with every target. The groups are read from
`mesh_metadata/basemesh_vertex_groups.json` in file order, as the deleted body
extraction did (`44dec918c:test/scripts/body-review/body_extraction/rig.py`).
Centroids are returned in Blender coordinates; the compiler applies the frame.
"""
import json
import os

import numpy as np


def joint_groups(data):
    """`joint-*` name -> flat helper vertex indices, in file order."""
    with open(os.path.join(data, "mesh_metadata", "basemesh_vertex_groups.json"), encoding="utf-8") as file:
        groups = json.load(file)
    out = {}
    for name, ranges in groups.items():
        if name.startswith("joint-"):
            out[name] = np.concatenate([np.arange(a, b + 1) for a, b in ranges])
    return out


def centroids(helpers, groups):
    """(landmarks, 3) centroid matrix in the order of `groups`."""
    return np.array([helpers[rows].mean(axis=0) for rows in groups.values()])
