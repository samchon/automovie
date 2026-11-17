/** Type contracts exchanged by AutoMovieHumanDigitRing; runtime evaluation remains in Human. */
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
