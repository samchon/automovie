/** Result of comparing required subject viewpoints with current observations. */
export interface IAutoMovieSubjectReviewCoverage {
  /** Derived execution state for this subject and plan. */
  state: "indeterminate" | "not-run" | "partial" | "stale" | "reviewed";

  /** Required viewpoint ids in declared plan order. */
  planned: string[];

  /**
   * Required viewpoint ids covered by the current revision, compile, plan and
   * runtime identities.
   */
  observed: string[];

  /** Required viewpoint ids with no current observation. */
  missing: string[];

  /**
   * Required viewpoint ids observed only with a different revision, compile,
   * plan or runtime identity.
   */
  stale: string[];

  /** Extra current observations for a viewpoint outside the plan. */
  unplanned: string[];

  /** Records for another subject or another evidence kind. */
  foreign: number;

  /** Redundant current records beyond the first record per viewpoint. */
  duplicates: number;
}
