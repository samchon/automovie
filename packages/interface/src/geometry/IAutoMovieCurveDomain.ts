/** A finite, strictly increasing interval in a curve's own parameter chart. */
export interface IAutoMovieCurveDomain {
  /** Inclusive start parameter. */
  readonly start: number;

  /** Inclusive end parameter, strictly greater than `start`. */
  readonly end: number;
}
