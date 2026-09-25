/**
 * Landmark geometry for comparing a reference photograph with an editor render.
 *
 * `measure-face-likeness.ts` and `plan-face-likeness-views.ts` call these
 * functions with the 478 MediaPipe Face Landmarker points written by
 * `detect-face-likeness.py`, in image pixels with +x right and +y down. Every
 * function is pure: it reads caller-owned arrays and returns new values.
 *
 * The alignment is a 2D similarity (uniform scale, rotation, translation, no
 * reflection) fitted in closed form to a small set of rigid-ish points: the
 * four eye corners, the two mouth corners, the nose tip and the chin. It
 * removes framing, image scale and roll, so the remaining landmark residual
 * is shape plus the head-pose difference the camera did not reproduce. The
 * residual is normalized by the reference's inter-ocular distance (between
 * the two eye-corner midpoints) so photographs of different resolution are
 * comparable. It is a proxy for 2D proportions and never a likeness or
 * identity verdict; the measurement receipt records it beside other signals.
 *
 * The yaw estimate reads the detector's own facial transformation matrices.
 * A photograph's rotation relative to a frontal render of the same document,
 * divided by the detector's response to a known 45 degree render yaw, gives a
 * detector-calibrated camera yaw. It is an instrument calibration, not a
 * recovery of the physical camera.
 */

/** A 2D image point in pixels. */
export type FaceLikenessPoint = readonly [number, number];

/**
 * Similarity mapping `moving` pixels into `fixed` pixels:
 * `x' = a x - b y + tx`, `y' = b x + a y + ty`, scale `hypot(a, b)`.
 */
export interface IFaceLikenessSimilarity {
  a: number;
  b: number;
  tx: number;
  ty: number;
}

/** Eye corners, mouth corners, nose tip and chin of the 478-point mesh. */
export const FACE_LIKENESS_ALIGNMENT_POINTS = [
  33, 133, 362, 263, 61, 291, 1, 152,
] as const;

/** The 468 face-mesh points; the ten iris points are excluded from shape. */
export const FACE_LIKENESS_MESH_POINTS = 468;

/**
 * Fit the least-squares similarity taking `moving[i]` to `fixed[i]` over the
 * selected indices. Refuses a degenerate selection (all moving points equal),
 * because any scale would then fit and the alignment would be meaningless.
 */
export function fitFaceLikenessSimilarity(
  moving: readonly FaceLikenessPoint[],
  fixed: readonly FaceLikenessPoint[],
  indices: readonly number[] = FACE_LIKENESS_ALIGNMENT_POINTS,
): IFaceLikenessSimilarity {
  if (indices.length < 2)
    throw new Error("A similarity needs at least two points.");
  const source = indices.map((index) => point(moving, index));
  const target = indices.map((index) => point(fixed, index));
  const [sx, sy] = mean(source);
  const [ux, uy] = mean(target);
  let dot = 0;
  let cross = 0;
  let norm = 0;
  for (let i = 0; i < source.length; ++i) {
    const px = source[i]![0] - sx;
    const py = source[i]![1] - sy;
    const qx = target[i]![0] - ux;
    const qy = target[i]![1] - uy;
    dot += px * qx + py * qy;
    cross += px * qy - py * qx;
    norm += px * px + py * py;
  }
  if (norm === 0) throw new Error("Similarity points are degenerate.");
  const a = dot / norm;
  const b = cross / norm;
  return { a, b, tx: ux - (a * sx - b * sy), ty: uy - (b * sx + a * sy) };
}

/** Apply a similarity to one point. */
export function applyFaceLikenessSimilarity(
  transform: IFaceLikenessSimilarity,
  [x, y]: FaceLikenessPoint,
): FaceLikenessPoint {
  return [
    transform.a * x - transform.b * y + transform.tx,
    transform.b * x + transform.a * y + transform.ty,
  ];
}

/** The inverse mapping, `fixed` pixels back to `moving` pixels. */
export function invertFaceLikenessSimilarity(
  transform: IFaceLikenessSimilarity,
): IFaceLikenessSimilarity {
  const scale = transform.a * transform.a + transform.b * transform.b;
  if (scale === 0) throw new Error("A zero-scale similarity has no inverse.");
  const a = transform.a / scale;
  const b = -transform.b / scale;
  return {
    a,
    b,
    tx: -(a * transform.tx - b * transform.ty),
    ty: -(b * transform.tx + a * transform.ty),
  };
}

/** Distance between the two eye-corner midpoints. */
export function faceLikenessInterocular(
  points: readonly FaceLikenessPoint[],
): number {
  const right = midpoint(point(points, 33), point(points, 133));
  const left = midpoint(point(points, 362), point(points, 263));
  return Math.hypot(right[0] - left[0], right[1] - left[1]);
}

/**
 * Root-mean-square and median face-mesh residual after aligning `moving`
 * onto `fixed`, both divided by the reference inter-ocular distance.
 */
export function faceLikenessLandmarkResidual(
  moving: readonly FaceLikenessPoint[],
  fixed: readonly FaceLikenessPoint[],
  transform: IFaceLikenessSimilarity,
): { rms: number; median: number } {
  const interocular = faceLikenessInterocular(fixed);
  if (!(interocular > 0))
    throw new Error("The reference eyes coincide; no residual scale exists.");
  const residual: number[] = [];
  for (let index = 0; index < FACE_LIKENESS_MESH_POINTS; ++index) {
    const [x, y] = applyFaceLikenessSimilarity(transform, point(moving, index));
    const [fx, fy] = point(fixed, index);
    residual.push(Math.hypot(x - fx, y - fy) / interocular);
  }
  return {
    rms: Math.sqrt(
      residual.reduce((sum, value) => sum + value * value, 0) / residual.length,
    ),
    median: faceLikenessMedian(residual)!,
  };
}

/**
 * Lid opening divided by eye width. `right` is the subject's right eye
 * (image left in a frontal photo, points 33/133/159/145); `left` uses
 * 362/263/386/374. Scale-free, so no alignment is needed.
 */
export function faceLikenessEyeAperture(
  points: readonly FaceLikenessPoint[],
  side: "left" | "right",
): number {
  const [outer, inner, upper, lower] =
    side === "right" ? [33, 133, 159, 145] : [362, 263, 386, 374];
  return (
    distance(point(points, upper), point(points, lower)) /
    distance(point(points, outer), point(points, inner))
  );
}

/**
 * Height of the lip-centre midpoint above the mouth-corner midpoint, divided
 * by mouth width. Positive when the corners sit higher than the centre, as in
 * a smile; image y grows downward, hence centre minus corners.
 */
export function faceLikenessMouthCornerLift(
  points: readonly FaceLikenessPoint[],
): number {
  const centre = (point(points, 13)[1] + point(points, 14)[1]) / 2;
  const corners = (point(points, 61)[1] + point(points, 291)[1]) / 2;
  return (centre - corners) / distance(point(points, 61), point(points, 291));
}

/** Rotation vector (axis times angle, radians) of a 3x3 rotation matrix. */
export function faceLikenessRotationVector(
  matrix: readonly (readonly number[])[],
): [number, number, number] {
  const m = (row: number, column: number): number => matrix[row]![column]!;
  const cosine = Math.min(
    1,
    Math.max(-1, (m(0, 0) + m(1, 1) + m(2, 2) - 1) / 2),
  );
  const angle = Math.acos(cosine);
  const axis: [number, number, number] = [
    m(2, 1) - m(1, 2),
    m(0, 2) - m(2, 0),
    m(1, 0) - m(0, 1),
  ];
  const length = Math.hypot(...axis);
  // Near the identity the skew part vanishes with the angle; the first-order
  // rotation vector is half the skew part. A half-turn has no skew part and
  // a detector never reports a face turned 180 degrees from a frontal render.
  if (length < 1e-9) return [axis[0] / 2, axis[1] / 2, axis[2] / 2];
  return [
    (axis[0] * angle) / length,
    (axis[1] * angle) / length,
    (axis[2] * angle) / length,
  ];
}

/** Relative rotation `A * B^T` of two 4x4 (or 3x3) detector transforms. */
export function faceLikenessRelativeRotation(
  a: readonly (readonly number[])[],
  b: readonly (readonly number[])[],
): number[][] {
  const result: number[][] = [];
  for (let row = 0; row < 3; ++row) {
    result.push([]);
    for (let column = 0; column < 3; ++column) {
      let sum = 0;
      for (let k = 0; k < 3; ++k) sum += a[row]![k]! * b[column]![k]!;
      result[row]!.push(sum);
    }
  }
  return result;
}

/**
 * Detector-calibrated camera yaw in degrees: the reference's yaw response
 * relative to the frontal render, scaled by `knownYaw` over the response to
 * a render at that known yaw. Returns null when the calibration response is
 * too small to divide by, which the caller records as a missing calibration.
 */
export function faceLikenessCalibratedYaw(
  referenceResponse: number,
  calibrationResponse: number,
  knownYaw = 45,
): number | null {
  if (Math.abs(calibrationResponse) < 1e-6) return null;
  return (knownYaw * referenceResponse) / calibrationResponse;
}

/** Median of a list, or null for an empty list. */
export function faceLikenessMedian(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((x, y) => x - y);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function point(
  points: readonly FaceLikenessPoint[],
  index: number,
): FaceLikenessPoint {
  const value = points[index];
  if (value === undefined) throw new Error(`Landmark ${index} is missing.`);
  return value;
}

function mean(points: readonly FaceLikenessPoint[]): FaceLikenessPoint {
  let x = 0;
  let y = 0;
  for (const [px, py] of points) {
    x += px;
    y += py;
  }
  return [x / points.length, y / points.length];
}

function midpoint(
  a: FaceLikenessPoint,
  b: FaceLikenessPoint,
): FaceLikenessPoint {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function distance(a: FaceLikenessPoint, b: FaceLikenessPoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
