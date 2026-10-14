/**
 * Uses a trimmed nonblank failure message or the original fallback for blank text.
 *
 * @evidence contracts/common.md#principled-implementation Uses a trimmed nonblank failure message or the original fallback for blank text.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Only the returned string survives; no request or error object is cached.
 * @evidence contracts/performance.md#efficient-algorithms Trimming scans message characters and preserves the current refusal wording protocol.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned string survives; no request or error object is cached.
 */
export const repaintExecutionRepaintFailureMessage: (value: string) => string = (value: string): string => {
  const message: string = value.trim();
  return message.length === 0
    ? "Repaint provider failed without a message."
    : message;
};
