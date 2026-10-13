
/**
 * Result of rolling back one untouched applied import while preserving legacy bytes.
 *
 * @evidence contracts/common.md#principled-implementation Rollback verifies the applied state, immutable plan and captured production-directory baseline under namespace and revision leases before removing import-owned state; its output identifies the removed plan.
 * @evidence contracts/common.md#clear-and-simple-design A single completion marker and fingerprint report the successful rollback; detailed evidence remains in the plan and changed imports fail instead of returning a partial success status.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Modified import files or changed production directories block rollback; pre-existing directories and legacy content are preserved rather than recursively erased as import output.
 * @evidence contracts/common.md#meaningful-documentation States the untouched-import precondition, preservation effect, successful completion marker and removed plan identity.
 * @author Samchon
 */
export interface IAutoMovieLegacyImportRollbackOutput {
  /** Rollback completion marker. */
  status: "rolled-back";

  /** Fingerprint of the removed import plan. */
  fingerprint: string;
}
