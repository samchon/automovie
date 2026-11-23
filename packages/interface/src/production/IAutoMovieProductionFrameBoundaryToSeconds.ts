import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/** Film boundary and rational frame rate for the common seconds conversion. */
export namespace IAutoMovieProductionFrameBoundaryToSeconds {
  /**
   * Map one non-negative film-frame boundary to seconds on the film clock.
   *
   * The boundary of frame `f` at rate `n/d` lies at `f·d/n` seconds. The rate
   * is reduced to lowest terms first, so two spellings of one rate give the
   * same bits, and the result is the correctly rounded double of that ratio
   * while `f·d` stays within `Number.MAX_SAFE_INTEGER`; beyond it the product
   * itself rounds. Callers that compare a time with a frame boundary read it
   * here, so they all compare against the same double. A frame that is not a
   * non-negative safe integer, and an invalid frame rate, throw an `Error`.
   */
  export type IProps = {
    /**
     * Nonnegative safe integer film-boundary index, not a duration. A frame
     * owns time from this boundary through, but excluding, the next boundary.
     */
    frame: number;
    /**
     * Positive rational film frames per second, validated and reduced by
     * canonicalProductionFrameRate before conversion.
     */
    frameRate: IAutoMovieProductionFrameRate;
  };
}
