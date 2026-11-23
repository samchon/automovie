/**
 * Optional actual-work observations for one synchronous prepared continuation.
 * Each event reports one completed dispatch decision or one root about to be
 * physically tried. Events never choose an algorithm or certify a pose. The
 * observer may collect counters but must not mutate source, goal, rig or seed
 * inputs while their fit is active; a thrown observer error propagates.
 */
export interface IAutoMovieChainContinuationObserver {
  /**
   * Each invocation represents one actual event, with no retained callback
   * after return.
   */
  (
    event:
      | "orientationRootTrial"
      | "orientationRootAccepted"
      | "nearAttempt"
      | "coldAttempt",
  ): void;
}
