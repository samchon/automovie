/**
 * One reading deliberately left as observation, and why.
 *
 * Promotion tests a candidate in a fixed order (`unobserved`,
 * `ambiguous-candidate`, `open-issue`, `low-confidence`,
 * `unsupported-geometry`, `unknown-scale`) and records only the first reason
 * that applies, even when several do.
 *
 * @evidence contracts/common.md#principled-implementation `promoteDesignObservations` runs six gates in a fixed sequence and returns at the first failure: no observed analysis produced it, it lists an alternative, it lists an open issue, its confidence is below the floor, a primitive is not line, polyline, or region, or a frame has no settled scale.
 * @evidence contracts/common.md#clear-and-simple-design One closed reason plus an engine-written detail per candidate, so a caller can branch on the reason and show the detail without parsing either.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A candidate with rivals is withheld rather than resolved by picking the most confident one, and only the first reason is reported instead of a list a caller might read as a checklist.
 * @evidence contracts/common.md#meaningful-documentation States the gate order, that only the first failing reason is recorded, and what facts the detail sentence names for each reason.
 * @author Samchon
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
   * Engine-written sentence naming the blocking fact: the competing
   * candidates, the open issues, the confidence against the floor, the
   * primitive without an outline, or the frame without a settled scale.
   */
  detail: string;
}
