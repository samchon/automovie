import { IAutoMovieProductionFrameRate } from "@automovie/interface";

/**
 * Estimate a frame from the float product, or `null` when it cannot be exact.
 *
 * The product `seconds * numerator / denominator`, rounded by the caller's
 * `round` and clamped at zero, only starts the search; callers settle the frame
 * by the exact boundary comparison the sampler performs. Two frames of
 * headroom below `Number.MAX_SAFE_INTEGER` keep that correction inside the
 * safe-integer range, and an infinite or NaN product fails the comparison and
 * is reported as unrepresentable.
 *
 * @evidence contracts/common.md#principled-implementation Uses the floating product only as a starting guess whose error is a few ulps, which the callers' boundary walks absorb by comparing `productionFrameBoundaryToSeconds` values; `Math.max(0, NaN)` stays NaN and `Infinity` exceeds the limit, so both fail the range test and return `null`. Beyond about `2^53 / denominator` frames the boundary arithmetic itself rounds, a limitation shared identically by the sampler, so the projection and sampler still agree.
 * @evidence contracts/common.md#clear-and-simple-design One helper owns the estimate and its safe-integer headroom for both frame searches, which differ only in rounding direction, so the rounding function is the parameter rather than two copies of the formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The estimate is never returned as the answer, and an unrepresentable time is reported as `null` for the caller to refuse rather than clamped to the largest frame.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the clamp at zero, that callers must settle the result by exact comparison, the two-frame headroom, and how non-finite products are reported.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: one multiply, one divide, one rounding call and one comparison, which lets the callers' boundary walks finish in a few steps instead of scanning frames from zero.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar computation per call; there is no completed or in-flight work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates nothing and holds no reference to `frameRate` after returning.
 */
export const estimateProductionFilmFrame = (
  seconds: number,
  frameRate: IAutoMovieProductionFrameRate,
  round: (value: number) => number,
): number | null => {
  const frame: number = Math.max(
    0,
    round((seconds * frameRate.numerator) / frameRate.denominator),
  );
  return frame <= Number.MAX_SAFE_INTEGER - 2 ? frame : null;
};
