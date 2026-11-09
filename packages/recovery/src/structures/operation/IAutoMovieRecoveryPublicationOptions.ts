/**
 * Cancellation input for synchronous immutable-artifact publication.
 * An event-loop abort cannot interrupt synchronous work already in progress.
 *
 * @evidence contracts/development/design.md#principled-representation A caller-owned signal can cancel publication before synchronous serialization and file work begin.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Publication cancellation is separate from geometry generation and from the immutable receipt.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The signal cannot interrupt a blocked event loop or remove an already published artifact.
 * @evidence contracts/development/common.md#meaningful-documentation States optional signal ownership and the pre-work cancellation checkpoint.
 */
export interface IAutoMovieRecoveryPublicationOptions {
  /** Caller-owned cancellation signal, checked before synchronous work. */
  signal?: AbortSignal;
}
