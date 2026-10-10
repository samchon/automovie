import { Vector3 } from "@automovie/engine";

import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IHumanFaceHairStrandPlacement } from "./IHumanFaceHairStrandPlacement";

/**
 * Admit a hierarchy remainder after the walk's completed canonical stem.
 * Original interpolated arc coordinates select stations beyond the already
 * travelled stem. Only those stations are projected; every remainder chord
 * keeps the original sampling bound and its actual measured total must match
 * the supplied target within the existing contact allowance. Duplicate graft
 * stations emit no zero-length row. The stem's points/freeFrom are preserved.
 *
 * Projection, chord or metric rejection resumes the same owning walk once.
 * The resident builder's resume returns undefined so its existing loop continues
 * with the same field/gather state and remaining budget, without a second launch.
 * Canonical transition refusal occurs before this handoff and is never caught
 * here. A standalone resumed producer's Error propagates unchanged.
 */
export function growHumanFaceHairStrand(
  props: IHumanFaceHairStrandPlacement,
): IAutoMovieHumanFaceHairCurve | undefined {
  const { strand, contact, rooted } = props;
  if (
    rooted === undefined ||
    rooted === null ||
    !Array.isArray(rooted.points) ||
    !Number.isInteger(rooted.freeFrom) ||
    rooted.freeFrom < 1 ||
    rooted.freeFrom !== rooted.points.length - 1 ||
    !Number.isFinite(rooted.travelled) ||
    !(rooted.travelled > 0) ||
    !Number.isFinite(rooted.targetLength) ||
    rooted.targetLength < rooted.travelled ||
    !Number.isFinite(rooted.clearance) ||
    !(rooted.clearance > 0) ||
    rooted.normal === undefined ||
    rooted.normal === null ||
    ![rooted.normal.x, rooted.normal.y, rooted.normal.z].every(
      Number.isFinite,
    ) ||
    Array.from(rooted.points).some(
      (point) =>
        point === undefined ||
        point === null ||
        ![point.x, point.y, point.z].every(Number.isFinite),
    )
  )
    throw new Error(
      "Hair strand placement requires valid canonical rooted transition metadata.",
    );
  const points = rooted.points.map((point) => ({ ...point }));
  let placed = true;
  let original = 0;
  try {
    // Only the interpolated remainder is placed. Its original arc coordinate
    // selects stations beyond the canonical stem's already-spent metric.
    const chord = contact.step + contact.epsilon;
    for (let at = 1; at < strand.points.length; at++) {
      original += Vector3.length(
        Vector3.subtract(strand.points[at], strand.points[at - 1]),
      );
      if (original <= rooted.travelled) continue;
      const point = contact.project(strand.points[at]);
      const distance = Vector3.length(
        Vector3.subtract(point, points[points.length - 1]),
      );
      if (distance <= contact.epsilon) continue;
      if (distance > chord) {
        placed = false;
        break;
      }
      points.push(point);
    }
  } catch {
    placed = false;
  }
  const travelled = points
    .slice(1)
    .reduce(
      (total, point, at) =>
        total + Vector3.length(Vector3.subtract(point, points[at])),
      0,
    );
  if (!placed || Math.abs(travelled - rooted.targetLength) > contact.epsilon)
    return props.integrate();
  return {
    points,
    length: travelled,
    clearance: rooted.clearance,
    normal: { ...rooted.normal },
    freeFrom: rooted.freeFrom,
  };
}
