import { Vector3 } from "@automovie/engine";

import type { IHumanFaceHairStrandPlacement } from "./IHumanFaceHairStrandPlacement";
import type { IAutoMovieHumanFaceHairCurve } from "./IAutoMovieHumanFaceHairCurve";

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
 *
 * @evidence contracts/common.md#principled-implementation The original arc coordinate omits the interpolation's obsolete root prefix, while the admitted canonical stem remains exact. Projected suffix chords and total actual metric must satisfy the same contact/sampling contract before placement is accepted; otherwise the owning walk resumes rather than copying a stale length.
 * @evidence contracts/common.md#clear-and-simple-design One admission decision for an interpolated remainder; stem construction, state and budgets stay with the integrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every root uses the same prefix/suffix rule. Rejection resumes the already admitted walk and never retries a failed canonical transition or resets its budget.
 * @evidence contracts/common.md#meaningful-documentation Defines handoff, original arc selection, duplicate station meaning, metric/chord admission, named legacy refusal and resume/error ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It admits a numerical curve and defines no part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels It preserves existing hierarchy quantities and adds no styling channel.
 * @evidence contracts/modeling.md#emitted-geometry Canonical stem stations are retained, selected interpolated remainder stations are projected, and duplicate grafts add no row.
 * @evidence contracts/modeling.md#spatial-conventions Stations, metric and contact bounds are current head-frame metres; metadata indices are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries Placement consumes the already certified stem and the same contact instance/metric as its walker. Rejection leaves that boundary and walk intact.
 * @evidenceExclude contracts/modeling.md#rendered-observation It admits numerical geometry; the assembled builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It defines no anatomical value or buried follicle.
 * @evidenceExclude contracts/anatomy.md#permitted-range Its bounds are numerical admission rather than clinical ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It transports compiled geometry and never adds a personal authoring control.
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
