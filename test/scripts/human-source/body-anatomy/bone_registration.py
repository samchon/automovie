"""Joint centres read from bone surfaces and the similarity that carries a bone.

A bone keeps its own form: it moves by a rotation, a translation and scales
along its own length and widths that stay close to one uniform scale, never
by a blend of neighbours. Its place is the one nearest to where the exterior
correspondence carried its surface among those inside the fascial face. Joint centres read on the atlas bone give each segment
its direction when the atlas is posed, and are reported beside the target
rig's landmarks, which are skinning pivots and are not treated as centres:

- hip: centre of the sphere fitted to the femoral head surface;
- knee: area-weighted centroid of the distal femoral condyles, the block the
  flexion axis passes through;
- ankle: midpoint of the two malleolar tips, the transmalleolar axis.

These are authored geometric conventions on one atlas individual. They are
not measured functional joint centres and establish no clinical axis.
All points are metres in the sagittally centred atlas frame (+X left, +Y up,
+Z anterior).
"""
import numpy as np
from scipy.optimize import minimize


def triangle_areas(points, faces):
    corners = points[faces]
    return np.linalg.norm(np.cross(corners[:, 1] - corners[:, 0], corners[:, 2] - corners[:, 0]), axis=1) / 2


def fit_sphere(points):
    """Algebraic least-squares sphere through surface points."""
    system = np.column_stack((2 * points, np.ones(len(points))))
    solution, *_ = np.linalg.lstsq(system, np.sum(points * points, axis=1), rcond=None)
    centre = solution[:3]
    radius = float(np.sqrt(solution[3] + centre @ centre))
    return centre, radius


def femoral_head(points, medial_sign):
    """Sphere of the femoral head of one femur.

    The head is the most medial surface of the proximal fifth. Starting from
    that surface point, the fit keeps the vertices lying on the current
    sphere and repeats until the selection stops changing. `medial_sign` is
    +1 when medial is +X (the right femur) and -1 for the left.
    """
    high, low = points[:, 1].max(), points[:, 1].min()
    proximal = points[points[:, 1] > high - .2 * (high - low)]
    seed = proximal[np.argmax(medial_sign * proximal[:, 0])]
    chosen = points[np.linalg.norm(points - seed, axis=1) < .02]
    centre, radius = fit_sphere(chosen)
    for _ in range(20):
        distance = np.linalg.norm(points - centre, axis=1)
        # The neck leaves the sphere on the lateral side; keep the cap whose
        # points still lie on the fitted surface.
        on_sphere = (np.abs(distance - radius) < .0015) & (medial_sign * (points[:, 0] - centre[0]) > -.4 * radius)
        if on_sphere.sum() < 30:
            break
        updated, new_radius = fit_sphere(points[on_sphere])
        moved = np.linalg.norm(updated - centre)
        centre, radius, chosen = updated, new_radius, points[on_sphere]
        if moved < 1e-6:
            break
    error = float(np.sqrt(np.mean((np.linalg.norm(chosen - centre, axis=1) - radius) ** 2)))
    if not .015 < radius < .035:
        raise ValueError("Fitted femoral head radius is not a human femoral head: " + str(radius))
    return centre, {"radiusMetres": radius, "fitVertices": int(len(chosen)), "rmsMetres": error}


def condylar_centre(points, faces):
    """Area-weighted centroid of the distal twelfth of a femur."""
    high, low = points[:, 1].max(), points[:, 1].min()
    centroids = points[faces].mean(axis=1)
    distal = centroids[:, 1] < low + (high - low) / 12
    areas = triangle_areas(points, faces)[distal]
    return (centroids[distal] * areas[:, None]).sum(axis=0) / areas.sum()


def malleolar_centre(tibia, fibula):
    """Midpoint of the medial and lateral malleolar tips."""
    return (tibia[np.argmin(tibia[:, 1])] + fibula[np.argmin(fibula[:, 1])]) / 2


def shortest_rotation(source, target):
    """The rotation of least angle taking one unit direction to another."""
    source, target = source / np.linalg.norm(source), target / np.linalg.norm(target)
    axis = np.cross(source, target)
    sine, cosine = np.linalg.norm(axis), float(source @ target)
    if sine < 1e-12:
        if cosine < 0:
            raise ValueError("Opposed bone axes leave the rotation undetermined.")
        return np.eye(3)
    axis /= sine
    skew = np.asarray([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + sine * skew + (1 - cosine) * skew @ skew


def nearest_similarity(source, target):
    """The similarity x -> s R x + b nearest to paired points in least squares.

    Closed form: the rotation comes from the singular vectors of the
    cross-covariance with the reflection case excluded, and the scale from
    its singular values over the source variance. Every vertex counts once,
    so densely tessellated regions weigh more than sparse ones.
    """
    source_mean, target_mean = source.mean(axis=0), target.mean(axis=0)
    centred_source, centred_target = source - source_mean, target - target_mean
    left, values, right = np.linalg.svd(centred_target.T @ centred_source / len(source))
    sign = np.diag([1.0, 1.0, np.sign(np.linalg.det(left) * np.linalg.det(right))])
    rotation = left @ sign @ right
    scale = float((values * np.diag(sign)).sum() / (centred_source ** 2).sum() * len(source))
    linear = scale * rotation
    translation = target_mean - linear @ source_mean
    error = float(np.sqrt(np.mean(np.sum((source @ linear.T + translation - target) ** 2, axis=1))))
    return linear, translation, scale, error


def rotation_of(vector):
    """Rotation matrix of a rotation vector (axis times angle)."""
    angle = float(np.linalg.norm(vector))
    if angle < 1e-12:
        return np.eye(3)
    axis = vector / angle
    skew = np.asarray([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + np.sin(angle) * skew + (1 - np.cos(angle)) * skew @ skew


def contained_fit(source, carried, depth, midline=False, scale_freedom=.15, turn_freedom=.1, shift_freedom=.01, guard=.0005):
    """Place a bone near where the exterior carried it, inside the fascial face.

    The bone moves by a rotation, a translation and three scales along its own
    principal axes: its length and its two widths. The scales stay within the
    stated fraction of the uniform scale of the nearest similarity, so a bone
    may be a little slimmer or stockier than the atlas's but keeps its form.
    Among such placements this takes the one nearest in least squares to the
    carried surface whose every vertex lies inside the fascial face by the
    guard; `depth` returns the signed distance to that face, negative inside.
    The guard is a numerical allowance of the fit, not a tissue thickness.

    The bone may leave the nearest similarity only a little: by the stated
    turn in radians, shift in metres and scale fraction. Without those
    limits a bone the exterior cannot hold where it belongs escapes to a
    distant place where it happens to fit, which is a worse answer than a
    bone that is reported as not held. Containment is imposed by a penalty
    raised in stages inside those limits and is then read back exactly.
    When vertices still lie outside, nothing is clamped: the result carries
    their count and the worst depth, and the caller reports that this
    exterior does not hold this bone under these freedoms.
    A midline bone keeps the sagittal plane: it turns only about the lateral
    axis, does not shift sideways and scales along the body axes.
    """
    linear, translation, uniform, _ = nearest_similarity(source, carried)
    centre = source.mean(axis=0)
    if midline:
        frame = np.eye(3)
    else:
        _, _, frame = np.linalg.svd(source - centre, full_matrices=False)
        frame = frame.T
    local = (source - centre) @ frame
    start_rotation = linear / uniform
    start_shift = linear @ centre + translation

    def placed(parameters):
        turn = rotation_of(np.asarray([parameters[0], 0.0, 0.0]) if midline else parameters[:3])
        shift = parameters[3:6].copy()
        if midline:
            shift[0] = 0.0
        scales = uniform * np.exp(np.clip(parameters[6:9], -scale_freedom, scale_freedom))
        return ((local * scales) @ frame.T) @ (turn @ start_rotation).T + start_shift + shift, scales

    def cost(parameters, weight):
        points, _ = placed(parameters)
        outside = np.maximum(depth(points) + guard, 0.0)
        return float(np.mean(np.sum((points - carried) ** 2, axis=1)) + weight * np.mean(outside ** 2))

    parameters = np.zeros(9)
    # The nearest similarity is kept when it already lies inside; the search
    # runs only for a bone the exterior does not hold as carried, within a
    # fixed budget of evaluations per stage. A budget that ends early leaves
    # vertices outside, which the read-back then reports.
    if (depth(placed(parameters)[0]) + guard > 0).any():
        limits = [(-turn_freedom, turn_freedom)] * 3 + [(-shift_freedom, shift_freedom)] * 3 + [(-scale_freedom, scale_freedom)] * 3
        for weight in (1e2, 1e5):
            parameters = minimize(cost, parameters, args=(weight,), method="Powell", bounds=limits, options={"xtol": 1e-5, "ftol": 1e-10, "maxfev": 500}).x
    points, scales = placed(parameters)
    depths = depth(points)
    turn = rotation_of(np.asarray([parameters[0], 0.0, 0.0]) if midline else parameters[:3])
    matrix = turn @ start_rotation @ frame @ np.diag(scales) @ frame.T
    shift = parameters[3:6] * (np.asarray([0.0, 1.0, 1.0]) if midline else 1.0)
    offset = start_shift + shift - matrix @ centre
    account = {"vertices": int(len(source)), "uniformScale": uniform, "axisScales": scales.tolist(), "principalAxes": frame.T.tolist(),
               "rmsToCarriedMetres": float(np.sqrt(np.mean(np.sum((points - carried) ** 2, axis=1)))),
               "outsideVertices": int((depths > 0).sum()), "deepestOutsideMetres": float(max(depths.max(), 0.0)),
               "refused": bool((depths > 0).any())}
    return matrix, offset, account


def mirrored(linear, translation):
    """The same map on the other side of the sagittal plane x = 0."""
    mirror = np.diag([-1.0, 1.0, 1.0])
    return mirror @ linear @ mirror, mirror @ translation
