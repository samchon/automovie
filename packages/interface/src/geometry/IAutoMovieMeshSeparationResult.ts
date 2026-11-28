import type { IAutoMovieMeshAttachmentCap } from "./IAutoMovieMeshAttachmentCap";

/**
 * Conservative full-query receipt with certification, threshold-capped
 * distance, source witness, work and attachment caps.
 *
 * A failed proof can come from contact, crossing or rounding at the requested
 * bound. Attached certification combines the listed support caps with strict
 * positive separation from other resident faces.
 */
export interface IAutoMovieMeshSeparationResult {
  /**
   * Whether the complete feature passed the requested proof. An attachment
   * query can certify with a reported `lowerBound` of zero.
   */
  certified: boolean;

  /**
   * Proved metre lower bound capped at requested clearance. A detached
   * strict-zero success reports Number.MIN_VALUE and an attached query reports
   * zero.
   */
  lowerBound: number;

  /**
   * Original resident ordinal that supplied the smallest below-target bound,
   * with ties by lower ordinal. A failed attachment cap takes its support
   * ordinal; -1 means no such witness.
   */
  triangle: number;

  /**
   * Count of work units spent by this completed call, including seat, support
   * and hierarchy work it performed.
   */
  examined: number;

  /**
   * Proved contact caps in supplied support order, stopping at a failed support
   * proof. An unattached query returns an empty array.
   *
   * The output retains support order, including repeated ordinals when
   * supplied.
   */
  attachmentCaps: IAutoMovieMeshAttachmentCap[];
}
