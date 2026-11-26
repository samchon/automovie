import type {
  IAutoMovieProjectionIntervals,
  IAutoMovieVector3,
} from "@automovie/interface";

import { adjacentAutoMovieFloat64 as outward } from "../../math/internal/adjacentAutoMovieFloat64";
import { measureAutoMovieProjectionIntervals } from "./measureAutoMovieProjectionIntervals";

/**
 * A lower bound on the Euclidean separation of two convex hulls, proved along
 * one stored direction.
 *
 * Each run is a nonempty list of binary64 vertices in one metre frame, taken as
 * its convex hull: a complete convex feature, or the two opposite corners of a
 * box when the direction is a coordinate axis. Degenerate hulls are admitted. A
 * zero direction proves nothing and returns zero, as does any direction along
 * which the two projections overlap or touch; zero therefore means unproved,
 * not intersecting. The bound qualifies the represented coordinates only, not
 * an analytic surface, a signed side or a contact manifold. Nothing is
 * mutated.
 *
 * Throws on an empty run and, through `measureAutoMovieProjectionIntervals`, on
 * a non-finite coordinate or an overflowing enclosure.
 * `boundAutoMovieConvexSeparation` and the resident separation query's box
 * pruning are the consumers; their approximate witnesses only choose the
 * direction.
 *
 * @param a First vertex run.
 * @param b Second vertex run.
 * @param raw Stored direction; any nonzero scale.
 * @returns A nonnegative separation lower bound in metres.
 */
export function boundAutoMovieProjectionSeparation(
  a: readonly IAutoMovieVector3[],
  b: readonly IAutoMovieVector3[],
  raw: IAutoMovieVector3,
): number {
  if (a.length === 0 || b.length === 0)
    throw new Error(
      "Projection separation requires nonempty finite vertices and direction.",
    );
  const measured: IAutoMovieProjectionIntervals =
    measureAutoMovieProjectionIntervals(a.concat(b), raw, a[0]);
  if (measured.normUpper === 0) return 0;
  let leftLow: number = Infinity;
  let leftHigh: number = -Infinity;
  let rightLow: number = Infinity;
  let rightHigh: number = -Infinity;
  measured.intervals.forEach(
    ([low, high]: [number, number], index: number): void => {
      if (index < a.length) {
        leftLow = Math.min(leftLow, low);
        leftHigh = Math.max(leftHigh, high);
      } else {
        rightLow = Math.min(rightLow, low);
        rightHigh = Math.max(rightHigh, high);
      }
    },
  );
  const gap: number = Math.max(
    outward(leftLow - rightHigh, false),
    outward(rightLow - leftHigh, false),
  );
  return gap > 0 ? Math.max(0, outward(gap / measured.normUpper, false)) : 0;
}
