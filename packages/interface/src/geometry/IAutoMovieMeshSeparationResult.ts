import type { IAutoMovieMeshAttachmentCap } from "./IAutoMovieMeshAttachmentCap";

/**
 * Outcome of one full compiled mesh separation measurement.
 *
 * `certified` means the complete feature has at least the requested separation;
 * false means unproved, including touches, crossings and rounding at an exact
 * limit. It never diagnoses penetration or selects a closest point. With
 * attachment metadata, `lowerBound` is zero and certification is the combined
 * bounded-contact and strict-other-face proof.
 */
export interface IAutoMovieMeshSeparationResult {
  /** Whether the complete feature proved at least the requested separation. */
  certified: boolean;

  /**
   * Proved separation lower bound in metres, capped at the requested clearance.
   * At zero clearance a separated feature reports `Number.MIN_VALUE`, the
   * weakest positive bound, not a distance estimate; an attachment query always
   * reports zero.
   */
  lowerBound: number;

  /**
   * Original ordinal of the limiting triangle, the one whose bound is the
   * smallest below the target, or of the attachment support that failed its
   * cap; -1 when no bound fell below the target. Equal bounds keep the smallest
   * ordinal.
   */
  triangle: number;

  /** Work units this query spent from the shared budget. */
  examined: number;

  /**
   * Contact caps proved on the attachment supports, in support order up to the
   * first support that failed; empty without an attachment.
   */
  attachmentCaps: IAutoMovieMeshAttachmentCap[];
}
