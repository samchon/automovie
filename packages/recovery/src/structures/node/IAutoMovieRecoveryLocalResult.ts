import type { IAutoMovieRecoveryByteDigest } from "./IAutoMovieRecoveryByteDigest";
import type { IAutoMovieRecoveryCompletion } from "./IAutoMovieRecoveryCompletion";
import type { IAutoMovieRecoveryFileReceipt } from "./IAutoMovieRecoveryFileReceipt";
import type { IAutoMovieRecoveryModelCounts } from "./IAutoMovieRecoveryModelCounts";

/**
 * Final local reconstruction and independently useful partial publication receipts.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/common.md#clear-and-simple-design One independently named record is shared by its producer and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Its runtime owner controls publication and computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Records remain caller-owned and the type acquires no resource handle.
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
