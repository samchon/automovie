/**
 * Measured motion across a valid continuous placed edge.
 */
export interface IAutoMoviePlacedContinuityMotionDelta {
  /** Position displacement in metres. */
  readonly distance: number;
  /** Shortest angular separation in radians. */
  readonly angle: number;
}
