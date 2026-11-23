/** Cancellation input for synchronous immutable-artifact publication.
 * An event-loop abort cannot interrupt synchronous work already in progress.
 *
 * @evidence contracts/development/design.md#principled-representation A caller-owned query can cancel publication before synchronous serialization and file work begin.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Publication cancellation is separate from geometry generation and from the immutable receipt.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The query cannot interrupt a blocked event loop or remove an already published artifact.
 * @evidence contracts/development/common.md#meaningful-documentation States optional callback ownership and the pre-work cancellation checkpoint.
 */
export interface IAutoMovieFilePublicationOptions {
  /** Synchronous cooperative cancellation query; absent means continue.
   * Return true to stop at the next existing checkpoint without publishing a value;
   * false continues. Throwing or returning a nonboolean value fails the operation.
   * The caller owns callback cost and captured state; it must not return a Promise.
   * No listener or background task is registered, and a blocked event loop cannot
   * change caller state until control returns. Publication checks only before work.
   * The publication caller implements the synchronous query; the publication owner invokes it only before serialization/file work and owns the cancellation outcome.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States pre-work checkpoint, absent/true/false meanings, nonboolean or thrown failure and caller-owned captured state.
   */
  cancelled?: () => boolean;
}
