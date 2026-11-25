/**
 * An emitted contour triangle range without a unique declared group owner.
 * Saved physical interval endpoints and the original group ordinal remain
 * available for diagnosis; they do not fabricate a unique ledger-member
 * address.
 */
export interface IAutoMovieRecoveryDomainLedgerUnattributed {
  /** Identity of the output model part. */
  part: string;

  /** First triangle ordinal within the named part. */
  firstTriangle: number;

  /** Number of consecutive triangles in this range. */
  triangleCount: number;

  /** Start of the original longitudinal interval, millimetres. */
  beforeMm: number;

  /** End of the original longitudinal interval, millimetres. */
  afterMm: number;

  /** Original saved group ordinal within its interval. */
  group: number;
}
