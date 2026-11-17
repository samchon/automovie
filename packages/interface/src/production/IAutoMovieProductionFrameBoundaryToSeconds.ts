import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";

/**
 * Film boundary and rational frame rate for the common seconds conversion.
 */
export namespace IAutoMovieProductionFrameBoundaryToSeconds {
  /**
   * Map one non-negative film-frame boundary to seconds on the film clock.
   *
   * The boundary of frame `f` at rate `n/d` lies at `f·d/n` seconds. The rate is reduced to lowest terms first, so two spellings of one rate give the same bits, and the result is the correctly rounded double of that ratio while `f·d` stays within `Number.MAX_SAFE_INTEGER`; beyond it the product itself rounds. Callers that compare a time with a frame boundary read it here, so they all compare against the same double. A frame that is not a non-negative safe integer, and an invalid frame rate, throw an `Error`.
   *
   * @evidence contracts/development/design.md#principled-representation frame is a nonnegative safe integer boundary and frameRate is rational frames per second; the result is frame * denominator / numerator seconds after rate reduction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface productionFrameBoundaryToSeconds gives effect ownership and sampling one common floating-point boundary value rather than independently multiplying by fps.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Input admission throws on invalid boundaries/rates. Above the exact-integer product range the multiplication rounds, so this contract does not promise arbitrary-precision seconds.
   * @evidence contracts/development/common.md#meaningful-documentation Film boundary and rational frame rate for the common seconds conversion. frame is a nonnegative safe integer boundary and frameRate is rational frames per second; the result is frame * denominator / numerator seconds after rate reduction.
   */
  export type IProps = {
    /**
     * Nonnegative safe integer film-boundary index, not a duration. A frame owns time from this boundary through, but excluding, the next boundary.
     */
    frame: number;
    /**
     * Positive rational film frames per second, validated and reduced by canonicalProductionFrameRate before conversion.
     */
    frameRate: IAutoMovieProductionFrameRate;
  };
}
