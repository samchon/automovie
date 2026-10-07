"""Author one connected nasal exterior before its frozen aperture insertion.

Named source supports determine compact section fields. Source sellion is a
root witness, not clinical nasion; the most-anterior support is frozen native
authorship rather than a claim to the per-shape clinical pronasale rule.
Every member reads one unchanged state. The native exterior and future lining
root therefore receive one same source displacement, never separate fitting.
Current joint witnesses use the same function. No pose or caller array mutates.
The parameter dimensions and the source chart are authored conventions; no
unobserved tissue, clinical norm or personal depth is supplied.
"""

from dataclasses import asdict

import numpy as np

from NasalEnvelope import NasalEnvelope


def evaluate_nasal_envelope(positions, joints, guide, recipe):
    request = NasalEnvelope(**recipe)
    if not np.isfinite(list(asdict(request).values())).all():
        raise ValueError("Nasal source dimensions must be finite; caller values are not clamped.")
    source = guide["landmarkNativeIds"]
    root = positions[source["sellion"]]
    base = positions[source["subnasale"]]
    left = positions[source["alar-curvature-left"]]
    right = positions[source["alar-curvature-right"]]
    tip = positions[guide["nasalTipNativeSupport"]]
    half_width = max(abs(left[0]), abs(right[0]))
    height = root[2] - base[2]
    depth = base[1] - tip[1]
    if half_width <= 0 or height <= 0 or depth <= 0:
        raise ValueError("Nasal source witnesses lack positive section spans.")
    def support(points, centre, radii):
        scaled = (points - centre) / np.asarray(radii)
        squared = np.sum(scaled * scaled, axis=1)
        return np.maximum(1 - squared, 0) ** 2
    def evaluate(points):
        output = points.copy()
        root_field = support(points, root, [half_width, depth, height / 2])
        dorsum_centre = (root + tip) / 2
        dorsum = support(points, dorsum_centre, [half_width, depth, height / 2])
        bulb = support(points, tip, [half_width, depth, height / 2])
        columella = support(points, base, [half_width / 2, depth, height / 3])
        output[:, 1] -= (request.rootProjectionOffsetMillimetres * root_field +
                           request.dorsumProjectionOffsetMillimetres * dorsum +
                           request.tipProjectionOffsetMillimetres * bulb +
                           request.columellarProjectionOffsetMillimetres * columella) / 1000
        output[:, 0] += points[:, 0] / half_width * request.tipBreadthOffsetMillimetres / 2000 * bulb
        output[:, 0] += points[:, 0] / (half_width / 2) * request.columellarBreadthOffsetMillimetres / 2000 * columella
        output[:, 2] += request.tipHeightOffsetMillimetres / 1000 * bulb
        for sign, centre, breadth, rise in (
            (1, left, request.leftAlarBreadthOffsetMillimetres, request.leftAlarHeightOffsetMillimetres),
            (-1, right, request.rightAlarBreadthOffsetMillimetres, request.rightAlarHeightOffsetMillimetres),
        ):
            weight = support(points, centre, [half_width, depth, height / 3])
            output[:, 0] += sign * breadth / 1000 * weight
            output[:, 2] += rise / 1000 * weight
        return output
    shaped, shaped_joints = evaluate(positions), evaluate(joints)
    if not np.isfinite(shaped).all() or not np.isfinite(shaped_joints).all():
        raise ValueError("Nasal source dimensions produce nonfinite geometry.")
    record = {"request": asdict(request), "supports": {"sellionNative": source["sellion"],
              "tipNativeAuthored": guide["nasalTipNativeSupport"], "subnasaleNative": source["subnasale"],
              "alarNativeLeft": source["alar-curvature-left"], "alarNativeRight": source["alar-curvature-right"]},
              "qualification": "compact source-sectional exterior; neither clinical nasion/pronasale nor cartilage/airway reconstruction",
              "affectedNativeVertices": int(np.any(shaped != positions, axis=1).sum()),
              "affectedJointWitnesses": int(np.any(shaped_joints != joints, axis=1).sum())}
    return shaped, shaped_joints, record
