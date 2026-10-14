/**
 * Safely reads Error.message or stringifies an unknown refusal, then falls back if inspection/stringification throws.
 *
 * @evidence contracts/common.md#principled-implementation Safely reads Error.message or stringifies an unknown refusal, then falls back if inspection/stringification throws.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation It retains only the returned message and drops the caught object reference on return.
 * @evidence contracts/performance.md#efficient-algorithms Work follows supplied message/stringification cost; this guard prevents a hostile diagnostic from replacing the original outcome.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources It retains only the returned message and drops the caught object reference on return.
 */
export const repaintExecutionSafeUnknownMessage: (value: unknown, fallback: string) => string = (value: unknown, fallback: string): string => {
  try {
    const message: string = value instanceof Error ? value.message : String(value);
    return typeof message === "string" ? message : fallback;
  } catch {
    return fallback;
  }
};
