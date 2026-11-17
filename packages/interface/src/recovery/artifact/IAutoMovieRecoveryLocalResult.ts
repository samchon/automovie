import type {
  IAutoMovieByteDigest,
  IAutoMovieFileReceipt,
  IAutoMovieRecoveryCompletion,
  IAutoMovieRecoveryModelCounts,
} from "../../index";

/**
 * Final local reconstruction and independently useful partial publication receipts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Actual emitted base and retained-open populations. Processing and retained-domain qualifications.
 * @evidence contracts/development/design.md#principled-representation Optional repeated standalone open-prefix publications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface reconstructAutoMovieRecoveryLocal share IAutoMovieRecoveryLocalResult's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual emitted base and retained-open populations.
 */

export interface IAutoMovieRecoveryLocalResult extends IAutoMovieByteDigest {
  /** Actual emitted base and retained-open populations. */
  counts: IAutoMovieRecoveryModelCounts;

  /** Processing and retained-domain qualifications. */
  completion: IAutoMovieRecoveryCompletion;

  /** Optional repeated standalone open-prefix publications. */
  checkpoints: IAutoMovieFileReceipt[];

  /** Always-published analytic and retained-closed base. */
  baseCheckpoint: IAutoMovieFileReceipt;

  /** Last closed seven-channel journal record. */
  frontier: IAutoMovieFileReceipt;
}
