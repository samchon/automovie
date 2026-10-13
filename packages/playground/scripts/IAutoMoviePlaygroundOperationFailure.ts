/**
 * An earlier operation's exact unknown error retained through fallible resource cleanup. preserveCleanupFailure uses undefined to mean no earlier cause, so thrown undefined remains representable inside this wrapper rather than disappearing as absence.
 *
 * @evidence contracts/common.md#principled-implementation One wrapper distinguishes an absent failure from any JavaScript throw value.
 * @evidence contracts/common.md#clear-and-simple-design The original cleanup helper consumes only this error field and does not need a second error classification protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unknown cause remains unchanged; the type imposes no false Error-instance premise.
 * @evidence contracts/common.md#meaningful-documentation The comment names the actual consumer, units, ownership, cost and interpretation limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Erased type performs no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Erased type owns no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Erased type acquires no resource.
 *
 * @author Samchon
 */
export interface IAutoMoviePlaygroundOperationFailure {
  /** Original operation error that cleanup must not replace. */
  error: unknown;
}
