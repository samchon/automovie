import type { IAutoMovieConstructionParallelAxis } from "../../../construction/IAutoMovieConstructionParallelAxis";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanTrunkAxis; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkAxis {
  /**
   * One declaration shared by the original part and production tree.
   *
   * @evidence contracts/common.md#principled-implementation Pairs the actual metre axis with the calibration-mm world-back source used to derive it; neither record asserts final surface fidelity.
   * @evidence contracts/common.md#clear-and-simple-design Holds the two outputs of one placement operation without a second geometry owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no sampled replacement, person selector or fallback result.
   * @evidence contracts/common.md#meaningful-documentation Both fields document units, frame and source ownership.
   * @evidence contracts/performance.md#efficient-algorithms The record stores references to the two O(n)-sized declarations and performs no computation itself.
   * @evidence contracts/performance.md#reuse-equivalent-work Consumers share this call's axis declaration rather than reconstructing placement.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains these plain data until its source result is released; there is no cache or external resource.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One declaration shared by the original part and production tree.
   * @evidence contracts/development/design.md#principled-representation `axis`: Fixed +X/+Z level planes; coordinate lengths and endpoint stations are metres. `back`: Actual world-back declaration, calibration mm, in the radial source parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkAxis.create. Also types AutoMovieHumanTrunkViewPart.axis.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `axis`, `back`; callers supply the complete record.
   */
  export interface IResult {
    /** Fixed +X/+Z level planes; coordinate lengths and endpoint stations are metres. */
    axis: IAutoMovieConstructionParallelAxis;
    /** Actual world-back declaration, calibration mm, in the radial source parameter. */
    back: IAutoMovieViewPart.IOutline;
  }
}
