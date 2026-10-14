/**
 * Result of comparing required subject viewpoints with current observations.
 *
 * @evidence contracts/common.md#principled-implementation Coverage classifies subject-view receipts by viewpoint and supplied revision, compile, plan and capture-runtime identity strings, then projects observed, missing and stale ids in plan order; it does not derive those identities from the nested runtime or artifact bytes.
 * @evidence contracts/common.md#clear-and-simple-design Separate planned, observed, stale, unplanned and foreign populations expose why coverage is incomplete, while one state ladder summarizes the result without hiding duplicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty plans are indeterminate rather than reviewed; frame evidence, malformed records and other subjects are foreign, and stale or unplanned views cannot discharge required current viewpoints.
 * @evidence contracts/common.md#meaningful-documentation Defines the state and each population's current-versus-stale meaning, plan order, foreign count and redundant current records.
 * @author Samchon
 */
export interface IAutoMovieSubjectReviewCoverage {
  /** Derived execution state for this subject and plan. */
  state: "indeterminate" | "not-run" | "partial" | "stale" | "reviewed";

  /** Required viewpoint ids in declared plan order. */
  planned: string[];

  /** Required viewpoint ids covered at the current subject revision. */
  observed: string[];

  /** Required viewpoint ids with no current observation. */
  missing: string[];

  /** Required viewpoint ids observed only at another revision. */
  stale: string[];

  /** Extra current observations for a viewpoint outside the plan. */
  unplanned: string[];

  /** Records for another subject or another evidence kind. */
  foreign: number;

  /** Redundant current records beyond the first record per viewpoint. */
  duplicates: number;
}
