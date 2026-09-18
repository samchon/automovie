import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Result of rolling back one untouched applied import.
 *
 * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-downgrade-rollback-compatibility Exposes `IAutoMovieLegacyImportRollbackOutput` as the portable data boundary for the operations downgrade rollback compatibility requirement.
 * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-downgrade-rollback-compatibility Types `IAutoMovieLegacyImportRollbackOutput` for the execution downgrade rollback compatibility system contract.
 */
export interface IAutoMovieLegacyImportRollbackOutput {
  /**
   * Rollback completion marker.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-downgrade-rollback-compatibility Exposes `status` as the portable data boundary for the operations downgrade rollback compatibility requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-downgrade-rollback-compatibility Types `status` for the execution downgrade rollback compatibility system contract.
   */
  status: "rolled-back";
  /**
   * Fingerprint of the removed import plan.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-downgrade-rollback-compatibility Exposes `fingerprint` as the portable data boundary for the operations downgrade rollback compatibility requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-downgrade-rollback-compatibility Types `fingerprint` for the execution downgrade rollback compatibility system contract.
   */
  fingerprint: AutoMovieContentDigest;
}
