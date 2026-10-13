/**
 * Why a metric produced no value, and what would change that.
 *
 * The two fields mirror the render report's analysis gap deliberately: one
 * project should have one way of saying "this was not measured", and a second
 * spelling of the same idea is how two artifacts start disagreeing about what
 * an absent number means.
 *
 * @evidence contracts/common.md#principled-implementation A reason and remedy pair is the shape the run outcome's negative arms and the report gap also use, so a value-less metric reaches the report by copying both strings into one gap row.
 * @evidence contracts/common.md#clear-and-simple-design Two strings with no code or severity field, because the owning metric's status already says whether the absence is unsupported or not run.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The metric builder throws when a value-less metric has no gap rather than inventing placeholder text, and run validation refuses either string when it is blank after trimming.
 * @evidence contracts/common.md#meaningful-documentation States that both fields are non-blank, that the remedy names the change that would produce a value, and why the shape matches the render gap.
 */
export interface IAutoMovieAnalysisMetricGap {
  /** Non-blank statement of what is missing or unimplemented. */
  reason: string;

  /** Non-blank statement of the exact change that would produce a value. */
  remedy: string;
}
