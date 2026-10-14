

/**
 * Apply ordered writes and restore published writes on a precommit failure.
 *
 * The synchronous adapter must notify immediately after each publication, once per write; notification records the row before the subsequent guard can fail. The committed notification ends rollback eligibility. A failed initial recovery guard refuses stale-path restoration; otherwise every recorded row is restored in reverse order, collecting failures without abandoning later rows.
 *
 * @evidence contracts/common.md#principled-implementation The callback protocol distinguishes publication from revision commitment. productionProjectCommitFiles supplies guarded atomic adapters and previous bytes; this coordinator cannot authenticate their notifications or independently establish namespace ownership.
 * @evidence contracts/common.md#clear-and-simple-design One ordered applied list and a commit flag expose recovery boundaries; path resolution, locks, byte restoration and atomic cleanup remain with the project transaction and its adapters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Postcommit failure reports committed state without rollback; an ownership refusal prevents stale-path recovery. Clean recovery rethrows the original value, including undefined, and incomplete recovery preserves all causes rather than retrying or declaring success.
 * @evidence contracts/common.md#meaningful-documentation Documents the synchronous notification premise, reverse restoration, guard refusal and commit boundary; complete may return without notifying when the caller intentionally publishes no revision.
 * @evidence contracts/performance.md#efficient-algorithms For F writes the local applied list and successful traversal are O(F); failure restores at most F rows and retains at most F recovery errors. Actual cost also includes repeated guards, atomic writes, complete-closure verification and restoration bytes in the supplied adapters.
 * @evidence contracts/performance.md#reuse-equivalent-work Recorded applied rows identify this attempt's actual publication, not reusable results. A later transaction reacquires ownership and currentness; effects and rollback cannot be shared merely because candidate bytes match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The attempt retains references to published rows and recovery causes until return or throw; the caller retains any resulting AggregateError. Files, locks and temporary paths are acquired and released by project/atomic owners, and byte retention has no bound imposed here.
 */
export function runProductionMutation<File, Result>(
  props: {
  /** Ordered candidate writes with their previous values. */
  files: readonly File[];

  /** Refuse a replaced namespace before touching its paths. */
  guard: () => void;

  /** Publish one write and notify before post-publication guards or cleanup. */
  apply: (file: File, published: () => void) => void;

  /** Restore one already-published write to its previous value. */
  restore: (file: File) => void;

  /** Validate the complete closure, then mark the revision's commit point. */
  complete: (committed: () => void) => Result;
}
): Result {
  const applied: File[] = [];
  let committed: boolean = false;
  try {
    for (const file of props.files) {
      props.guard();
      props.apply(file, (): void => {
        applied.push(file);
        props.guard();
      });
      props.guard();
    }
    return props.complete((): void => {
      committed = true;
    });
  } catch (error) {
    if (committed)
      throw new AggregateError(
        [error],
        "Production revision was committed, but a later guard or cleanup failed. No rollback was attempted after the revision commit point. Reopen the project and inspect the current revision and publication before retrying.",
      );
    try {
      props.guard();
    } catch (identityError) {
      throw new AggregateError(
        [error, identityError],
        "Production mutation stopped because the physical root, namespace fence, or state incarnation changed. No stale-path rollback was attempted in the replacement namespace.",
      );
    }
    const rollbackErrors: unknown[] = [];
    for (const file of applied.reverse())
      try {
        props.guard();
        props.restore(file);
        props.guard();
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    if (rollbackErrors.length !== 0)
      throw new AggregateError(
        [error, ...rollbackErrors],
        "Production mutation failed and rollback was incomplete. Restore the listed owned files before retrying.",
      );
    throw error;
  }
}
