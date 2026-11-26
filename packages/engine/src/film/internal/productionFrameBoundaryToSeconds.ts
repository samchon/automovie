import type {
  IAutoMovieProductionFrameBoundaryToSeconds,
  IAutoMovieProductionFrameRate,
} from "@automovie/interface";

import { canonicalProductionFrameRate } from "./canonicalProductionFrameRate";

/**
 * Map one non-negative film-frame boundary to seconds on the film clock.
 *
 * The boundary of frame `f` at rate `n/d` lies at `f·d/n` seconds. The rate is
 * reduced to lowest terms first, so two spellings of one rate give the same
 * bits, and the result is the correctly rounded double of that ratio while
 * `f·d` stays within `Number.MAX_SAFE_INTEGER`; beyond it the product itself
 * rounds. Callers that compare a time with a frame boundary read it here, so
 * they all compare against the same double. A frame that is not a non-negative
 * safe integer, and an invalid frame rate, throw an `Error`.
 *
 * @param props.frame Film-frame boundary index, a non-negative safe integer.
 * @param props.frameRate The film's frame rate as an exact ratio.
 * @returns The boundary's time in seconds.
 */
export function productionFrameBoundaryToSeconds(
  props: IAutoMovieProductionFrameBoundaryToSeconds.IProps,
): number {
  if (props.frame < 0)
    throw new Error(
      `Production frame boundary ${props.frame} must be a nonnegative safe integer.`,
    );
  const rate: IAutoMovieProductionFrameRate = canonicalProductionFrameRate(
    props.frameRate,
  );
  return (props.frame * rate.denominator) / rate.numerator;
}
