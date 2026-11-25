/**
 * Cancellation input for synchronous immutable-artifact publication. An
 * event-loop abort cannot interrupt synchronous work already in progress.
 */
export interface IAutoMovieFilePublicationOptions {
  /**
   * Synchronous cooperative cancellation query; absent means continue. Return
   * true to stop at the next existing checkpoint without publishing a value;
   * false continues. Throwing or returning a nonboolean value fails the
   * operation. The caller owns callback cost and captured state; it must not
   * return a Promise. No listener or background task is registered, and a
   * blocked event loop cannot change caller state until control returns.
   * Publication checks only before work. The publication caller implements the
   * synchronous query; the publication owner invokes it only before
   * serialization/file work and owns the cancellation outcome.
   */
  cancelled?: () => boolean;
}
