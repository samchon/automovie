import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The shortest edge length of a closed polygon.
 *
 * Includes the closing edge and measures Euclidean length in polygon units. An empty ring returns `Infinity`; repeated consecutive finite corners and a one-point ring return zero. Coordinate subtraction or a non-representable final length can still overflow despite `Math.hypot`'s scaled evaluation.
 *
 * @param polygon Closed ring of corners, the last joined back to the first.
 * @returns The minimum edge length, or `Infinity` for an empty ring.
 *
 * @evidence contracts/common.md#principled-implementation Minimizes Euclidean edge lengths using `Math.hypot`, avoiding direct squared-length overflow and reducing intermediate underflow. This does not protect prior coordinate subtraction or a length outside binary64's representable range; the closing edge follows the ring convention.
 * @evidence contracts/common.md#clear-and-simple-design A single measurement with one caller purpose, repeated-corner detection in building validation, kept beside the other planar ring helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ring or caller is special-cased; the empty and one-point rings return what the definition gives rather than a substituted value.
 * @evidence contracts/common.md#meaningful-documentation The documentation states which edges count, the units, the empty, repeated-corner and one-point results, and what the zero result is used to detect.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the n edges, O(n) time and O(1) space, replacing a mapped array spread into `Math.min`, which allocated n numbers and pushed them onto the call stack.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure measurement of one outline, asked once per outline by building validation, with nothing coordinated across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps a running minimum and a loop index and allocates nothing, so nothing outlives the call.
 */
export const polygonShortestEdge: (polygon: readonly IAutoMoviePlanarPoint [ ]) => number = (
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
