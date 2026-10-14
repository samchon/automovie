import type { IAutoMovieMeshAttachmentCap } from "./IAutoMovieMeshAttachmentCap";

/**
 * Outcome of one full compiled mesh separation measurement.
 *
 * `certified` means the complete feature has at least the requested
 * separation; false means unproved, including touches, crossings and rounding
 * at an exact limit. It never diagnoses penetration or selects a closest point.
 * With attachment metadata, `lowerBound` is zero and certification is the
 * combined bounded-contact and strict-other-face proof.
 *
 * @evidence contracts/common.md#principled-implementation The running bound starts at the target, the clearance or the smallest positive binary64 at zero, and falls only to a triangle's conservative projection bound below it, so `certified` is exactly `lowerBound > 0 && lowerBound >= clearance` over a bound that never overstates separation.
 * @evidence contracts/common.md#clear-and-simple-design Carries the decision, the proof bound, the limiting face, the spent work and the attachment caps, which is what a caller needs to accept a row, report the blocking face and account its budget without a second query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The bound is capped at the target rather than refined toward a true distance, and an attachment result reports zero instead of a positive bound it did not prove, so no field claims more than the walk established.
 * @evidence contracts/common.md#meaningful-documentation States what certified and its negation mean, the cap and zero-clearance meaning of the bound, the limiting-triangle sentinel and tie rule, the budget count, and the attachment cap order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result record; the walk that fills it is answered on the separation query.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per call and never shared with a later call; the query keeps no reference to it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns scalars plus one cap record per admitted attachment support, at most the attachment's support count, released with the caller's result.
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationResult {
  /** Whether the complete feature proved at least the requested separation. */
  certified: boolean;

  /**
   * Proved separation lower bound in metres, capped at the requested
   * clearance. At zero clearance a separated feature reports `Number.MIN_VALUE`,
   * the weakest positive bound, not a distance estimate; an attachment query
   * always reports zero.
   */
  lowerBound: number;

  /**
   * Original ordinal of the limiting triangle, the one whose bound is the
   * smallest below the target, or of the attachment support that failed its
   * cap; -1 when no bound fell below the target. Equal bounds keep the
   * smallest ordinal.
   */
  triangle: number;

  /** Work units this query spent from the shared budget. */
  examined: number;

  /**
   * Contact caps proved on the attachment supports, in support order up to
   * the first support that failed; empty without an attachment.
   */
  attachmentCaps: IAutoMovieMeshAttachmentCap[];
}
