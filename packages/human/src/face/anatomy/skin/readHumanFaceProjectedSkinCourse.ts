import type { IHumanFaceProjectedSkinCourseReading } from "./IHumanFaceProjectedSkinCourseReading";
import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";

/**
 * Read extrinsic distance and arc station on finite source-supported spans.
 * Unit chord directions avoid division by a squared length that can underflow
 * for a representable short course. Hypot also preserves subnormal distances.
 * Projection onto the closed span uses its endpoints as genuine geometric
 * bounds, not a clamp of an anatomical input or a change in the relief width.
 *
 * @evidence contracts/common.md#principled-implementation Orthogonal projection onto a finite segment minimizes Euclidean distance; unit directions and hypot avoid length-squared underflow.
 * @evidence contracts/common.md#clear-and-simple-design Owns the distance/station reading consumed by the one relief kernel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves extrinsic distance and first-span ties without introducing a geodesic or width-dependent representation.
 * @evidence contracts/common.md#meaningful-documentation States units, endpoint projection and the numerical reason for unit directions.
 * @evidence contracts/modeling.md#spatial-conventions Points and lengths are head-frame metres; station is dimensionless accumulated arc fraction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Processes an existing skin course and creates no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes internal geometry without adding an anatomical authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or source vertex.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The final course owner checks native feature continuity; this helper does not certify a tissue join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The calling relief owners observe the resulting skin.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Performs geometry arithmetic and introduces no physiological quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input ranges remain with the relief callers.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No personal curve or vertex authoring is exposed.
 * @author Samchon
 */
export function readHumanFaceProjectedSkinCourse(
  spans: readonly IHumanFaceProjectedSkinSpan[],
  totalLengthMetres: number,
  point: readonly number[],
): IHumanFaceProjectedSkinCourseReading {
  if (point.length !== 3 || point.some((value) => !Number.isFinite(value)))
    throw new Error(
      "Skin course reading needs a finite three-coordinate point.",
    );
  let distanceMetres = Infinity,
    station = 0;
  for (const span of spans) {
    if (span.lengthMetres === 0) {
      const distance = Math.hypot(
        ...point.map((value, axis) => value - span.start[axis]),
      );
      if (distance < distanceMetres) {
        distanceMetres = distance;
        station =
          totalLengthMetres > 0
            ? span.precedingLengthMetres / totalLengthMetres
            : 0;
      }
      continue;
    }
    const direction = span.end.map(
      (value, axis) => (value - span.start[axis]) / span.lengthMetres,
    );
    const offset = point.map((value, axis) => value - span.start[axis]);
    const along =
      offset[0] * direction[0] +
      offset[1] * direction[1] +
      offset[2] * direction[2];
    const reach = Math.max(0, Math.min(span.lengthMetres, along));
    const distance = Math.hypot(
      ...offset.map((value, axis) => value - reach * direction[axis]),
    );
    if (distance < distanceMetres) {
      distanceMetres = distance;
      station = (span.precedingLengthMetres + reach) / totalLengthMetres;
    }
  }
  return { distanceMetres, station };
}
