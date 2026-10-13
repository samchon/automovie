/**
 * Why a metric produced no value, and what would change that.
 *
 * The two fields mirror the render report's analysis gap deliberately: one
 * project should have one way of saying "this was not measured", and a second
 * spelling of the same idea is how two artifacts start disagreeing about what
 * an absent number means.
 */
export interface IAutoMovieAnalysisMetricGap {
  /** Non-blank statement of what is missing or unimplemented. */
  reason: string;

  /** Non-blank statement of the exact change that would produce a value. */
  remedy: string;
}
