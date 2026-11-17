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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The signature specifies the callback result and failure contract; the caller-supplied body owns the method and its premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This callable member is an injected boundary with no implementation decomposition; the named caller and consumer own their respective bodies.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No executable branch or compensation is implemented by this signature; the supplied body must honor the documented result and failure semantics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no traversal or allocation strategy; callback cost belongs to the supplied implementation and is not bounded by the type.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration coordinates no calls or cache; the consuming operation owns invocation frequency and the supplied body owns any effect-safe reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no handle or task; the callback owner must manage captured state and resources for the documented invocation lifetime.
   */
  cancelled?: () => boolean;
}
