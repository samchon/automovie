/**
 * Original saved longitudinal interval and group address.
 *
 * @evidence contracts/common.md#principled-implementation The interval ordinal and its local group ordinal identify the original saved longitudinal occurrence.
 * @evidence contracts/common.md#clear-and-simple-design A two-part address distinguishes a group from the same ordinal in another interval.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The address is a saved-graph identity, not a source-mesh index or spatial nearest match.
 * @evidence contracts/common.md#meaningful-documentation States the parent interval and interval-local group indexing scopes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No runtime cache is defined.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records belong to the caller and hold no resource handles.
 */
export interface IAutoMovieRecoveryDomainAddress {
  /** Original saved longitudinal interval ordinal. */
  interval: number;

  /** Original saved group ordinal within its interval. */
  group: number;
}
