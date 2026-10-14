import { IAutoMoviePatternPoint } from "./IAutoMoviePatternPoint";

/**
 * The unsigned area, in square metres, a face-local outline encloses.
 *
 * The outline closes from its last corner to its first and may wind either way. With suitable finite intermediates, fewer than three corners give zero; an empty ring always gives zero. Non-finite input/products can instead yield `NaN` or infinity.
 *
 * @param polygon Simple outline in face-local metres.
 * @returns The absolute shoelace result; non-finite intermediates can yield `NaN` or infinity.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates half the absolute shoelace cross-product sum. Simple polygons have that area in ideal arithmetic; this binary64 implementation assumes suitable finite intermediates, can lose precision by cancellation and does not independently validate outline simplicity or numerical range.
 * @evidence contracts/common.md#clear-and-simple-design One area measure for every zone, exclusion and piece in the pattern take-off, so all quantities are measured alike.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no outline and applies no threshold; the run's own area epsilon is applied by the caller where it decides presence.
 * @evidence contracts/common.md#meaningful-documentation States the closing rule, that winding does not matter, the unit, and the zero answer for a degenerate outline.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the corners with constant extra space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure sum over one outline that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates nothing beyond scalars, so nothing outlives the call.
 */
export const autoMoviePatternPolygonArea: (
  polygon: readonly IAutoMoviePatternPoint[],
) => number = (polygon: readonly IAutoMoviePatternPoint[]): number => {
  let twice: number = 0;
  for (let index: number = 0; index < polygon.length; ++index) {
    const from: IAutoMoviePatternPoint = polygon[index]!;
    const to: IAutoMoviePatternPoint = polygon[(index + 1) % polygon.length]!;
    twice += from.u * to.v - to.u * from.v;
  }
  return Math.abs(twice) / 2;
};
