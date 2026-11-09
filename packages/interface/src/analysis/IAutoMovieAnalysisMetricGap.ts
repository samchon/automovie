/**
 * Why a metric produced no value, and what would change that.
 *
 * The two fields match the render inventory's `IAutoMovieRenderAnalysisGap` so
 * the project has one way of saying "this was not measured".
 *
 * @evidence contracts/development/design.md#principled-representation A reason and remedy pair that `validateAutoMovieAnalysisRun` requires to be non-blank on every value-less metric; the summarizer copies both verbatim into the report gap.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two strings with no code field, matching the render inventory's analysis gap so readers parse one shape for an absent number.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing fills a default reason; `autoMovieAnalysisMetric` throws when a null value arrives without a gap.
 * @evidence contracts/development/common.md#meaningful-documentation States what each string must say, that both are non-blank, and which render record shares the shape.
 */
export interface IAutoMovieAnalysisMetricGap {
  /** Non-blank statement of what is missing or unimplemented. */
  reason: string;

  /** Non-blank statement of the exact change that would produce a value. */
  remedy: string;
}
