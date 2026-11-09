/**
 * Actual triangle range emitted for one declared domain.
 *
 * @evidence contracts/development/design.md#principled-representation A named output part and consecutive triangle ordinals describe geometry that was actually emitted.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The optional patch identity supplements the part-relative range without replacing it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An emitted range does not establish ownership for another domain or certify its surface quality.
 * @evidence contracts/development/common.md#meaningful-documentation States triangle-ordinal units and that a null patch means unavailable attribution.
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
