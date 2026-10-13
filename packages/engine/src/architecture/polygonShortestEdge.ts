import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The shortest edge length of a closed polygon.
 *
 * Edges include the closing edge from the last point back to the first, and
 * lengths are Euclidean in the polygon's own units. An empty polygon returns
 * `Infinity`; a ring repeating a point at consecutive corners returns 0, which
 * is how validation detects that defect.
 *
 * @evidence contracts/common.md#principled-implementation Takes the minimum of `Math.hypot` over every consecutive pair of the implicitly closed ring, which measures each edge exactly once including the closing edge.
 * @evidence contracts/common.md#clear-and-simple-design Exists as its own helper so the repeated-corner refusal in `validateBuiltEnvironment` reads as a threshold on one named quantity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies no tolerance itself; the caller compares the result with `PLANAR_EPSILON`, and the empty-ring `Infinity` comes from `Math.min` with no arguments.
 * @evidence contracts/common.md#meaningful-documentation States the closing edge, the units, the empty-ring answer, and the zero result that exposes a repeated corner.
 * @evidence contracts/performance.md#cost-and-resources One O(n) pass that materializes all n lengths and spreads them into `Math.min` where a running minimum would allocate nothing; the temporary array is released on return and nothing is cached.
 */
export const polygonShortestEdge = (
  polygon: readonly IAutoMoviePlanarPoint[],
): number =>
  Math.min(
    ...polygon.map((point, index) => {
      const next = polygon[(index + 1) % polygon.length]!;
      return Math.hypot(next.x - point.x, next.y - point.y);
    }),
  );
