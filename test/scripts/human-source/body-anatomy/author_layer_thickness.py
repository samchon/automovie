"""Author the default skin and subcutaneous thickness field of a body basis.

From the repository root:
  python test/scripts/human-source/body-anatomy/author_layer_thickness.py BODY_VIEW OUTPUT

The field gives, at every native skin vertex of the target body basis, the
thickness of the skin (epidermis and dermis) and of the subcutaneous fat
beneath it, in metres. The package derives the dermal and fascial faces from
it; the registration producer maps the atlas's deep tissue under the fascial
face. The registration needs this field as an input: the subcutaneous
thickness of a target body cannot be read off a transfer that itself has to
know where the fat ends.

No source measures the whole skin of the population this body is authored
for. The values are therefore authored, tied to published measurements at
the few sites that have them:

- Each rig segment takes one value per layer. A vertex takes the blend of
  its segments' values by its own skin weights, so the field is as smooth as
  the skin's own deformation and has no seam at a joint.
- On the trunk, anterior and posterior values are blended by the forward
  component of the outward skin normal.
- Subcutaneous segment values are the segment means of Stoerchle et al.
  2018: ten men aged 20 to 31. Skin values at the abdomen and thigh are the
  dermis means of Derraik et al. 2014, averaged over its men and women, all
  of them adults with diabetes. Every other skin value is the mean thickness
  of the atlas individual's own skin shell, an authored choice.

Only at an anchor's site and for its population is a value a measurement.
Women, older adults, other body compositions and every site between anchors
are not measured by these sources: the field is authored there and makes no
claim about them. Nothing here is fitted to a wanted volume or a render.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[4]
ARTIFACTS = ROOT / ".wiki/08-campaigns/2707-human/artifacts"

STOERCHLE = ("Stoerchle, Mueller, Sengeis, Lackner, Holasek, Fuerhapter-Rieger, 2018, Scientific Reports 8: "
             "Measurement of mean subcutaneous fat thickness: eight standardised ultrasound sites compared to 216 randomly selected sites")
STOERCHLE_PROTOCOL = ("B-mode ultrasound thickness of subcutaneous adipose tissue with embedded fibrous structures included; "
                      "mean over randomly placed sites of one body segment (Lund and Browder segments), participants lying")
STOERCHLE_POPULATION = "10 men, 20 to 31 years, BMI 20.0 to 28.4; no women, no older adults"
DERRAIK = ("Derraik, Rademaker, Cutfield, Pinto, Tregurtha, Faherty, Peart, Drury et al., 2014, PLoS ONE 9(1) e86637: "
           "Effects of Age, Gender, BMI, and Anatomical Site on Skin Thickness in Children and Adults with Diabetes")
DERRAIK_PROTOCOL = "Ultrasound dermal thickness with a linear array transducer; model-adjusted means of men (n=61) and women (n=79) averaged with equal weight"
DERRAIK_POPULATION = "140 adults with type 1 or type 2 diabetes, 20 to 85 years; not a healthy reference sample"
ATLAS = "Authored: mean distance between the outer and inner sheets of the BodyParts3D skin FJ2810 (shell volume over outer area)"
ATLAS_POPULATION = "one male atlas individual; an authored default, not a population value"

# Subcutaneous segment means in millimetres (Stoerchle et al. 2018, table 5, fibrous structures included).
SUBCUTANEOUS = {"neck": 1.50, "anteriorTrunk": 4.69, "posteriorTrunk": 3.76, "upperArm": 3.00, "forearm": 1.15,
                "hand": 0.33, "buttocks": 12.04, "thigh": 5.72, "leg": 2.80, "foot": 0.39, "head": 1.27}
# Skin thickness in millimetres: measured dermis at two sites, the atlas shell mean elsewhere.
SKIN = {"trunk": (2.10 + 1.99) / 2, "thigh": (1.89 + 1.65) / 2, "elsewhere": 1.9}


def segment_of(joint):
    """The measured body segment a rig joint's skin belongs to."""
    name = joint[4:] if joint.startswith("left") else joint[5:] if joint.startswith("right") else joint
    name = name[0].lower() + name[1:]
    if name == "hips":
        return "pelvis"
    if name in ("spine", "chest", "upperChest", "shoulder"):
        return "trunk"
    if name in ("neck", "head", "upperArm", "foot"):
        return name
    if name == "lowerArm":
        return "forearm"
    if name == "upperLeg":
        return "thigh"
    if name == "lowerLeg":
        return "leg"
    if name == "toes" or "Toe" in joint or "Hallux" in joint:
        return "foot"
    return "hand"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("body_view", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ARTIFACTS):
        raise ValueError("Layer field candidates belong under the campaign artifacts.")
    output.mkdir(parents=True, exist_ok=True)
    view_bytes = args.body_view.read_bytes()
    body = json.loads(gzip.decompress(view_bytes))["body"]
    surface = body["surfaces"][0]
    points = np.asarray(surface["positions"], dtype=np.float64).reshape((-1, 3))
    faces = np.asarray(surface["indices"], dtype=np.int64).reshape((-1, 3))
    skin = surface["skin"]
    slots = len(skin["boneIndices"]) // len(points)
    bones = np.asarray(skin["boneIndices"], dtype=np.int64).reshape((len(points), slots))
    weights = np.asarray(skin["weights"], dtype=np.float64).reshape((len(points), slots))
    if np.any(np.abs(weights.sum(axis=1) - 1) > 1e-6):
        raise ValueError("Skin weights must sum to one to blend segment values.")
    area = np.cross(points[faces[:, 1]] - points[faces[:, 0]], points[faces[:, 2]] - points[faces[:, 0]])
    normals = np.zeros_like(points)
    for corner in range(3):
        np.add.at(normals, faces[:, corner], area)
    normals /= np.linalg.norm(normals, axis=1)[:, None]
    front = np.clip((normals[:, 2] + 1) / 2, 0, 1)
    segments = [segment_of(joint) for joint in skin["joints"]]
    fat_front = np.asarray([{"pelvis": SUBCUTANEOUS["anteriorTrunk"], "trunk": SUBCUTANEOUS["anteriorTrunk"]}.get(name, SUBCUTANEOUS.get(name)) for name in segments])
    fat_back = np.asarray([{"pelvis": SUBCUTANEOUS["buttocks"], "trunk": SUBCUTANEOUS["posteriorTrunk"]}.get(name, SUBCUTANEOUS.get(name)) for name in segments])
    skin_value = np.asarray([SKIN["trunk"] if name in ("pelvis", "trunk") else SKIN.get(name, SKIN["elsewhere"]) for name in segments])
    subcutaneous = (weights * (front[:, None] * fat_front[bones] + (1 - front[:, None]) * fat_back[bones])).sum(axis=1) / 1000
    dermal = (weights * skin_value[bones]).sum(axis=1) / 1000
    anchors = [{"layer": "subcutaneous", "site": site, "metres": value / 1000, "kind": "measured", "source": STOERCHLE,
                "protocol": STOERCHLE_PROTOCOL, "population": STOERCHLE_POPULATION} for site, value in SUBCUTANEOUS.items()]
    anchors += [{"layer": "skin", "site": site, "metres": SKIN[key] / 1000, "kind": "measured", "source": DERRAIK,
                 "protocol": DERRAIK_PROTOCOL, "population": DERRAIK_POPULATION} for site, key in (("abdomen", "trunk"), ("thigh", "thigh"))]
    anchors.append({"layer": "skin", "site": "every segment other than trunk and thigh", "metres": SKIN["elsewhere"] / 1000, "kind": "authored",
                    "source": ATLAS, "protocol": "Geometric mean thickness of one modelled skin shell, not a tissue measurement", "population": ATLAS_POPULATION})
    field = {
        "basis": body["id"], "skinMetres": dermal.tolist(), "subcutaneousMetres": subcutaneous.tolist(), "anchors": anchors,
        "qualification": "Authored default. Each rig segment takes its anchor's value and a vertex blends its segments by its own skin weights; trunk values blend "
                         "anterior and posterior by the outward normal. A value is a measurement only at its anchor's site for its anchor's population. Women, older "
                         "adults, other body compositions and all sites between anchors are unmeasured by these sources and unknown; the field describes no individual.",
    }
    field_bytes = json.dumps(field, separators=(",", ":"), allow_nan=False).encode()
    (output / "layer-thickness-field.json").write_bytes(field_bytes)
    by_segment = {}
    dominant = np.asarray(segments)[bones[np.arange(len(points)), weights.argmax(axis=1)]]
    for name in sorted(set(segments)):
        chosen = dominant == name
        if chosen.any():
            by_segment[name] = {"vertices": int(chosen.sum()), "skinMetres": [float(dermal[chosen].min()), float(dermal[chosen].max())],
                                "subcutaneousMetres": [float(subcutaneous[chosen].min()), float(subcutaneous[chosen].max())]}
    receipt = {"fieldSha256": hashlib.sha256(field_bytes).hexdigest(), "bodyViewSha256": hashlib.sha256(view_bytes).hexdigest(), "basis": body["id"],
               "producerSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "vertices": int(len(points)), "byDominantSegment": by_segment}
    (output / "layer-thickness-receipt.json").write_text(json.dumps(receipt, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(receipt["byDominantSegment"]))


if __name__ == "__main__":
    main()
