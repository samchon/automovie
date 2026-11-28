/**
 * Closed curve interval with finite increasing endpoints in one parameter
 * chart.
 */
export interface IAutoMovieCurveDomain {
  /** Inclusive finite start in the associated source parameter unit. */
  readonly start: number;

  /** Inclusive finite end in that unit, strictly above start. */
  readonly end: number;
}
