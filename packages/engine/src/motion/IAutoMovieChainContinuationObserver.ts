/**
 * Optional actual-work observations for one synchronous prepared continuation.
 * Each event reports one completed dispatch decision or one root about to be
 * physically tried. Events never choose an algorithm or certify a pose.
 * The observer may collect counters but must not mutate source, goal, rig or
 * seed inputs while their fit is active; a thrown observer error propagates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines per-call event timing, unit counts, immutable-query premise, exception propagation and the absence of physical acceptance authority.
 * @evidence contracts/development/design.md#principled-representation A callback carries four actual control-flow observations without global instrumentation or retained history. Root trials are attempted admissible-bracket angles; accepted reports the independently checked returned pose; near/cold attempts report their real dispatch sites.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only explicit prepared continuation accepts this optional observer. Ordinary fit, public cold score and solver inputs remain unchanged; the Human cost owner can count events without patching any method.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Events are observations rather than trusted flags, cached answers, timings or fabricated convergence. Their counts do not infer internal projector candidates or declare a physical success.
 */
export interface IAutoMovieChainContinuationObserver {
  /** Each invocation represents one actual event, with no retained callback after return. */
  (event: "orientationRootTrial" | "orientationRootAccepted" | "nearAttempt" | "coldAttempt"): void;
}
