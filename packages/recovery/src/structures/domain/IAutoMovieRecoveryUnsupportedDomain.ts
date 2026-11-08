/**
 * An omitted domain and its mandatory textual cause.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing producer's quantities, units and discriminants without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural contract names the record shared by its actual producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration computes no geometry and supplies no inferred data or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members state units, ownership and qualification or absence semantics.
 */
export interface IAutoMovieRecoveryUnsupportedDomain {
  /** Identity of the omitted domain. */
  id: string;

  /** Nonempty original diagnostic cause. */
  reason: string;

  /** Optional producer record retained without assuming a shared payload shape. */
  detail?: unknown;
}
