/**
 * Type contracts exchanged by AutoMovieHumanDigitRing; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanDigitRing exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ControlsResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanDigitRing; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ControlsResult contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanDigitRing {
  /** Result of AutoMovieHumanDigitRing.controls. The ring's control points in its plane, phase `2 pi m / count` from the
  radial side point toward the palm.
  @param shape The section's shape, mm.
  @param count Control points, a multiple of 4 with at least 16.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The ring's control points in its plane, phase `2 pi m / count` from the radial side point toward the palm.
 * @evidence contracts/development/design.md#principled-representation The ring's control points in its plane, phase `2 pi m / count` from the radial side point toward the palm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitRing.ControlsResult is the canonical exchange used by AutoMovieHumanDigitRing.controls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitRing.controls for the ring's control points in its plane, phase `2 pi m / count` from the radial side point toward the palm.
 */
  export type ControlsResult = [number, number][];
}
