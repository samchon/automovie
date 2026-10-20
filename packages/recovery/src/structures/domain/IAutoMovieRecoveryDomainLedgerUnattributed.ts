/**
 * An emitted contour triangle range without a unique declared group owner.
 * Saved physical interval endpoints and the original group ordinal remain available
 * for diagnosis; they do not fabricate a unique ledger-member address.
 *
 * @evidence contracts/common.md#principled-implementation The actual part-relative triangle range retains its original physical interval and group ordinal when unique ownership is unavailable.
 * @evidence contracts/common.md#clear-and-simple-design Unattributed ranges remain separate from members with a unique saved address.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical interval endpoints do not invent a unique ledger member or certify successful admission.
 * @evidence contracts/common.md#meaningful-documentation States triangle ordinals, millimetre interval endpoints and the unresolved ownership scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
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
