/**
 * One reading of how long a source unit is on the ground.
 *
 * Several readings may sit on one frame; only the one the frame's `scale` names
 * is used to convert points to metres. A candidate's confidence is recorded for
 * the reader and is not consulted by promotion.
 */
export interface IAutoMovieDesignScaleCandidate {
  /** Stable, non-blank candidate identity, unique within the frame. */
  id: string;

  /** Metres per one source unit; finite and strictly positive. */
  metersPerUnit: number;

  /** Inclusive `[0, 1]` confidence in this reading. */
  confidence: number;

  /** Non-blank origin of the reading, such as `scale-bar` or `dimension-string`. */
  basis: string;
}
