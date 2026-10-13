/**
 * Result of comparing required subject viewpoints with current observations.
 *
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
