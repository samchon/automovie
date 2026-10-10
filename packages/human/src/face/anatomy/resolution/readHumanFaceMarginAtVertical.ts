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
    return {
      reason: "missing registration: the basis's periocular registration",
    };
  const margins = periocular[side].margins;
  const row = margins[lid].map((vertex) =>
    context.point(margins.surface, vertex),
  );
  for (let at = 1; at < row.length; at++) {
    const a = row[at - 1];
    const b = row[at];
    if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
    const t = (x - a.x) / (b.x - a.x);
    return { x, y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) };
  }
  return {
    reason: `missing rule: the vertical does not cross the ${side} ${lid} margin row`,
  };
}
