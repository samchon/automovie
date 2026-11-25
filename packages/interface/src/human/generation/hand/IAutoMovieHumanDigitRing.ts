/**
 * Type contracts exchanged by AutoMovieHumanDigitRing; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanDigitRing {
  /**
   * Result of AutoMovieHumanDigitRing.controls. The ring's control points in
   * its plane, phase `2 pi m / count` from the radial side point toward the
   * palm.
   *
   * @param shape The section's shape, mm.
   * @param count Control points, a multiple of 4 with at least 16.
   */
  export type ControlsResult = [number, number][];
}
