"""Readers for the atlas members and the target exterior of one registration.

Atlas geometry is BodyParts3D 4.0: one male volunteer's MRI-derived model
completed by illustrators, not a population mean. Compiled members are
already in the common atlas frame, metres with (x, z, -y) / 1000 of the
original millimetre axes, +X left, +Y up, +Z anterior. The raw skin OBJ is
converted here by that same rule, which is the only unit and axis conversion
this producer performs. Rights of every member stay with the publisher's
receipts; this module reads bytes and records their digests.
"""
import gzip
import hashlib
import json
import re

import numpy as np

ACQUIRED = re.compile(r"^FJ\d+M?$")


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def read_raw_obj(file, receipts, root):
    """Triangles of one original BodyParts3D OBJ, converted to atlas metres."""
    data = file.read_bytes()
    vertices, faces = [], []
    for line in data.decode().splitlines():
        if line.startswith("v "):
            vertices.append([float(value) for value in line.split()[1:4]])
        elif line.startswith("f "):
            corners = [int(corner.split("/")[0]) - 1 for corner in line.split()[1:]]
            if len(corners) != 3:
                raise ValueError("Atlas surface is not triangulated: " + str(file))
            faces.append(corners)
    points = np.asarray(vertices, dtype=np.float64)
    points = np.column_stack((points[:, 0], points[:, 2], -points[:, 1])) / 1000
    receipts[str(file.relative_to(root)).replace("\\", "/")] = sha256(data)
    return points, np.asarray(faces, dtype=np.int64)


def read_member(part, member, artifacts, receipts, root):
    """Atlas-frame vertices and triangles of one registered source member."""
    derivative = artifacts / "authored-trapezius-source" / (member + ".mesh.json")
    gland = artifacts / "authored-breast-glandular" / (part + ".mesh.json")
    if derivative.exists():
        # The acquired member was refused for its topology; its authored derivative is the registered source.
        file = derivative
    elif ACQUIRED.match(member):
        file = artifacts / "compiled" / (member + ".mesh.json.gz")
    elif gland.exists():
        file = gland
    else:
        file = artifacts / "authored-other-gaps" / (part + ".mesh.json")
    data = file.read_bytes()
    mesh = json.loads(gzip.decompress(data) if file.suffix == ".gz" else data)
    receipts[str(file.relative_to(root)).replace("\\", "/")] = sha256(data)
    points = np.asarray(mesh["positions"], dtype=np.float64).reshape((-1, 3))
    faces = np.asarray(mesh["indices"], dtype=np.int64).reshape((-1, 3))
    return points, faces


def plan_members(plan):
    """Part and member of every registered mesh a compile plan names."""
    members = []
    for source in plan["rawInputs"]:
        name = source["file"].replace("\\", "/").split("/")[-1]
        if not name.endswith(".mesh.json") or "--" not in name:
            continue
        part, member = name[:-len(".mesh.json")].split("--", 1)
        members.append((part, member, source["file"]))
    return members


def read_target(file, receipts, root):
    """Neutral exterior and joint landmarks of the target body basis.

    Coordinates are the basis's canonical metres at zero shape and no pose,
    +X left, +Y up, +Z anterior, with the sagittal plane at x = 0. Vertex
    ordinals are the basis's own and are the address of every later binding.
    The last result maps each named skin point of that surface to its vertex.
    """
    data = file.read_bytes()
    body = json.loads(gzip.decompress(data))["body"]
    receipts[str(file.relative_to(root)).replace("\\", "/")] = sha256(data)
    surface = body["surfaces"][0]
    points = np.asarray(surface["positions"], dtype=np.float64).reshape((-1, 3))
    faces = np.asarray(surface["indices"], dtype=np.int64).reshape((-1, 3))
    ids = body["landmarks"]["ids"]
    positions = np.asarray(body["landmarks"]["positions"], dtype=np.float64).reshape((-1, 3))
    named = {name: int(point["vertex"]) for name, point in (body.get("skinLandmarks") or {}).items() if point["surface"] == 0}
    return body["id"], points, faces, dict(zip(ids, positions)), named


def sagittal_plane(left, right):
    """The atlas mirror plane, read from one mirrored pair of members.

    BodyParts3D supplies each left muscle as the mirror of the right one, so
    the two pairs of opposite extremes give the same plane when the pair is
    an exact mirror. Disagreement means the pair is not one, and refuses.
    """
    first = (left[:, 0].max() + right[:, 0].min()) / 2
    second = (left[:, 0].min() + right[:, 0].max()) / 2
    if abs(first - second) > 1e-6:
        raise ValueError("The chosen atlas pair is not a sagittal mirror.")
    return float((first + second) / 2)
