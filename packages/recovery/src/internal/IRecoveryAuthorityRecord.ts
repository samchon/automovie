/**
 * Plain admitted metadata used only during one authority conversion pass.
 *
 * @evidence contracts/development/design.md#principled-representation Unknown values remain subject to field-specific binding checks before use.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One private record names the generic copied-data boundary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record supplies no geometry or unchecked default coefficients.
 * @evidence contracts/development/common.md#meaningful-documentation States plain-data scope and conversion-local ownership.
 */
export interface IRecoveryAuthorityRecord {
  [key: string]: unknown;
}
