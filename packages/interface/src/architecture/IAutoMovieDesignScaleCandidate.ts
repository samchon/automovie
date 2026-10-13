/** One reading of how long a source unit is on the ground. */
export interface IAutoMovieDesignScaleCandidate {
  /** Stable candidate identity within the frame. */
  id: string;

  /** Metres per one source unit; strictly positive. */
  metersPerUnit: number;

  /** Inclusive `[0, 1]` confidence in this reading. */
  confidence: number;

  /** Where the reading came from, such as `scale-bar` or `dimension-string`. */
  basis: string;
}
