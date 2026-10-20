/**
 * Plain admitted metadata used only during one authority conversion pass.
 *
 * @evidence contracts/common.md#principled-implementation Unknown values remain subject to field-specific binding checks before use.
 * @evidence contracts/common.md#clear-and-simple-design One private record names the generic copied-data boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record supplies no geometry or unchecked default coefficients.
 * @evidence contracts/common.md#meaningful-documentation States plain-data scope and conversion-local ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A declaration retains no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The converter owns the referenced source and copy.
 */
export interface IRecoveryAuthorityRecord {
  [key: string]: unknown;
}
