/** One reading deliberately left as observation, and why. */
export interface IAutoMovieDesignWithholding {
  /** Candidate that stays an observation. */
  candidate: string;

  /** Closed reason family that kept it unpromoted. */
  reason:
    | "unobserved"
    | "unknown-scale"
    | "ambiguous-candidate"
    | "open-issue"
    | "low-confidence"
    | "unsupported-geometry";

  /** Human-readable statement of what would have to change. */
  detail: string;
}
