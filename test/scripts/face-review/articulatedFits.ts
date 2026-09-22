/**
 * Measurements that turn a source basis's authored rigid endpoints into an
 * articulation: the mandible's opening screw decomposed into a condylar axis
 * under a cited rotation-translation coupling, its pure translations, each
 * globe's gaze rotations about the source joint cube, and the attachment
 * weights the pure-translation endpoints reveal. `prepareArticulatedBasis`
 * calls these on the tracked basis; the analytic unit scenarios call them on
 * hand-built point sets whose answers are known.
 *
 * Everything here is a fit of the shared source's own data; nothing is a
 * person's sculpt and nothing is invented. A rotation is read with Horn's
 * absolute-orientation solver from `@automovie/engine`, whose proper-rotation
 * result is checked before it is trusted: a translation endpoint must leave
 * no rotation, a rotation endpoint must leave no slide along its axis, and a
 * gaze endpoint must turn about the cube it was authored around, each within
 * the tolerance the caller names, or the fit refuses with the figure.
 */
import { Quaternion, Vector3 } from "@automovie/engine";
import { fitRigidMeshTransform } from "@automovie/engine/math/fitRigidMeshTransform";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Rotation axis (unit) and angle in degrees of a unit quaternion, angle in [0, 180]. */
export function axisAngleOf(rotation: IAutoMovieQuaternion): {
  axis: IAutoMovieVector3;
  degrees: number;
} {
  const sign = rotation.w < 0 ? -1 : 1;
  const v = Vector3.create(
    rotation.x * sign,
    rotation.y * sign,
    rotation.z * sign,
  );
  const sine = Vector3.length(v);
  const degrees =
    (2 * Math.atan2(sine, rotation.w * sign)) / Quaternion.DEG2RAD;
  return {
    axis: sine === 0 ? Vector3.create(1, 0, 0) : Vector3.scale(v, 1 / sine),
    degrees,
  };
}

/** Dense positions of `neutral + rows` for one surface; rows are sparse `[v, dx, dy, dz]`. */
export function posedPositions(
  neutral: readonly number[],
  rows: readonly number[] | undefined,
): number[] {
  const out = neutral.slice();
  if (rows !== undefined)
    for (let i = 0; i < rows.length; i += 4)
      for (let axis = 0; axis < 3; axis++)
        out[rows[i] * 3 + axis] += rows[i + axis + 1];
  return out;
}

/**
 * Solve `(I - R) d = u` for `d` perpendicular to the rotation axis `n`, where
 * `R` turns by `degrees` about `n` and `u` is perpendicular to `n`:
 * `d = u / 2 + cot(theta / 2) / 2 * (n x u)`. This is how a rotation plus a
 * translation is rewritten as a rotation about a shifted point, and it is
 * singular at zero angle, where no such point exists.
 */
export function shiftedPivot(
  axis: IAutoMovieVector3,
  degrees: number,
  u: IAutoMovieVector3,
): IAutoMovieVector3 {
  const half = (degrees * Quaternion.DEG2RAD) / 2;
  if (!(Math.abs(Math.sin(half)) > 1e-12))
    throw new Error("A zero rotation has no pivot to shift.");
  return Vector3.add(
    Vector3.scale(u, 0.5),
    Vector3.scale(
      Vector3.cross(axis, u),
      Math.cos(half) / (2 * Math.sin(half)),
    ),
  );
}

/**
 * Fit one endpoint of a rigid component as a proper rigid transform
 * `x' = R (x - a) + b` and report its axis, angle, translation and RMS.
 */
export function fitEndpointTransform(
  neutral: readonly number[],
  rows: readonly number[] | undefined,
  vertices: readonly number[],
): {
  rotation: IAutoMovieQuaternion;
  axis: IAutoMovieVector3;
  degrees: number;
  referenceCenter: IAutoMovieVector3;
  targetCenter: IAutoMovieVector3;
  rmsMetres: number;
} {
  const target = posedPositions(neutral, rows);
  const fit = fitRigidMeshTransform({ reference: neutral, target, vertices });
  let sum = 0;
  for (const v of vertices) {
    const p = Vector3.create(
      neutral[3 * v],
      neutral[3 * v + 1],
      neutral[3 * v + 2],
    );
    const image = Vector3.add(
      Quaternion.rotateVector(
        fit.rotation,
        Vector3.subtract(p, fit.referenceCenter),
      ),
      fit.targetCenter,
    );
    sum +=
      Vector3.length(
        Vector3.subtract(
          image,
          Vector3.create(target[3 * v], target[3 * v + 1], target[3 * v + 2]),
        ),
      ) ** 2;
  }
  return {
    ...fit,
    ...axisAngleOf(fit.rotation),
    rmsMetres: Math.sqrt(sum / vertices.length),
  };
}

/**
 * Decompose a full-open mandibular transform into a rotation about a condylar
 * axis point plus a coupled translation.
 *
 * The source's opening is one screw: rotation `R` by `theta` about axis `n`
 * with the arch's centroid moving from `a` to `b`. Any point `P` on the screw
 * axis satisfies `R (x - P) + P = R x + (b - R a)` when the slide along `n`
 * vanishes, which the caller's tolerance checks. Under the cited coupling the
 * mandible also translates by `t = theta * couplingPerDegree` at full
 * opening, and the axis point that reproduces the same transform with that
 * translation is `A = P - d`, `(I - R) d = t`. Both `P` (chosen on the screw
 * axis nearest the pivot landmark) and `A` are returned with the slide, so
 * the receipt can state the source's own hinge and where the coupling put
 * the condyle.
 */
export function decomposeOpening(props: {
  rotation: IAutoMovieQuaternion;
  referenceCenter: IAutoMovieVector3;
  targetCenter: IAutoMovieVector3;
  pivotLandmark: IAutoMovieVector3;
  /** Translation per degree of opening, metres, in the head frame. */
  couplingPerDegree: IAutoMovieVector3;
}): {
  axis: IAutoMovieVector3;
  degrees: number;
  screwPivot: IAutoMovieVector3;
  slideMetres: number;
  translation: IAutoMovieVector3;
  axisPoint: IAutoMovieVector3;
} {
  const { axis, degrees } = axisAngleOf(props.rotation);
  const u = Vector3.subtract(
    props.targetCenter,
    Quaternion.rotateVector(props.rotation, props.referenceCenter),
  );
  const slide = Vector3.dot(u, axis);
  const perpendicular = Vector3.subtract(u, Vector3.scale(axis, slide));
  const onAxis = shiftedPivot(axis, degrees, perpendicular);
  const along = Vector3.dot(
    Vector3.subtract(props.pivotLandmark, onAxis),
    axis,
  );
  const screwPivot = Vector3.add(onAxis, Vector3.scale(axis, along));
  const translation = Vector3.scale(props.couplingPerDegree, degrees);
  const coupled = Vector3.dot(translation, axis);
  const d = shiftedPivot(
    axis,
    degrees,
    Vector3.subtract(translation, Vector3.scale(axis, coupled)),
  );
  return {
    axis,
    degrees,
    screwPivot,
    slideMetres: Math.abs(slide),
    translation,
    axisPoint: Vector3.subtract(screwPivot, d),
  };
}

/**
 * Attachment weights a set of pure-translation endpoints reveal: for vertex v
 * with authored displacements `E_k` under translations `t_k`, the least
 * squares weight is `sum(E_k . t_k) / sum(|t_k|^2)`. Weights are clamped to
 * [0, 1] and the count and worst excess of the clamp are reported, together
 * with the worst off-axis residual, which is the part of the authored motion
 * no attachment can explain.
 */
export function impliedWeights(
  vertexCount: number,
  endpoints: {
    rows: readonly number[] | undefined;
    translation: IAutoMovieVector3;
  }[],
): {
  weights: Float64Array;
  clamped: number;
  worstExcess: number;
  worstOffAxisMetres: number;
} {
  const numerator = new Float64Array(vertexCount);
  let denominator = 0;
  const dense = endpoints.map(({ rows, translation }) => {
    denominator += Vector3.dot(translation, translation);
    const field = new Float64Array(vertexCount * 3);
    if (rows !== undefined)
      for (let i = 0; i < rows.length; i += 4)
        for (let axis = 0; axis < 3; axis++)
          field[rows[i] * 3 + axis] = rows[i + axis + 1];
    for (let v = 0; v < vertexCount; v++)
      numerator[v] +=
        field[3 * v] * translation.x +
        field[3 * v + 1] * translation.y +
        field[3 * v + 2] * translation.z;
    return field;
  });
  if (!(denominator > 0))
    throw new Error("Implied weights need a nonzero translation.");
  const weights = new Float64Array(vertexCount);
  let clamped = 0,
    worstExcess = 0,
    worstOffAxis = 0;
  for (let v = 0; v < vertexCount; v++) {
    const raw = numerator[v] / denominator;
    const weight = Math.min(1, Math.max(0, raw));
    if (weight !== raw) {
      clamped++;
      worstExcess = Math.max(worstExcess, Math.abs(raw - weight));
    }
    weights[v] = weight;
    endpoints.forEach(({ translation }, k) => {
      const field = dense[k];
      worstOffAxis = Math.max(
        worstOffAxis,
        Math.hypot(
          field[3 * v] - weight * translation.x,
          field[3 * v + 1] - weight * translation.y,
          field[3 * v + 2] - weight * translation.z,
        ),
      );
    });
  }
  return { weights, clamped, worstExcess, worstOffAxisMetres: worstOffAxis };
}
