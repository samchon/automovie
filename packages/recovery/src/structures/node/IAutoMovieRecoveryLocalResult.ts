import type { IAutoMovieRecoveryByteDigest } from "./IAutoMovieRecoveryByteDigest";
import type { IAutoMovieRecoveryCompletion } from "./IAutoMovieRecoveryCompletion";
import type { IAutoMovieRecoveryFileReceipt } from "./IAutoMovieRecoveryFileReceipt";
import type { IAutoMovieRecoveryModelCounts } from "./IAutoMovieRecoveryModelCounts";

/**
 * Final local reconstruction and independently useful partial publication receipts.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 */
export interface IAutoMovieRecoveryLocalResult extends IAutoMovieRecoveryByteDigest {
  /** Actual emitted base and retained-open populations. */
  counts: IAutoMovieRecoveryModelCounts;

  /** Processing and retained-domain qualifications. */
  completion: IAutoMovieRecoveryCompletion;

  /** Optional repeated standalone open-prefix publications. */
  checkpoints: IAutoMovieRecoveryFileReceipt[];

  /** Always-published analytic and retained-closed base. */
  baseCheckpoint: IAutoMovieRecoveryFileReceipt;

  /** Last closed seven-channel journal record. */
  frontier: IAutoMovieRecoveryFileReceipt;
}
