import type { IAutoMovieMeshAttachmentCap } from "./IAutoMovieMeshAttachmentCap";

/**
 * Outcome of one compiled mesh separation query.
 *
 * `certified` means the complete feature has at least the requested
 * separation; false means unproved, including touches, crossings and rounding
 * at an exact limit. It never diagnoses penetration or selects a closest point.
 * With attachment metadata, `lowerBound` is zero and certification is the
 * combined bounded-contact and strict-other-face proof.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationResult {
  /** Whether the complete feature proved at least the requested separation. */
  certified: boolean;

  /**
   * Proved separation lower bound in metres, capped at the requested clearance;
   * MIN_VALUE is the weak first-positive bound at zero clearance and zero is
   * reported for an attachment query.
   */
  lowerBound: number;

  /**
   * Original limiting triangle ordinal, or -1 when no individual triangle
   * lowered the target-capped bound; ties keep the smallest ordinal.
   */
  triangle: number;

  /** Work units this query spent from the shared budget. */
  examined: number;

  /** Contact caps proved on each attachment support, in support order. */
  attachmentCaps: IAutoMovieMeshAttachmentCap[];
}
