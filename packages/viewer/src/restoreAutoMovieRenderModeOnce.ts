

/**
 * Attempt one synchronous restoration once. Later calls preserve its original failure instead of reporting success or retrying a partially released resource; reentrant calls do not start a second attempt.
 *
 * @evidence contracts/common.md#principled-implementation The guard marks its one attempt before invoking the callback and retains a wrapper around any thrown value, including undefined, for later refusal.
 * @evidence contracts/common.md#clear-and-simple-design One done flag and optional original cause own synchronous attempt sharing while actual restoration and independent resource fan-out remain with the supplied callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed first restoration is not hidden by a later no-op success, and a callback is not retried merely because its resource state is uncertain.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes one attempt, later original failure and reentrant suppression without claiming physical release from callback completion.
 * @evidence contracts/performance.md#efficient-algorithms Guard work and cause retention are fixed size; the callback's actual restoration cost is incurred only on the first attempt.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated calls represent the same owned restoration and share its attempt/outcome; a different owner must create a separate guard.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The guard retains one callback and optional original failure until its owning handle becomes unreachable, with no global registry or newly acquired GPU resource.
 */
export const restoreAutoMovieRenderModeOnce: (fn: () => void) => (() => void) = (fn: () => void): (() => void) => {
  let done: boolean = false;
  let failure: { error: unknown } | undefined;
  return (): void => {
    if (done) {
      if (failure !== undefined) throw failure.error;
      return;
    }
    done = true;
    try { fn(); }
    catch (error) { failure = { error }; throw error; }
  };
};
