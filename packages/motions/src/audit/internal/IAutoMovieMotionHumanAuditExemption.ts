/**
 * One declared self-contact's film window and unordered bone-pair keys. A
 * missing depth skips the pairs; a supplied depth keeps their original measured
 * excess only beyond that allowance.
 */
export interface IAutoMovieMotionHumanAuditExemption {
  /** First active film second, inclusive. */
  from: number;

  /** Last active film second, inclusive. */
  to: number;

  /**
   * Owned unordered bone-pair key list, produced by the tangle audit's key
   * owner.
   */
  pairs: string[];

  /** Allowed excess depth, metres; absent to skip these pairs altogether. */
  depth?: number;
}
