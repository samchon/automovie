import { IAutoMoviePlanarPoint } from "@automovie/interface";

import { pointInPolygon } from "./pointInPolygon";
import { segmentsTouch } from "./segmentsTouch";

/**
 * Whether two polygons share any point at all, contact included.
 *
 * Contact counts so opening validation can refuse voids meeting along a jamb.
 *
 * Requires non-empty simple rings in one planar frame and inherits the binary64
 * and scale-relative `PLANAR_EPSILON` behavior of {@link segmentsTouch} and
 * {@link pointInPolygon}. An edge contact or containment of one corner returns
 * true. Paired with a non-empty ring, an empty ring can throw a `TypeError`
 * when its missing corner reaches the containment predicate.
 *
 * @param left One closed ring.
 * @param right The other closed ring, in the same frame.
 * @returns True when the closed regions share any point.
 */
export function polygonsOverlap(
  left: readonly IAutoMoviePlanarPoint[],
  right: readonly IAutoMoviePlanarPoint[],
): boolean {
  for (let index: number = 0; index < left.length; ++index)
    for (let other: number = 0; other < right.length; ++other)
      if (
        segmentsTouch(
          left[index]!,
          left[(index + 1) % left.length]!,
          right[other]!,
          right[(other + 1) % right.length]!,
        )
      )
        return true;
  return (
    pointInPolygon(left[0]!, right) === true ||
    pointInPolygon(right[0]!, left) === true
  );
}
