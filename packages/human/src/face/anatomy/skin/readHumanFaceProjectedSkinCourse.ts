import type { IHumanFaceProjectedSkinCourseReading } from "./IHumanFaceProjectedSkinCourseReading";
import type { IHumanFaceProjectedSkinSpan } from "./IHumanFaceProjectedSkinSpan";

/**
 * Read extrinsic distance and arc station on finite source-supported spans.
 * Unit chord directions avoid division by a squared length that can underflow
 * for a representable short course. Hypot also preserves subnormal distances.
 * Projection onto the closed span uses its endpoints as genuine geometric
 * bounds, not a clamp of an anatomical input or a change in the relief width.
 *
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
