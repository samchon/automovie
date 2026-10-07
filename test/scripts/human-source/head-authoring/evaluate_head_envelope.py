"""Author one complete shared craniofacial/cervical source envelope.

The consumer is the hybrid head source batch, before nasal section insertion,
ear section composition, shared-root cutting and all derivative publication.
It accepts named source-neutral dimensional differences; its smooth chart is
an explicit geometric convention, not an anthropometric inverse or tissue
simulation. Controls act on the licensed full neutral and its joint references
through the same function. In particular neck length never moves skin without
the source head attachment. The head/body cut is not a second chart boundary.
No source mean, free caller curve or unknown personal dimension is supplied.
"""

from dataclasses import asdict
import numpy as np
from CranialEnvelope import CranialEnvelope
from CervicalEnvelope import CervicalEnvelope
from FacialEnvelope import FacialEnvelope


def evaluate_head_envelope(positions, joints, source, guide, request, neck_fields):
    """Evaluate one source state in memory; inputs stay unchanged."""
    cranial = CranialEnvelope(**request["cranial"])
    facial = FacialEnvelope(**request["facial"])
    cervical = CervicalEnvelope(**request["cervical"])
    if not all(np.isfinite(list(asdict(group).values())).all() for group in (cranial, facial, cervical)):
        raise ValueError("Head source dimensions must be finite; caller values are not clamped.")
    native = guide["headNativeIds"]
    def landmark(name):
        index = guide["landmarkNativeIds"][name]
        if index < 0 or index >= len(positions):
            raise ValueError("Head envelope needs an exact native landmark: " + name)
        return positions[index]
    glabella, menton = landmark("glabella"), landmark("menton")
    subnasale, cheilion = landmark("subnasale"), landmark("cheilion-left")
    tragion = landmark("tragion-left")
    head_ids = [index for index in native if index < len(positions)]
    head = positions[head_ids]
    posterior = float(head[:, 1].max())
    superior = float(head[:, 2].max())
    neck = joints[source["landmarkIds"].index("joint-neck")]
    clavicle = joints[source["landmarkIds"].index("joint-l-clavicle")]
    radius = abs(float(tragion[0]))
    if superior <= glabella[2] or posterior <= glabella[1] or radius <= 0 or menton[2] <= clavicle[2]:
        raise ValueError("Head source supports do not form positive anatomical chart intervals.")
    head_joint = source["landmarkIds"].index("joint-head")
    neck_joint = source["landmarkIds"].index("joint-neck")
    requested_span = cervical.cervicalJointSpanOffsetMillimetres / 1000
    endpoint_name = "neck/measure-neck-height-" + ("incr" if requested_span >= 0 else "decr")
    endpoint = next(state for state in source["states"] if state["name"] == endpoint_name)
    vertex_ids, vertex_delta, landmark_delta = neck_fields[endpoint_name]
    endpoint_span = float(landmark_delta[head_joint, 2] - landmark_delta[neck_joint, 2])
    if endpoint_span == 0 or not np.isfinite(endpoint_span):
        raise ValueError("Licensed cervical endpoint has no finite source-joint axial span.")
    neck_scale = requested_span / endpoint_span
    if neck_scale < 0 or neck_scale > 1:
        raise ValueError("Requested cervical joint-span difference exceeds the licensed source endpoint envelope.")
    skin_neck_delta = np.zeros_like(positions)
    skin_neck_delta[vertex_ids] = vertex_delta
    def step(value):
        # This clamps a compact support weight, never an authoring value.
        t = np.clip(value, 0, 1)
        return t * t * (3 - 2 * t)
    def band(value, lower, upper):
        t = np.clip((value - lower) / (upper - lower), 0, 1)
        return 16 * t * t * (1 - t) * (1 - t)
    def evaluate(points, whole_neck_delta):
        result = points.copy()
        x, y, z = points.T
        lateral = np.sign(x)
        above = step((z - glabella[2]) / (superior - glabella[2]))
        back = step((y - glabella[1]) / (posterior - glabella[1]))
        front = 1 - back
        high = step((z - neck[2]) / (glabella[2] - neck[2]))
        result[:, 0] += lateral * cranial.vaultBreadthOffsetMillimetres / 2000 * above
        result[:, 2] += cranial.vaultHeightOffsetMillimetres / 1000 * above
        result[:, 1] += cranial.occipitalProjectionOffsetMillimetres / 1000 * back * high
        lean = np.tan(np.deg2rad(cranial.foreheadInclinationOffsetDegrees))
        result[:, 1] -= lean * np.maximum(z - glabella[2], 0) * above * front
        temporal = band(z, subnasale[2], glabella[2]) * step(np.abs(x) / radius)
        result[:, 0] += lateral * cranial.temporalBreadthOffsetMillimetres / 2000 * temporal
        cheek_x = band(np.abs(x), abs(cheilion[0]), radius)
        malar = band(z, subnasale[2], glabella[2]) * cheek_x * front
        buccal = band(z, cheilion[2], subnasale[2]) * cheek_x * front
        jaw = band(z, menton[2], cheilion[2]) * step(np.abs(x) / radius) * front
        malar_value = np.where(x >= 0, facial.leftMalarProjectionOffsetMillimetres, facial.rightMalarProjectionOffsetMillimetres)
        hollow_value = np.where(x >= 0, facial.leftBuccalHollowOffsetMillimetres, facial.rightBuccalHollowOffsetMillimetres)
        jaw_value = np.where(x >= 0, facial.leftMandibularBreadthOffsetMillimetres, facial.rightMandibularBreadthOffsetMillimetres)
        result[:, 1] += (hollow_value * buccal - malar_value * malar) / 1000
        result[:, 0] += lateral * jaw_value * jaw / 1000
        chin = band(z, neck[2], cheilion[2]) * (1 - step(np.abs(x) / abs(cheilion[0]))) * front
        result[:, 1] -= facial.chinProjectionOffsetMillimetres / 1000 * chin
        result[:, 2] -= facial.chinHeightOffsetMillimetres / 1000 * chin
        radial = np.hypot(x, y - neck[1])
        neck_local = 1 - step(radial / radius)
        throat = band(z, clavicle[2], menton[2]) * neck_local
        anterior = step((neck[1] - y) / radius)
        posterior_weight = step((y - neck[1]) / radius)
        result[:, 1] += (cervical.posteriorFullnessOffsetMillimetres * posterior_weight -
                           cervical.anteriorFullnessOffsetMillimetres * anterior) / 1000 * throat
        submental = band(z, neck[2], subnasale[2]) * neck_local * anterior
        result[:, 1] -= cervical.cervicomentalProjectionOffsetMillimetres / 1000 * submental
        result += neck_scale * whole_neck_delta
        return result
    shaped = evaluate(positions, skin_neck_delta)
    shaped_joints = evaluate(joints, landmark_delta)
    if not np.isfinite(shaped).all() or not np.isfinite(shaped_joints).all():
        raise ValueError("The requested head source dimensions produce nonfinite geometry.")
    record = {
        "schema": "automovie-authored-head-envelope/1", "stage": "shared exterior source authoring",
        "basis": guide["basis"],
        "recipe": request, "frame": "Blender metres, +X left, +Z up, -Y anterior",
        "supports": {"glabella": glabella.tolist(), "menton": menton.tolist(), "subnasale": subnasale.tolist(),
                     "cheilionLeft": cheilion.tolist(), "tragionLeft": tragion.tolist(),
                     "jointNeck": neck.tolist(), "leftClavicle": clavicle.tolist()},
        "qualification": "smooth source-envelope chart, not bone/fat reconstruction, measured clinical angle or population range",
        "cervicalJointSpan": {"sourceEndpoint": endpoint_name, "sourceRecipe": endpoint["recipe"],
                               "definition": "joint-head minus joint-neck Blender Z; neither clinical neck height nor girth",
                               "endpointDifferenceMillimetres": endpoint_span * 1000, "endpointFraction": neck_scale},
        "affectedNativeVertices": int(np.any(shaped != positions, axis=1).sum()),
        "affectedSourceJoints": int(np.any(shaped_joints != joints, axis=1).sum()),
        "maxCoordinateDisplacementMillimetres": (np.abs(shaped - positions).max(axis=0) * 1000).tolist(),
        "pending": ["ocular/oral attachment admission", "ear section composition", "source cut/tree/endpoint/normal/UV/hair/contact regeneration",
                    "canonical typed runtime owner promotion", "actual same-person motion/editor/save/staticF32/GPU"],
    }
    return shaped, shaped_joints, record
