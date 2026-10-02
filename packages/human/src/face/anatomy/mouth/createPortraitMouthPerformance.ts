import type { IAutoMovieVector3 } from "@automovie/interface";

import { posePortraitJawPoint } from "./posePortraitJawPoint";
import { IPortraitMouthPerformance } from "./structures/IPortraitMouthPerformance";

/**
 * Pair the two lip margins before subdivision. Their equal-length sample
 * populations retain a coincident seam through the same boundary subdivision
 * rule. Surrounding band points receive the rim's displacement, preserving
 * their section thickness instead of flattening both vermilion bodies.
 *
 * @evidence contracts/common.md#principled-implementation The two margins are paired sample by sample so a zero separation makes them one seam; separation is scaled about each pair's midpoint by the ratio of current to observed separation (or opened by a parabolic bump when the observation was closed), the mandible rotates only the lower margin by a hinge angle weighted 4t(1-t) along the span so the corners stay fixed, and smile and pucker are added as smooth lateral fields. Observed and current pairs make an unchanged pair an exact identity, which is checked. Finite, ordered output is verified.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; every constant is a documented coupling of the performance type.
 * @evidence contracts/modeling.md#spatial-conventions Inputs and outputs are head-frame millimetre points; angles are degrees about the hinge and the lateral coordinate is a unitless fraction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function poses two margins and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it moves the given samples.
 * @evidence contracts/modeling.md#shared-boundaries Both margins share their corner points, and a zero separation keeps the rims coincident on one seam (residual sub-nanometre error is resolved onto one shared seam), so the aperture stays closed at the corners and along the seam when the lips meet.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint; the performed lips are observed under the mouth component.
 * @evidence contracts/anatomy.md#parametric-authority Inputs are named motions (lip separation, mandibular angle about a named hinge, commissure elevation, protrusion) with named ranges; none addresses a vertex, curve or patch.
 */
export function createPortraitMouthPerformance(
  upper: readonly IAutoMovieVector3[],
  lower: readonly IAutoMovieVector3[],
  performance: IPortraitMouthPerformance,
): {
  upper: IAutoMovieVector3[];
  lower: IAutoMovieVector3[];
  move: (
    point: IAutoMovieVector3,
    side: "upper" | "lower",
  ) => IAutoMovieVector3;
} {
  if (
    ![performance.lipPart, performance.observedLipPart].every(
      Number.isFinite,
    ) ||
    performance.lipPart < 0 ||
    performance.lipPart > 30 ||
    performance.observedLipPart < 0 ||
    performance.observedLipPart > 30
  )
    throw new Error(
      "Oral performance needs finite observed and current separation from zero through thirty millimetres.",
    );
  if (
    upper.length < 3 ||
    lower.length !== upper.length ||
    [upper, lower].some((curve) =>
      curve.some(
        (point, i) =>
          ![point.x, point.y, point.z].every(Number.isFinite) ||
          (i > 0 && point.x <= curve[i - 1].x),
      ),
    ) ||
    [0, upper.length - 1].some(
      (i) =>
        upper[i].x !== lower[i].x ||
        upper[i].y !== lower[i].y ||
        upper[i].z !== lower[i].z,
    )
  )
    throw new Error(
      "Oral performance needs finite, ordered, paired margins sharing both corners.",
    );
  const settings = structuredClone(performance);
  const jaw = settings.jaw;
  const smile = settings.smile ?? { right: 0, left: 0 };
  const pucker = settings.pucker ?? { current: 0, observed: 0 };
  if (
    ![smile.right, smile.left, pucker.current, pucker.observed].every(
      Number.isFinite,
    ) ||
    Math.abs(smile.right) > 13 ||
    Math.abs(smile.left) > 13 ||
    pucker.current < 0 ||
    pucker.current > 4 ||
    pucker.observed < 0 ||
    pucker.observed > 4
  )
    throw new Error(
      "Oral performance needs bounded smile differences and pucker values.",
    );
  if (jaw !== undefined) {
    if (jaw.current < 0 || jaw.observed < 0)
      throw new Error("Observed and current jaw opening must be nonnegative.");
    posePortraitJawPoint(upper[0], jaw.hinge, jaw.current, 0);
    posePortraitJawPoint(upper[0], jaw.hinge, jaw.observed, 0);
  }
  const original = {
    upper: structuredClone([...upper]),
    lower: structuredClone([...lower]),
  };
  const rotate = (
    point: IAutoMovieVector3,
    side: "upper" | "lower",
    t: number,
    angle: number,
  ) =>
    jaw === undefined || side === "upper"
      ? { ...point }
      : posePortraitJawPoint(point, jaw.hinge, angle, 4 * t * (1 - t));
  const source = {
    upper: structuredClone(original.upper),
    lower: original.lower.map((point, i) =>
      rotate(point, "lower", i / (lower.length - 1), -(jaw?.observed ?? 0)),
    ),
  };
  if (
    performance.observedLipPart === 0 &&
    source.upper.some(
      (point, i) =>
        Math.hypot(
          point.x - source.lower[i].x,
          point.y - source.lower[i].y,
          point.z - source.lower[i].z,
        ) > 1e-8,
    )
  )
    throw new Error(
      "A zero-separation observation must contain a coincident oral seam.",
    );
  // Inverse hinge rotation can leave sub-nanometre roundoff in a neutral
  // contact. Resolve that admitted residual onto one identical shared seam.
  if (performance.observedLipPart === 0)
    source.upper.forEach((point, i) => {
      const seam = {
        x: (point.x + source.lower[i].x) / 2,
        y: (point.y + source.lower[i].y) / 2,
        z: (point.z + source.lower[i].z) / 2,
      };
      source.upper[i] = { ...seam };
      source.lower[i] = { ...seam };
    });
  const posed = {
    upper: structuredClone(source.upper),
    lower: structuredClone(source.lower),
  };
  if (performance.lipPart !== performance.observedLipPart)
    for (let i = 1; i < upper.length - 1; i++) {
      const t = i / (upper.length - 1);
      const seam = {
        x: (source.upper[i].x + source.lower[i].x) / 2,
        y: (source.upper[i].y + source.lower[i].y) / 2,
        z: (source.upper[i].z + source.lower[i].z) / 2,
      };
      for (const side of ["upper", "lower"] as const) {
        const point = source[side][i];
        const ratio =
          performance.observedLipPart === 0
            ? 0
            : performance.lipPart / performance.observedLipPart;
        posed[side][i] = {
          x: seam.x + (point.x - seam.x) * ratio,
          y:
            seam.y +
            (point.y - seam.y) * ratio +
            (performance.observedLipPart === 0
              ? (side === "upper" ? 0.5 : -0.5) *
                performance.lipPart *
                4 *
                t *
                (1 - t)
              : 0),
          z: seam.z + (point.z - seam.z) * ratio,
        };
      }
    }
  const centerX = (upper[0].x + upper[upper.length - 1].x) / 2;
  const decorate = (point: IAutoMovieVector3, t: number) => {
    const lateral = 2 * t - 1;
    const result = {
      x:
        centerX +
        ((point.x - centerX) * (1 - 0.06 * pucker.current)) /
          (1 - 0.06 * pucker.observed),
      y: point.y + (lateral < 0 ? smile.right : smile.left) * lateral ** 2,
      z: point.z + (pucker.current - pucker.observed) * (1 - lateral ** 2),
    };
    if (![result.x, result.y, result.z].every(Number.isFinite))
      throw new Error(
        "Perioral performance exceeds its finite coordinate domain.",
      );
    return result;
  };
  const residualClosure =
    performance.lipPart === 0 &&
    (jaw?.current ?? 0) === 0 &&
    original.upper.some(
      (point, i) =>
        point.x !== original.lower[i].x ||
        point.y !== original.lower[i].y ||
        point.z !== original.lower[i].z,
    );
  const unchanged =
    !residualClosure &&
    performance.lipPart === performance.observedLipPart &&
    (jaw?.current ?? 0) === (jaw?.observed ?? 0) &&
    smile.right === 0 &&
    smile.left === 0 &&
    pucker.current === pucker.observed;
  const output = {
    upper: [] as IAutoMovieVector3[],
    lower: [] as IAutoMovieVector3[],
  };
  for (const side of ["upper", "lower"] as const)
    output[side] = unchanged
      ? structuredClone(original[side])
      : posed[side].map((point, i) =>
          decorate(
            rotate(point, side, i / (upper.length - 1), jaw?.current ?? 0),
            i / (upper.length - 1),
          ),
        );
  if (
    [output.upper, output.lower].some((curve) =>
      curve.some(
        (point, i) =>
          ![point.x, point.y, point.z].every(Number.isFinite) ||
          (i > 0 && point.x <= curve[i - 1].x),
      ),
    )
  )
    throw new Error(
      "Requested oral separation exceeds a finite, ordered aperture.",
    );
  const displacement = (point: IAutoMovieVector3, side: "upper" | "lower") => {
    if (![point.x, point.y, point.z].every(Number.isFinite))
      throw new Error("A lip performance sample must be a finite point.");
    if (unchanged) return { ...point };
    const curve = source[side];
    const x = Math.max(
      curve[0].x,
      Math.min(curve[curve.length - 1].x, point.x),
    );
    const next = Math.max(
      1,
      curve.findIndex((sample) => sample.x >= x),
    );
    const t = (x - curve[next - 1].x) / (curve[next].x - curve[next - 1].x);
    const along = (next - 1 + t) / (curve.length - 1);
    const result = rotate(point, side, along, -(jaw?.observed ?? 0));
    for (const axis of ["x", "y", "z"] as const)
      result[axis] +=
        (posed[side][next - 1][axis] - curve[next - 1][axis]) * (1 - t) +
        (posed[side][next][axis] - curve[next][axis]) * t;
    return decorate(rotate(result, side, along, jaw?.current ?? 0), along);
  };
  return { ...output, move: displacement };
}
