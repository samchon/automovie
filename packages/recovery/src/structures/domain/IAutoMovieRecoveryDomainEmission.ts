/**
 * Actual triangle range emitted for one declared domain.
 *
 * @evidence contracts/common.md#principled-implementation A named output part and consecutive triangle ordinals describe geometry that was actually emitted.
 * @evidence contracts/common.md#clear-and-simple-design The optional patch identity supplements the part-relative range without replacing it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An emitted range does not establish ownership for another domain or certify its surface quality.
 * @evidence contracts/common.md#meaningful-documentation States triangle-ordinal units and that a null patch means unavailable attribution.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No runtime cache is defined.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records belong to the caller and hold no resource handles.
 */
export interface IAutoMovieRecoveryDomainEmission {
  /** Identity of the output model part. */
  part: string;

  /** First triangle ordinal within the named part. */
  firstTriangle: number;

  /** Number of consecutive triangles in this range. */
  triangleCount: number;

  /** Named analytic patch, or null when unavailable. */
  patch: string | null;
}
