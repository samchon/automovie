import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * Map one non-negative film-frame boundary to seconds on the film clock.
 *
 * The boundary of frame `f` at rate `n/d` lies at `f·d/n` seconds. The rate is
 * reduced to lowest terms first, so two spellings of one rate give the same
 * bits, and the result is the correctly rounded double of that ratio while
 * `f·d` stays within `Number.MAX_SAFE_INTEGER`; beyond it the product itself
 * rounds. Callers that compare a time with a frame boundary read it here, so
 * they all compare against the same double. A frame that is not a
 * non-negative safe integer, and an invalid frame rate, throw an `Error`.
 *
 * @param props.frame Film-frame boundary index, a non-negative safe integer.
 * @param props.frameRate The film's frame rate as an exact ratio.
 * @returns The boundary's time in seconds.
 *
 * @evidence contracts/common.md#principled-implementation One multiplication of exact integers and one IEEE division, which is correctly rounded, so the boundary is the nearest double to the exact rational while `f·d` is a safe integer, a limitation the documentation states; reducing the rate first makes equal rates produce equal bits.
 * @evidence contracts/common.md#clear-and-simple-design The single seconds form of a frame boundary, read by effect materialization, interval projection and frame ownership so their half-open comparisons agree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rate or frame is special-cased and no epsilon is added; callers compare against these exact doubles instead of tolerancing.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the reduction and why it matters, the precision bound, why callers share it, and both thrown conditions.
 * @evidence contracts/performance.md#efficient-algorithms Constant time apart from the frame-rate reduction's Euclidean algorithm, logarithmic in the rate terms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call answers one boundary independently; the frame-ownership walk calls it per candidate frame, and caching those few doubles would cost more than recomputing them.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the reduced rate record and retains nothing.
 */
export const productionFrameBoundaryToSeconds = (props: {
  frame: number;
  frameRate: IAutoMovieProductionFrameRate;
}): number => {
  if (Number.isSafeInteger(props.frame) === false || props.frame < 0)
    throw new Error(
      `Production frame boundary ${props.frame} must be a nonnegative safe integer.`,
    );
  const rate: IAutoMovieProductionFrameRate = canonicalProductionFrameRate(
    props.frameRate,
  );
  return (props.frame * rate.denominator) / rate.numerator;
};
