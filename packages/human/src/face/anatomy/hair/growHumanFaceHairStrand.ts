import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";
import type { IHumanFaceHairStrandPlacement } from "./IHumanFaceHairStrandPlacement";

/**
 * Admit a hierarchy remainder after the walk's completed canonical stem. Original interpolated arc coordinates select stations beyond the already travelled stem. Only those stations are projected; every remainder chord keeps the original sampling bound and its actual measured total must match the supplied target within the existing contact allowance. Duplicate graft stations emit no zero-length row. The stem's points/freeFrom are preserved.
 *
 * Projection, chord or metric rejection resumes the same owning walk once. The resident builder's resume returns undefined so its existing loop continues with the same field/gather state and remaining budget, without a second launch. Canonical transition refusal occurs before this handoff and is never caught here. A standalone resumed producer's Error propagates unchanged.
 *
 * @evidence contracts/common.md#principled-implementation An already admitted canonical stem keeps its stations while only the interpolated remainder is projected and metric-checked.
 * @evidence contracts/common.md#clear-and-simple-design Rejected remainder resumes the supplied owning walk once, preserving contact, gather field and budget.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Canonical stem refusal is outside this handoff; the existing projection catch treats any thrown projection value as placement rejection.
 * @evidence contracts/common.md#meaningful-documentation Duplicate graft stations emit no zero-length row and total travelled metres must meet target within contact allowance.
 * @evidence contracts/performance.md#efficient-algorithms Projection and travelled-length measurement scan remainder stations once.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing stem/contact and the resident resume seam avoid a second launch or independent integration context.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output point copies belong to the curve, while borrowed stem and strand inputs remain unchanged; no fallback history is retained.
 */
export function growHumanFaceHairStrand(
  props: IHumanFaceHairStrandPlacement,
): IAutoMovieHumanFaceHairCurve | undefined {
  const { strand, contact, rooted }: IHumanFaceHairStrandPlacement = props;
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
      (point: IAutoMovieVector3): boolean =>
        point === undefined ||
        point === null ||
        ![point.x, point.y, point.z].every(Number.isFinite),
    )
  )
    throw new Error(
      "Hair strand placement requires valid canonical rooted transition metadata.",
    );
  const points: IAutoMovieVector3[] = rooted.points.map((point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }));
  let placed: boolean = true;
  let original: number = 0;
  try {
    // Only the interpolated remainder is placed. Its original arc coordinate
    // selects stations beyond the canonical stem's already-spent metric.
    const chord: number = contact.step + contact.epsilon;
    for (let at: number = 1; at < strand.points.length; at++) {
      original += Vector3.length(
        Vector3.subtract(strand.points[at], strand.points[at - 1]),
      );
      if (original <= rooted.travelled) continue;
      const point: IAutoMovieVector3 = contact.project(strand.points[at]);
      const distance: number = Vector3.length(
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
  const travelled: number = points
    .slice(1)
    .reduce(
      (total: number, point: IAutoMovieVector3, at: number): number =>
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
