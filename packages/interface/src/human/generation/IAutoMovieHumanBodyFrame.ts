/**
 * Type contracts exchanged by AutoMovieHumanBodyFrame; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanBodyFrame exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IOutput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanBodyFrame; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IOutput contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanBodyFrame {
  /** Calibration-mm AP datums, with +X forward, +Y up and +Z left.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Calibration-mm AP datums, with +X forward, +Y up and +Z left.
   * @evidence contracts/development/design.md#principled-representation `cervicale`: Registered C7 skin datum relative to the ankle midpoint. `perineum`: Shared lower-body sagittal datum, at the original perineal pole.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyFrame.create. Also types AutoMovieHumanBodyLaneInterim.placed, AutoMovieHumanBodySources.frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `cervicale`, `perineum`; callers supply the complete record.
   */
  export interface IOutput {
    /** Registered C7 skin datum relative to the ankle midpoint. */
    cervicale: number;

    /** Shared lower-body sagittal datum, at the original perineal pole. */
    perineum: number;
  }
}
