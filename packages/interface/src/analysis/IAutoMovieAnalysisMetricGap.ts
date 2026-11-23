/**
 * Why a metric produced no value, and what would change that.
 *
 * The two fields match the render inventory's `IAutoMovieRenderAnalysisGap` so
 * the project has one way of saying "this was not measured".
 */
export interface IAutoMovieAnalysisMetricGap {
  /** Non-blank statement of what is missing or unimplemented. */
  reason: string;

  /** Non-blank statement of the exact change that would produce a value. */
  remedy: string;
}
