/**
 * Observed crease addressed in one feature chart's vertex table. a/b are
 * chart-local vertex ordinals, sourceEdge and the readonly pair of sourceFaces
 * preserve original acquisition identity, and angleDegrees retains the
 * incident-face measurement.
 */
export interface IAutoMovieRecoveryIndexedCrease {
  /** First endpoint index in the current chart's vertex array. */
  a: number;

  /** Second endpoint index in the current chart's vertex array. */
  b: number;

  /**
   * Original source-edge identity; coincident edges with different incidence
   * remain distinct.
   */
  sourceEdge: string;

  /** Original source-face ordinals belonging to this observed chart or feature. */
  sourceFaces: readonly [number, number];

  /** Measured angle between the incident source faces, in degrees. */
  angleDegrees: number;
}
