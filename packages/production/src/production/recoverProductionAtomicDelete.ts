

/**
 * Attempt guarded restoration from quarantine, then rethrow the deletion failure.
 *
 * Restoration requires a retained quarantine and an unoccupied target, with namespace guards before observation, before restoration and afterward. These observations do not atomically reserve the path; the atomic-delete caller owns the physical fences and restore operation.
 *
 * @evidence contracts/common.md#principled-implementation The guarded conditional restore preserves a replacement target and refuses a changed namespace. Recovery failure aggregates the original and secondary values; successful or skipped recovery still throws the original deletion failure.
 * @evidence contracts/common.md#clear-and-simple-design The caller supplies residency checks and restoration, while this function owns only their order and error accounting; no second filesystem implementation is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An occupied target is not overwritten, missing quarantine is not fabricated, and no successful deletion is reported after recovery. Ordinary callback observations leave external race limitations with the filesystem owner.
 * @evidence contracts/common.md#meaningful-documentation Documents the three guard positions, restore preconditions, residual race premise and never-returning error contract, including an original undefined value.
 * @evidence contracts/performance.md#efficient-algorithms At most three guards, two short-circuit residency checks and one restoration run; actual stat/rename/fence costs belong to these callbacks, with at most two retained error causes.
 * @evidence contracts/performance.md#reuse-equivalent-work Quarantine and occupancy are freshly observed for this failed deletion; a previous recovery cannot establish equivalence for a mutable namespace.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The atomic-delete owner created and owns quarantine. This helper opens no handle and owns no task; skipped or failed restoration can leave quarantine bytes resident for caller recovery, without a byte bound here.
 */
export function recoverProductionAtomicDelete(
  props: {
  /** Owned path whose deletion failed. */
  file: string;

  /** Original deletion or cleanup failure. */
  error: unknown;

  /** Refuse recovery in a replacement namespace. */
  guard: () => void;

  /** Whether the original quarantined entry remains available. */
  quarantined: () => boolean;

  /** Whether the original target path is occupied again. */
  occupied: () => boolean;

  /** Restore only the unoccupied target from its retained quarantine. */
  restore: () => void;
}
): never {
  try {
    props.guard();
    if (props.quarantined() && props.occupied() === false) {
      props.guard();
      props.restore();
      props.guard();
    }
  } catch (recoveryFailure) {
    throw new AggregateError(
      [props.error, recoveryFailure],
      `Production atomic delete recovery failed after the operation failed: ${props.file}.`,
    );
  }
  throw props.error;
}
