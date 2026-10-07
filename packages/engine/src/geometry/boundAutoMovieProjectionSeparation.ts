import type { IAutoMovieVector3 } from "@automovie/interface";

import { adjacentAutoMovieFloat64 as outward } from "../math/adjacentAutoMovieFloat64";
import { measureAutoMovieProjectionIntervals } from "./measureAutoMovieProjectionIntervals";

/**
 * Lower separation of two convex hulls along one stored nonzero direction.
 * Coordinates are binary64 metres in one frame. Vertex arrays may represent
 * complete convex features or support extrema of a box along this direction.
 * No input or result vector mutates. Degenerate hulls and zero directions are
 * admitted; a zero direction proves no separation and returns zero.
 *
 * Convexity bounds every point projection by the vertex extrema. Divide the
 * positive gap by an upper bound on the direction norm to apply Cauchy-Schwarz.
 * Each rounded subtraction/product/sum/root/division is enclosed with its two
 * binary64 neighbours. This qualifies the represented coordinates, not earlier
 * source coordinates, an analytic surface, signed sides, or a contact manifold.
 * Nonfinite coordinates, overflowed differences or enclosing arithmetic refuse.
 * boundAutoMovieConvexSeparation and the resident mesh query share this owner;
 * approximate feature witnesses only choose its stored direction.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies conservative complete-feature separation to resident geometry operations rather than point-sample collision assertions.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Qualifies convex support separation through outward arithmetic while preserving the supplied coordinate representation.
 * @author Samchon
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
  const measured = measureAutoMovieProjectionIntervals([...a, ...b], raw, a[0]);
  if (measured.normUpper === 0) return 0;
  const left = measured.intervals.slice(0, a.length),
    right = measured.intervals.slice(a.length);
  const gap = Math.max(
    outward(
      Math.min(...left.map((p) => p[0])) - Math.max(...right.map((p) => p[1])),
      false,
    ),
    outward(
      Math.min(...right.map((p) => p[0])) - Math.max(...left.map((p) => p[1])),
      false,
    ),
  );
  return gap > 0 ? Math.max(0, outward(gap / measured.normUpper, false)) : 0;
}
