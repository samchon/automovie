"""How the whole skeleton is grouped for one body registration.

Two groupings are used, both read from the superseded operator packet, which
already names for every bone the segment it composes with. A fine group is
that segment: its bones move together as one body (a femur with its patella,
the thoracolumbar spine with its ribs, each phalanx alone). A coarse group
is the limb or trunk region a fine group belongs to; one harmonic weight
field per coarse group poses the atlas, so a hand has one field and not
nineteen. The right side and the midline are the authored side; a left bone
is the mirror of its right counterpart.

The packet's per-bone affine operators are not used. Only its composition
and its source and target joint spans are read, to pose the atlas like the
target before anything is matched. The coccyx is
not taken from the atlas; it is authored in the target frame.
"""
import numpy as np

from bone_registration import shortest_rotation

COARSE = ("pelvis", "trunk", "neck", "shoulder", "upperArm", "forearm", "hand", "thigh", "shank", "foot")
REPRESENTATIVE = {"pelvis": "sacrum", "trunk": "thoracolumbar", "neck": "cervical", "shoulder": "rightClavicle", "upperArm": "rightHumerus",
                  "forearm": "rightUlna", "hand": "righthandSegment", "thigh": "rightFemur", "shank": "rightTibia", "foot": "rightfootSegment"}
PARENT = {"trunk": "pelvis", "neck": "trunk", "shoulder": "trunk", "upperArm": "shoulder", "forearm": "upperArm", "hand": "forearm",
          "thigh": "pelvis", "shank": "thigh", "foot": "shank"}
MIDLINE_OWNERS = {"sacrum": "pelvis", "thoracolumbar": "trunk", "sternum": "trunk", "cervical": "neck"}
REAUTHORED = {"coccyx"}
MIRROR = np.diag([-1.0, 1.0, 1.0])


def coarse_of(owner):
    """The limb or trunk region whose weight field poses a fine group."""
    if owner in MIDLINE_OWNERS:
        return MIDLINE_OWNERS[owner]
    name = owner[5:]
    for key, region in (("Clavicle", "shoulder"), ("Humerus", "upperArm"), ("Ulna", "forearm"), ("Femur", "thigh"), ("Tibia", "shank")):
        if name == key:
            return region
    if name == "footSegment" or "Toe" in name or "Hallux" in name:
        return "foot"
    return "hand"


class BoneGroups:
    """Fine and coarse groups of the right and midline bones, with their pose spans."""

    def __init__(self, packet, plane):
        self.owner = {}
        self.record = {}
        for record in packet["transforms"]:
            bone, owner = record["bone"], record["operatorOwner"]
            if bone in REAUTHORED or bone.startswith("left"):
                continue
            self.owner[bone] = owner
            self.record.setdefault(owner, record)
        self.fine = list(dict.fromkeys(self.owner.values()))
        self.plane = np.asarray([plane, 0.0, 0.0])

    def midline(self, bone):
        return not bone.startswith("right")

    def right_origin(self, bone):
        """The right or midline bone a bone's geometry is authored from, or None."""
        if bone in self.owner:
            return bone
        if bone.startswith("left") and "right" + bone[4:] in self.owner:
            return "right" + bone[4:]
        return None

    def span(self, owner):
        """Atlas and target joint spans of a group, atlas side sagittally centred."""
        record = self.record[owner]
        source = [np.asarray(record["sourceSpan"][key]) - self.plane for key in ("startMetres", "endMetres")]
        target = [np.asarray(record["targetSpan"][key]) for key in ("startMetres", "endMetres")]
        return source, target

    def rotation(self, owner):
        """The least rotation taking a group's atlas span direction to its target one.

        The packet's own operators also fix a roll about each span from named
        references, and for the shank that roll turns the bone half a turn
        about its axis. A pose only needs the segment to point the right way,
        so the atlas keeps the torsion it has; the exterior correspondence
        settles what remains. A midline group keeps the sagittal plane.
        """
        source, target = self.span(owner)
        if owner in MIDLINE_OWNERS:
            # A midline span is either lateral, which a symmetric pose leaves alone, or sagittal.
            source = [point * np.asarray([0.0, 1.0, 1.0]) for point in source]
            target = [point * np.asarray([0.0, 1.0, 1.0]) for point in target]
            if np.linalg.norm(source[1] - source[0]) < 1e-6 or np.linalg.norm(target[1] - target[0]) < 1e-6:
                return np.eye(3)
        return shortest_rotation(source[1] - source[0], target[1] - target[0])

    def pose(self, size):
        """Placement of each coarse group that poses the atlas like the target.

        Every region turns by its representative group's rotation under the
        one given size. The pelvis is rooted where the target's hip span
        lies; every other region starts where its parent region put the
        atlas point its own joint span starts from, so the posed atlas stays
        one connected body from the pelvis out to the hands and feet. The
        target spans come from the rig, whose landmarks are skinning pivots:
        only the root place and the directions are taken from them, and no
        bone is sized or placed by this pose.
        """
        placements = {}
        for region in COARSE:
            owner = REPRESENTATIVE[region]
            source, target = self.span(owner)
            linear = size * self.rotation(owner)
            if region == "pelvis":
                translation = (target[0] + target[1]) / 2 - linear @ ((source[0] + source[1]) / 2)
            else:
                parent_linear, parent_translation = placements[PARENT[region]]
                translation = parent_linear @ source[0] + parent_translation - linear @ source[0]
            if owner in MIDLINE_OWNERS:
                translation[0] = 0.0
            placements[region] = (linear, translation)
        return placements

    def size(self):
        """One size for the whole atlas: target leg length over atlas leg length."""
        lengths = [[np.linalg.norm(end - start) for start, end in self.span(owner)] for owner in ("rightFemur", "rightTibia")]
        return float((lengths[0][1] + lengths[1][1]) / (lengths[0][0] + lengths[1][0]))
