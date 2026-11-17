/**
 * An omitted domain and its mandatory textual cause.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identity of the omitted domain. Nonempty original diagnostic cause.
 * @evidence contracts/development/design.md#principled-representation Optional producer record retained without assuming a shared payload shape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface assembleAutoMovieRecoveryFieldComplex share IAutoMovieRecoveryUnsupportedDomain's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Identity of the omitted domain.
 */

export interface IAutoMovieRecoveryUnsupportedDomain {
  /** Identity of the omitted domain. */
  id: string;

  /** Nonempty original diagnostic cause. */
  reason: string;

  /** Optional producer record retained without assuming a shared payload shape. */
  detail?: unknown;
}
