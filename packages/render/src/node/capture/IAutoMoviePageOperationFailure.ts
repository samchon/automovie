/**
 * An earlier operation's exact unknown error retained through fallible resource cleanup. preserveCleanupFailure uses undefined to mean no earlier cause, so thrown undefined remains representable inside this wrapper rather than disappearing as absence.
 *
 *
 * @evidence contracts/common.md#principled-implementation The wrapper distinguishes an earlier thrown undefined from absence, preserving the exact original cause through cleanup.
 * @evidence contracts/common.md#clear-and-simple-design One error field is the only state preserveCleanupFailure needs to aggregate two failures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No cause is guessed, normalized or replaced by a success sentinel.
 * @evidence contracts/common.md#meaningful-documentation The comment explains the distinction between absent failure and a retained undefined cause.
 * @evidence contracts/performance.md#efficient-algorithms The erased record chooses no algorithm; cleanup aggregation belongs to preserveCleanupFailure.
 * @evidence contracts/performance.md#reuse-equivalent-work The type coordinates no work or cache; each operation retains its own cause.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains one unknown cause through cleanup and can release the wrapper after settlement.
 * @author Samchon
 */
export interface IAutoMoviePageOperationFailure {
  /** Original operation error that cleanup must not replace. */
  error: unknown;
}
