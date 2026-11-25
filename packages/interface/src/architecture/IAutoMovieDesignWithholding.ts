/**
 * One reading deliberately left as observation, and why.
 *
 * Promotion tests a candidate in a fixed order (`unobserved`,
 * `ambiguous-candidate`, `open-issue`, `low-confidence`,
 * `unsupported-geometry`, `unknown-scale`) and records only the first reason
 * that applies, even when several do.
 */
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

  /**
   * Engine-written sentence naming the blocking fact: the competing candidates,
   * the open issues, the confidence against the floor, the primitive without an
   * outline, or the frame without a settled scale.
   */
  detail: string;
}
