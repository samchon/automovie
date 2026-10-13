import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * The unsigned area, in square metres, a face-local outline encloses.
 *
 * The outline closes from its last corner back to its first and may wind
 * either way. An outline with fewer than three corners, such as an empty clip
 * result, encloses nothing and answers `0`.
 *
 * @param polygon Simple outline in face-local metres.
 * @returns The enclosed area, never negative.
 *
 * @evidence contracts/common.md#principled-implementation The shoelace formula, half the absolute sum of consecutive cross products, which is exact for a simple polygon in either winding; the premise is a non-self-intersecting outline, which the pattern run's convex clips always are.
 * @evidence contracts/common.md#clear-and-simple-design One area measure for every zone, exclusion and piece in the pattern take-off, so all quantities are measured alike.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no outline and applies no threshold; the run's own area epsilon is applied by the caller where it decides presence.
 * @evidence contracts/common.md#meaningful-documentation States the closing rule, that winding does not matter, the unit, and the zero answer for a degenerate outline.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the corners with constant extra space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure sum over one outline that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates nothing beyond scalars, so nothing outlives the call.
 */
export const autoMoviePatternPolygonArea = (
  polygon: readonly IAutoMoviePatternPoint[],
): number => {
  let twice: number = 0;
  for (let index: number = 0; index < polygon.length; ++index) {
    const from: IAutoMoviePatternPoint = polygon[index]!;
    const to: IAutoMoviePatternPoint = polygon[(index + 1) % polygon.length]!;
    twice += from.u * to.v - to.u * from.v;
  }
  return Math.abs(twice) / 2;
};
