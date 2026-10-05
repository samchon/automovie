import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Where the vertical line at head-frame X `x` crosses one lid margin row on
 * the build's final surface: the point on the posed row polyline (medial to
 * lateral) whose X equals `x`, linearly interpolated within its segment.
 *
 * With `x` at the pupil centre this is palpebrale superius (upper row) or
 * palpebrale inferius (lower row), the margin points vertical to the pupil
 * centre. A row the line does not cross returns a gap naming the row, and a
 * basis without the periocular registration returns its gap.
 *
 * @evidence contracts/common.md#principled-implementation Intersects the registered posed margin row with the vertical, so the point follows the lid on every shape.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the row's segments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never snaps to the nearest vertex; a missed crossing returns its gap.
 * @evidence contracts/common.md#meaningful-documentation States the crossing rule, the landmarks it yields and the gaps.
 * @evidence contracts/modeling.md#spatial-conventions The vertical is head-frame +Y at constant X, metres.
 * @evidence contracts/anatomy.md#anatomical-source Follows the palpebrale superius and inferius definitions of the periocular studies the eye parameter type cites.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The periocular registration names the parts; the reader names none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Measurements report what it reads.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader is not an input.
 *
 * @author Samchon
 */
export function readHumanFaceMarginAtVertical(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  lid: "upper" | "lower",
  x: number,
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const periocular = context.basis.periocular;
  if (periocular === undefined)
    return { reason: "missing registration: the basis's periocular registration" };
  const margins = periocular[side].margins;
  const row = margins[lid].map((vertex) => context.point(margins.surface, vertex));
  for (let at = 1; at < row.length; at++) {
    const a = row[at - 1];
    const b = row[at];
    if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
    const t = (x - a.x) / (b.x - a.x);
    return { x, y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) };
  }
  return { reason: `missing rule: the vertical does not cross the ${side} ${lid} margin row` };
}
