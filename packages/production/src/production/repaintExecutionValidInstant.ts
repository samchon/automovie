/**
 * Clones the injected Date and refuses a nonfinite instant with the original labelled clock diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Clones the injected Date and refuses a nonfinite instant with the original labelled clock diagnostic.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Only the cloned instant escapes; the caller's Date is not retained or mutated.
 * @evidence contracts/performance.md#efficient-algorithms One Date clone and finite check preserve caller-owned mutable Date isolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the cloned instant escapes; the caller's Date is not retained or mutated.
 */
export const repaintExecutionValidInstant: (value: Date, label: string) => Date = (value: Date, label: string): Date => {
  const cloned: Date = new Date(value.getTime());
  if (Number.isNaN(cloned.getTime()))
    throw new Error(`Repaint ${label} must be a valid instant.`);
  return cloned;
};
