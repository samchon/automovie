import type { IAutoMovieFileReceipt } from "../../index";

/**
 * Persisted generating array fragment with exact byte and item populations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Number of values in the persisted array fragment.
 * @evidence contracts/development/design.md#principled-representation Persisted generating array fragment with exact byte and item populations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryFrontierChannel share IAutoMovieRecoveryArrayFragment's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryArrayFragment extends IAutoMovieFileReceipt {
  /** Number of values in the persisted array fragment. */
  items: number;
}
