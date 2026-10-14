/**
 * Requires unknown input to be an already-trimmed nonblank string and returns that same identity text.
 *
 * @evidence contracts/common.md#principled-implementation Requires unknown input to be an already-trimmed nonblank string and returns that same identity text.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation No input object or cache is retained after validation.
 * @evidence contracts/performance.md#efficient-algorithms Trimming scans string length and never normalizes a malformed identity into admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No input object or cache is retained after validation.
 */
export const repaintExecutionNonBlank: (value: unknown, label: string) => string = (value: unknown, label: string): string => {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value !== value.trim()
  )
    throw new Error(`Repaint ${label} must be trimmed and non-empty.`);
  return value;
};
