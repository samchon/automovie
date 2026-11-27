import type { IAutoMovieConstructionParallelAxis } from "../construction/IAutoMovieConstructionParallelAxis";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";

/**
 * A canonical metre axis and its original calibration-millimetre back outline
 * in the same source clock.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkAxis in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkAxis {
  /**
   * One declaration shared by the original part and production tree.
   *
   * Pairs the actual metre axis with the calibration-mm world-back source used
   * to derive it; neither record asserts final surface fidelity. Holds the two
   * outputs of one placement operation without a second geometry owner.
   * Contains no sampled replacement, person selector or fallback result. Both
   * fields document units, frame and source ownership. The record stores
   * references to the two O(n)-sized declarations and performs no computation
   * itself. Consumers share this call's axis declaration rather than
   * reconstructing placement. The caller retains these plain data until its
   * source result is released; there is no cache or external resource.
   */
  export interface IResult {
    /**
     * Fixed +X/+Z level planes; coordinate lengths and endpoint stations are
     * metres.
     */
    axis: IAutoMovieConstructionParallelAxis;
    /**
     * Actual world-back declaration, calibration mm, in the radial source
     * parameter.
     */
    back: IAutoMovieViewPart.IOutline;
  }
}
