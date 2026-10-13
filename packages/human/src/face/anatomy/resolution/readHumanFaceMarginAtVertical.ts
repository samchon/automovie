import type { IAutoMovieHumanFacePeriocular as ImportedIAutoMovieHumanFacePeriocular, IAutoMovieHumanFacePeriocularMargins as ImportedIAutoMovieHumanFacePeriocularMargins } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Where the vertical line at head-frame X `x` crosses one lid margin row on the build's final surface: the point on the posed row polyline (medial to lateral) whose X equals `x`, linearly interpolated within its segment.
 *
 * With `x` at the pupil centre this is palpebrale superius (upper row) or palpebrale inferius (lower row), the margin points vertical to the pupil centre. A row the line does not cross returns a gap naming the row, and a basis without the periocular registration returns its gap.
 *
 * @evidence contracts/common.md#principled-implementation Current registered margin edges intersect the requested head-X plane and interpolate a crossing.
 * @evidence contracts/common.md#clear-and-simple-design The shared context owns current coordinates while this reader chooses the first crossing in source order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Constant-X segments are skipped; missing registration or no crossing returns a gap without nearest-point substitution.
 * @evidence contracts/common.md#meaningful-documentation Returned head-metre coordinates describe source margin geometry rather than a verified clinical pupil-plane measurement.
 * @evidence contracts/performance.md#efficient-algorithms The ordered margin scan is linear in registered vertices with fixed interpolation per edge.
 * @evidence contracts/performance.md#reuse-equivalent-work The same source registration/current context supplies endpoints without a separate rest margin.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned crossing vector or gap escapes and the temporary source-point list is released.
 *
 * @author Samchon
 */
export function readHumanFaceMarginAtVertical(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  lid: "upper" | "lower",
  x: number,
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const periocular: ImportedIAutoMovieHumanFacePeriocular | undefined = context.basis.periocular;
  if (periocular === undefined)
    return {
      reason: "missing registration: the basis's periocular registration",
    };
  const margins: ImportedIAutoMovieHumanFacePeriocularMargins = periocular[side].margins;
  const row: IAutoMovieVector3[] = margins[lid].map((vertex: number): IAutoMovieVector3 =>
    context.point(margins.surface, vertex),
  );
  for (let at: number = 1; at < row.length; at++) {
    const a: IAutoMovieVector3 = row[at - 1];
    const b: IAutoMovieVector3 = row[at];
    if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
    const t: number = (x - a.x) / (b.x - a.x);
    return { x, y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) };
  }
  return {
    reason: `missing rule: the vertical does not cross the ${side} ${lid} margin row`,
  };
}
