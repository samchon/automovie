/**
 * One reading deliberately left as observation, and why.
 *
 * Promotion tests a candidate in a fixed order (`unobserved`,
 * `ambiguous-candidate`, `open-issue`, `low-confidence`,
 * `unsupported-geometry`, `unknown-scale`) and records only the first reason
 * that applies, even when several do.
 *
 * @evidence contracts/common.md#principled-implementation Names the first reason in promotion's fixed check order that kept a candidate an observation, with a generated sentence that names the competing ids, blocking issues, confidence and floor, offending primitive, or unscaled frame.
 * @evidence contracts/common.md#clear-and-simple-design A candidate id, one closed reason, and one detail sentence; a single row per candidate keeps the promotion a partition rather than a multimap.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The six reasons are the contract's closed vocabulary; an `ambiguous-candidate` is never resolved by picking one reading, and the detail tells the author to settle it in the building source.
 * @evidence contracts/common.md#meaningful-documentation States which candidate, the closed reason family, the order in which reasons are tested, that only the first is kept, and what the detail describes.
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

  /** Human-readable statement of what would have to change. */
  detail: string;
}
