import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * The pupil centre of one eye on the build's final surface, read as the
 * producer's anterior chart point of that eye's optical support.
 *
 * The chart is the hit of the support's chosen neutral axis on the eye
 * proxy's front, carried by its native triangle and barycentric weights
 * `(1-u-v, u, v)`, so it follows shape and gaze with the posed triangle. This
 * is a named approximation: the CC0 eye proxy has no separate cornea or pupil
 * surface, so the chart point stands for the pupil centre in forward gaze. A
 * basis without that eye's optical support returns a registration gap.
 *
 * @evidence contracts/common.md#principled-implementation Reads the producer-registered chart on the posed triangle, so the point moves with every shape and gaze channel without a refit.
 * @evidence contracts/common.md#clear-and-simple-design One lookup and one barycentric combination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No maximum-projection vertex or asset name stands in; a missing support returns its gap.
 * @evidence contracts/common.md#meaningful-documentation States the approximation and the gap.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the basis head frame.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The eye parameter type cites the pupil-centre landmark; this reader states its approximation.
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
export function readHumanFacePupilCentre(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
): IAutoMovieVector3 | IHumanFaceMeasurementGap {
  const owner = side === "left" ? "leftEye" : "rightEye";
  const support = context.basis.opticalSupport?.find((entry) => entry.owner === owner);
  if (support === undefined)
    return { reason: `missing registration: the basis's ${owner} optical support` };
  const [a, b, c] = support.anterior.triangle.map((vertex) =>
    context.point(support.surface, vertex),
  );
  const { u, v } = support.anterior;
  const w = 1 - u - v;
  return {
    x: w * a.x + u * b.x + v * c.x,
    y: w * a.y + u * b.y + v * c.y,
    z: w * a.z + u * b.z + v * c.z,
  };
}
