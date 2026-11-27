import type {
  IAutoMovieByteDigest,
  IAutoMovieFileReceipt,
  IAutoMovieRecoveryCompletion,
  IAutoMovieRecoveryModelCounts,
} from "..";

/**
 * Final local reconstruction and independently useful partial publication
 * receipts.
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
