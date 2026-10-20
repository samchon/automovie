/**
 * Cancellation input for synchronous immutable-artifact publication.
 * An event-loop abort cannot interrupt synchronous work already in progress.
 *
 * @evidence contracts/common.md#principled-implementation A caller-owned signal can cancel publication before synchronous serialization and file work begin.
 * @evidence contracts/common.md#clear-and-simple-design Publication cancellation is separate from geometry generation and from the immutable receipt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The signal cannot interrupt a blocked event loop or remove an already published artifact.
 * @evidence contracts/common.md#meaningful-documentation States optional signal ownership and the pre-work cancellation checkpoint.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoveryPublicationOptions {
  /** Caller-owned cancellation signal, checked before synchronous work. */
  signal?: AbortSignal;
}
