import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The shortest edge length of a closed polygon.
 *
 * Edges include the closing edge from the last point back to the first, and
 * lengths are Euclidean in the polygon's own units. An empty polygon returns
 * `Infinity`; a ring repeating a point at consecutive corners returns 0, which
 * is how building validation detects that defect. A one-point ring has one
 * zero-length edge from the point to itself.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns The minimum edge length, or `Infinity` for an empty ring.
 *
 * @evidence contracts/common.md#principled-implementation The minimum of the Euclidean lengths of every ring edge, measured with `Math.hypot` so that tiny and large coordinate differences neither underflow nor overflow; the closing edge is part of the ring by its closure convention.
 * @evidence contracts/common.md#clear-and-simple-design A single measurement with one caller purpose, repeated-corner detection in building validation, kept beside the other planar ring helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ring or caller is special-cased; the empty and one-point rings return what the definition gives rather than a substituted value.
 * @evidence contracts/common.md#meaningful-documentation The documentation states which edges count, the units, the empty, repeated-corner and one-point results, and what the zero result is used to detect.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the n edges, O(n) time and O(1) space, replacing a mapped array spread into `Math.min`, which allocated n numbers and pushed them onto the call stack.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure measurement of one outline, asked once per outline by building validation, with nothing coordinated across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps a running minimum and a loop index and allocates nothing, so nothing outlives the call.
 */
export const polygonShortestEdge = (
  polygon: readonly IAutoMoviePlanarPoint[],
): number => {
  let shortest: number = Infinity;
  for (let index: number = 0; index < polygon.length; ++index) {
    const point: IAutoMoviePlanarPoint = polygon[index]!;
    const next: IAutoMoviePlanarPoint = polygon[(index + 1) % polygon.length]!;
    shortest = Math.min(shortest, Math.hypot(next.x - point.x, next.y - point.y));
  }
  return shortest;
};
