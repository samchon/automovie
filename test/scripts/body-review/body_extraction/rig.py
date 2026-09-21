"""Joint landmarks, the VRM bone mapping, anatomical frames and clinical limits.

MPFB defines each game_engine bone by two joint cubes: eight helper vertices
whose centroid is the joint. Those helpers move with every body target, which
is what makes the joints follow the shape. The basis keeps that property by
publishing every `joint-*` cube centroid as a landmark with sparse endpoint
deltas, and by describing each bone as a pair of landmark ids rather than as a
fixed position. The builder recomputes the joint positions from the deformed
landmarks and derives the rest skeleton from them.

The 52 non-root bones of `rig.game_engine.json` map one to one onto the VRM
humanoid slots that `AutoMovieHumanoidBone` closes over (eyes and jaw belong
to the face). The mapping table below is the one hand-written correspondence
in the extraction; head and tail cubes are read from the rig file.

Bone frames follow one rule so the builder needs no anatomy: local Y is the
bone direction (head to tail), local X is the flexion axis chosen so that a
positive flexion swings the bone toward its anatomical flexion direction `F`
(`X = Y x F`, since a rotation about X moves Y toward `X x Y`), and Z = X x Y.
That matches the engine's `DEFAULT_JOINT_AXES` (flexion X, abduction Z, twist
Y). With a proper right-handed frame the abduction and twist senses are then
fixed by F, so the clinical sign of each is measured here and stored on the
joint for the builder to pass as an `IAutoMovieRestFrame`: abduction positive
must move the bone away from the midline (or toward the thumb for the wrist),
and external rotation must carry the anterior surface laterally (supination
turns the palm forward).

The rest pose is not the clinical zero. The source stands in an A-pose with
the arms 42 degrees out from the trunk and the elbows already bent about 43
degrees, so a clinical "abduction 180" must be measured from the anatomical
position, not from the rest. Each joint therefore also records the clinical
angle its rest direction sits at (`neutral`), measured in the frame of the
joint's anatomical zero direction: down for the hanging upper arm, the
parent's direction for the elbow, wrist and fingers, and the relaxed standing
rest itself for the trunk, neck, hip, knee, ankle and toes, which is what
goniometry takes as zero. The builder
hands these to the engine as the rest frame's neutral, which is what the
engine's own canonical T-pose table does for its shoulders. A one-axis rest
(elbow, knee, the A-pose shoulder) is exact; a rest that mixes flexion and
abduction (the hip, a few degrees) is decomposed in the engine's own order.

Ranges come from the T1 record (`references-receipt.json`): 38 CFR 4.71 first,
the AAOS values quoted in #2519 where the regulation is silent, the engine's
own fallback where no clinical figure was pinned (shoulder girdle, foot
inversion, toes, finger phalanges). A spine chain's clinical total is split
equally across its segments because nothing better is pinned; the receipt
names that rule.
"""
import json
import math
import os

import numpy as np

from .session import MPFB_DATA, ROOT

RECEIPT = os.path.join(ROOT, "test", "studies", "human-body", "references-receipt.json")

# VRM slot -> MPFB game_engine bone.
BONES = {
    "hips": "pelvis", "spine": "spine_01", "chest": "spine_02", "upperChest": "spine_03",
    "neck": "neck_01", "head": "head",
}
for side, suffix in (("left", "_l"), ("right", "_r")):
    up = side[:1].upper() + side[1:]
    BONES.update({
        f"{side}Shoulder": "clavicle" + suffix, f"{side}UpperArm": "upperarm" + suffix,
        f"{side}LowerArm": "lowerarm" + suffix, f"{side}Hand": "hand" + suffix,
        f"{side}UpperLeg": "thigh" + suffix, f"{side}LowerLeg": "calf" + suffix,
        f"{side}Foot": "foot" + suffix, f"{side}Toes": "ball" + suffix,
        f"{side}ThumbMetacarpal": "thumb_01" + suffix, f"{side}ThumbProximal": "thumb_02" + suffix,
        f"{side}ThumbDistal": "thumb_03" + suffix,
    })
    for finger, mpfb in (("Index", "index"), ("Middle", "middle"), ("Ring", "ring"), ("Little", "pinky")):
        BONES[f"{side}{finger}Proximal"] = f"{mpfb}_01{suffix}"
        BONES[f"{side}{finger}Intermediate"] = f"{mpfb}_02{suffix}"
        BONES[f"{side}{finger}Distal"] = f"{mpfb}_03{suffix}"

ANTERIOR, POSTERIOR, SUPERIOR = np.array([0.0, 0.0, 1.0]), np.array([0.0, 0.0, -1.0]), np.array([0.0, 1.0, 0.0])


def landmark_groups():
    """`joint-*` vertex ranges of the base mesh, in file order."""
    with open(os.path.join(MPFB_DATA, "mesh_metadata", "basemesh_vertex_groups.json"), encoding="utf-8") as file:
        groups = json.load(file)
    return {name: ranges for name, ranges in groups.items() if name.startswith("joint-")}


def landmark_positions(helpers, groups, offset):
    """Centroid of each joint cube from a helper sample, in the face frame."""
    out = {}
    for name, ranges in groups.items():
        rows = np.concatenate([np.arange(a, b + 1) for a, b in ranges])
        centroid = helpers[rows].mean(axis=0)
        out[name] = np.array([centroid[0], centroid[2] - offset, -centroid[1]])
    return out


def rig_cubes():
    """VRM slot -> (parent slot or None, head cube, tail cube) from rig.game_engine.json."""
    with open(os.path.join(MPFB_DATA, "rigs", "standard", "rig.game_engine.json"), encoding="utf-8") as file:
        rig = json.load(file)
    mpfb_to_slot = {mpfb: slot for slot, mpfb in BONES.items()}
    out = {}
    for slot, mpfb in BONES.items():
        bone = rig[mpfb]
        if bone["head"]["strategy"] != "CUBE" or bone["tail"]["strategy"] != "CUBE":
            raise ValueError(f"{mpfb} is not defined by joint cubes")
        parent = mpfb_to_slot.get(bone["parent"])
        out[slot] = (parent, bone["head"]["cube_name"], bone["tail"]["cube_name"])
    return out


def unit(vector):
    return vector / np.linalg.norm(vector)


def hand_directions(landmarks, side):
    """Palmar direction and radial direction of one hand from its knuckle cubes.

    The dorsal normal is the one of the two palm-plane normals that points away
    from the thumb's proximal cube, because the thumb rests on the palmar side
    of the hand plane in the source pose.
    """
    s = "l" if side == "left" else "r"
    wrist = landmarks[f"joint-{s}-hand"]
    index, middle, little = (landmarks[f"joint-{s}-finger-{k}-1"] for k in (2, 3, 5))
    thumb = landmarks[f"joint-{s}-finger-1-2"]
    radial = unit(index - little)
    distal = unit(middle - wrist)
    normal = unit(np.cross(distal, radial))
    if np.dot(thumb - wrist, normal) > 0:
        normal = -normal
    return -normal, radial, unit(little - thumb)


def anatomy(slot, landmarks):
    """Flexion direction F, desired abduction direction (or None), desired twist rule (or None)."""
    side = "left" if slot.startswith("left") else "right" if slot.startswith("right") else None
    lateral = np.array([1.0 if side == "left" else -1.0, 0.0, 0.0]) if side else np.array([1.0, 0.0, 0.0])
    if side is None:
        return ANTERIOR, lateral, ("surface", lateral)
    palmar, radial, across = hand_directions(landmarks, side)
    if slot.endswith("Shoulder") or slot.endswith("UpperArm") or slot.endswith("UpperLeg"):
        return ANTERIOR, lateral, ("surface", lateral)
    if slot.endswith("LowerArm"):
        # The elbow folds in the plane of the arm: toward the shoulder.
        s_ = "l" if side == "left" else "r"
        toward_shoulder = unit(landmarks[f"joint-{s_}-shoulder"] - landmarks[f"joint-{s_}-elbow"])
        return toward_shoulder, None, ("palm", palmar)
    if slot.endswith("Hand"):
        return palmar, radial, None
    if slot.endswith("LowerLeg"):
        return POSTERIOR, None, None
    if slot.endswith("Foot"):
        return SUPERIOR, lateral, None
    if slot.endswith("Toes"):
        return SUPERIOR, None, None
    if "Thumb" in slot:
        return across, None, None
    return palmar, None, None


def frame(head, tail, reference):
    """Local basis (X, Y, Z) for a bone from its ends and its flexion reference."""
    y = unit(tail - head)
    f = reference - np.dot(reference, y) * y
    if np.linalg.norm(f) < 1e-6:
        raise ValueError("The flexion reference is parallel to the bone")
    f = unit(f)
    x = np.cross(y, f)
    z = np.cross(x, y)
    return x, y, z


def zero_direction(slot, landmarks, head, tail, parent):
    """The bone direction at the clinical zero, in the neutral's frame.

    Clinical goniometry takes the relaxed standing posture as zero for the
    trunk, neck, hip, knee, ankle and toes, so those joints rest at zero here
    (the source stands flat on the ground with its stance's own lordosis and
    knee set). The upper limb is the exception the A-pose forces: the arms
    hang 42 degrees out and the elbows are bent, so the shoulder, elbow, wrist
    and fingers measure their rest against the anatomical position (arm down,
    forearm and hand straight along their parent).
    """
    if slot.endswith("UpperArm"):
        return -SUPERIOR
    if slot.endswith("LowerArm") or slot.endswith("Hand") or any(
        finger in slot for finger in ("Index", "Middle", "Ring", "Little", "ThumbProximal", "ThumbDistal")
    ):
        return unit(landmarks[parent[2]] - landmarks[parent[1]])
    # Trunk, neck, head, clavicle, hip, knee, foot, toes and the thumb's
    # carpometacarpal joint: the rest is the zero.
    return unit(tail - head)


def neutral_angles(slot, landmarks, head, tail, parent, reference, abduction_sign):
    """Clinical flexion and abduction of the rest direction, in the zero frame.

    The engine composes flexion about X, then abduction about Z, so a bone at
    flexion a and abduction b points at (-sin b cos a, cos b cos a, sin a) in
    the zero frame; the rest direction is read back through that map.
    """
    zero = zero_direction(slot, landmarks, head, tail, parent)
    # The fold axis is the rest frame's X (a straight elbow has no fold plane
    # of its own, so the rest pose lends it one), made perpendicular to zero.
    x_rest, _y_rest, _z_rest = frame(head, tail, reference)
    x0 = unit(x_rest - np.dot(x_rest, zero) * zero)
    y0 = zero
    z0 = np.cross(x0, y0)
    d = unit(tail - head)
    dz, dx = float(np.dot(d, z0)), float(np.dot(d, x0))
    a = math.degrees(math.asin(max(-1.0, min(1.0, dz))))
    cos_a = math.cos(math.radians(a))
    b = 0.0 if abs(cos_a) < 1e-9 else math.degrees(math.asin(max(-1.0, min(1.0, -dx / cos_a))))
    return {"flexion": round(a, 4), "abduction": round(b * (abduction_sign or 1), 4), "twist": 0.0}


def signs(slot, landmarks, head, tail):
    """Measured clinical signs for abduction and twist under the frame rule."""
    reference, abduction_toward, twist_rule = anatomy(slot, landmarks)
    x, y, z = frame(head, tail, reference)
    result = {"flexion": 1}
    # A positive rotation about Z moves Y toward Z x Y = -X.
    result["abduction"] = None if abduction_toward is None else int(np.sign(np.dot(-x, abduction_toward)) or 1)
    if twist_rule is None:
        result["twist"] = None
    else:
        kind, vector = twist_rule
        # A positive rotation about Y moves a vector v toward Y x v.
        moving = unit(reference - np.dot(reference, y) * y) if kind == "surface" else unit(vector - np.dot(vector, y) * y)
        toward = vector if kind == "surface" else ANTERIOR
        result["twist"] = int(np.sign(np.dot(np.cross(y, moving), toward)) or 1)
    return reference, result


def _range(low, high):
    return {"min": float(low), "max": float(high)}


def constraints():
    """VRM slot -> (constraint, source note) from the pinned clinical record."""
    with open(RECEIPT, encoding="utf-8") as file:
        rom = json.load(file)["rangeOfMotion"]
    primary, secondary = rom["primary"]["values"], rom["secondary"]["values"]
    out = {}
    thoraco, cervical = primary["thoracolumbarSpine"], primary["cervicalSpine"]
    for slot in ("spine", "chest", "upperChest"):
        out[slot] = ({
            "flexion": _range(-thoraco["extension"][1] / 3, thoraco["forwardFlexion"][1] / 3),
            "abduction": _range(-thoraco["lateralFlexionEachSide"][1] / 3, thoraco["lateralFlexionEachSide"][1] / 3),
            "twist": _range(-thoraco["rotationEachSide"][1] / 3, thoraco["rotationEachSide"][1] / 3),
        }, "38 CFR 4.71a Note (2) thoracolumbar totals split equally over three segments")
    for slot in ("neck", "head"):
        out[slot] = ({
            "flexion": _range(-cervical["extension"][1] / 2, cervical["forwardFlexion"][1] / 2),
            "abduction": _range(-cervical["lateralFlexionEachSide"][1] / 2, cervical["lateralFlexionEachSide"][1] / 2),
            "twist": _range(-cervical["rotationEachSide"][1] / 2, cervical["rotationEachSide"][1] / 2),
        }, "38 CFR 4.71a Note (2) cervical totals split equally over two segments")
    out["hips"] = (None, "root; its orientation is the pose root, not a joint range")
    # 38 CFR 4.71a, digits II-V note (1): MCP 0-90, PIP 0-100, DIP 0-70 or 80
    # (the larger figure taken). Hyperextension is not in the schedule; the
    # engine table's 20 is kept at the MCP and 10 at the DIP, below the AAOS
    # normals (45 and 20), and the PIP does not hyperextend. The thumb is not
    # given angles by the schedule (it is rated by the gap to the fingers), so
    # its three joints take the AAOS normals: CMC flexion 15 / extension 20,
    # MCP flexion 60 / extension 10, IP flexion 80 / extension 20. The first
    # revision gave every phalanx the generic -20..100, which let the thumb
    # metacarpal fold 100 degrees through the palm, a pose no thumb reaches.
    digits = {
        "Proximal": ({"flexion": _range(-20, 90), "abduction": None, "twist": None}, "38 CFR 4.71a digits II-V note (1) MCP 0-90; hyperextension 20 from the engine table"),
        "Intermediate": ({"flexion": _range(0, 100), "abduction": None, "twist": None}, "38 CFR 4.71a digits II-V note (1) PIP 0-100"),
        "Distal": ({"flexion": _range(-10, 80), "abduction": None, "twist": None}, "38 CFR 4.71a digits II-V note (1) DIP 0-80; hyperextension 10 from the engine table"),
    }
    thumb = {
        "ThumbMetacarpal": ({"flexion": _range(-20, 15), "abduction": None, "twist": None}, "AAOS thumb CMC flexion 15, extension 20; palmar and radial abduction not yet driven (held)"),
        "ThumbProximal": ({"flexion": _range(-10, 60), "abduction": None, "twist": None}, "AAOS thumb MCP flexion 60, extension 10"),
        "ThumbDistal": ({"flexion": _range(-20, 80), "abduction": None, "twist": None}, "AAOS thumb IP flexion 80, extension 20"),
    }
    for side in ("left", "right"):
        # AAOS shoulder girdle: elevation 40, depression 10; protraction and
        # retraction keep the engine table's figures because the sign of this
        # frame's flexion against protraction is not pinned. The engine's
        # depression of 30 drove the hanging arm 5 cm into the chest wall, a
        # pose no shoulder girdle reaches.
        out[f"{side}Shoulder"] = ({"flexion": _range(-15, 30), "abduction": _range(-10, 40), "twist": None}, "AAOS shoulder girdle elevation 40 / depression 10; protraction and retraction from the engine table, sign unpinned")
        out[f"{side}UpperArm"] = ({
            "flexion": _range(-secondary["shoulder"]["extension"][1], primary["shoulder"]["forwardElevation"][1]),
            # Adduction past the hanging arm is measured clinically with the
            # arm carried in front of the trunk; in the coronal plane alone,
            # which is the only plane a single-axis range describes, the arm
            # can only press against the side of the chest. The range stops
            # at 10 degrees of that pressing; the coupled adduction-with-
            # flexion path is not modelled and is recorded as a limit.
            "abduction": _range(-10, primary["shoulder"]["abduction"][1]),
            "twist": _range(-primary["shoulder"]["internalRotation"][1], primary["shoulder"]["externalRotation"][1]),
            "swingDeg": 180,
        }, "38 CFR 4.71 Plate I; extension AAOS; adduction limited to 10 in the coronal plane (crossing the trunk needs flexion, not modelled); swing headroom from the engine table")
        out[f"{side}LowerArm"] = ({
            "flexion": _range(0, primary["elbow"]["flexion"][1]),
            "abduction": None,
            "twist": _range(-primary["forearm"]["pronation"][1], primary["forearm"]["supination"][1]),
        }, "38 CFR 4.71 Plate I")
        out[f"{side}Hand"] = ({
            "flexion": _range(-primary["wrist"]["dorsiflexion"][1], primary["wrist"]["palmarFlexion"][1]),
            "abduction": _range(-primary["wrist"]["ulnarDeviation"][1], primary["wrist"]["radialDeviation"][1]),
            "twist": None,
        }, "38 CFR 4.71 Plate I")
        out[f"{side}UpperLeg"] = ({
            "flexion": _range(-secondary["hip"]["extension"][1], primary["hip"]["flexion"][1]),
            # The same coronal-plane reading as the shoulder: a thigh can press
            # against the other thigh but crosses it only with flexion.
            "abduction": _range(-10, primary["hip"]["abduction"][1]),
            "twist": _range(-secondary["hip"]["internalRotation"][1], secondary["hip"]["externalRotation"][1]),
            "swingDeg": primary["hip"]["flexion"][1],
        }, "38 CFR 4.71 Plate II; extension and rotation AAOS; adduction limited to 10 in the coronal plane (crossing the other thigh needs flexion, not modelled); the swing cone equals the pinned flexion so every pure-plane clinical maximum stays admissible (the engine table's 120 sat below the 125 flexion and refused it)")
        out[f"{side}LowerLeg"] = ({"flexion": _range(0, primary["knee"]["flexion"][1]), "abduction": None, "twist": None}, "38 CFR 4.71 Plate II")
        out[f"{side}Foot"] = ({
            "flexion": _range(-primary["ankle"]["plantarFlexion"][1], primary["ankle"]["dorsiflexion"][1]),
            "abduction": _range(-25, 25),
            "twist": None,
        }, "38 CFR 4.71 Plate II; inversion/eversion from the engine table")
        # AAOS first metatarsophalangeal joint: extension (dorsiflexion) 70,
        # flexion 45; the positive direction of this frame is dorsiflexion.
        out[f"{side}Toes"] = ({"flexion": _range(-45, 70), "abduction": None, "twist": None}, "AAOS MTP extension 70 (positive here) / flexion 45")
        for slot in BONES:
            if not slot.startswith(side):
                continue
            if "Thumb" in slot:
                out[slot] = thumb[slot[len(side):]]
            elif any(f in slot for f in ("Index", "Middle", "Ring", "Little")):
                out[slot] = digits[next(k for k in digits if slot.endswith(k))]
    return out
