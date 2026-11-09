/**
 * Exact original curve and continuation byte identities for coefficient admission.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 */
export interface IAutoMovieRecoveryInputHashes {
  /** SHA-256 of the original saved coefficient bundle bytes. */
  curveBundleSha256: string;

  /** SHA-256 of the original saved continuation graph bytes. */
  continuationSha256: string;
}
