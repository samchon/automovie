/**
 * An earlier operation's exact unknown error retained through fallible resource cleanup. preserveCleanupFailure uses undefined to mean no earlier cause, so thrown undefined remains representable inside this wrapper rather than disappearing as absence.
 *
 *
 * @evidence contracts/development/design.md#principled-representation The wrapper distinguishes an earlier thrown undefined from absence, preserving the exact original cause through cleanup.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One error field is the only state preserveCleanupFailure needs to aggregate two failures.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No cause is guessed, normalized or replaced by a success sentinel.
 * @evidence contracts/development/common.md#meaningful-documentation The comment explains the distinction between absent failure and a retained undefined cause.
 */
export interface IAutoMoviePageOperationFailure {
  /** Original operation error that cleanup must not replace. */
  error: unknown;
}
