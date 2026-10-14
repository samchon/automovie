/**
 * Clones an injected Date and refuses nonfinite observations before policy/resume/execution bookkeeping.
 *
 * @evidence contracts/common.md#principled-implementation Clones an injected Date and refuses nonfinite observations before policy/resume/execution bookkeeping.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The cloned instant is request-local; caller Date objects are not mutated or cached.
 * @evidence contracts/performance.md#efficient-algorithms Constant Date work preserves the existing preflight/monotonicity checks in the caller.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The cloned instant is request-local; caller Date objects are not mutated or cached.
 */
export const productionRepaintServiceRepaintRuntimeInstant: (value: Date, label: string) => Date = (value: Date, label: string): Date => {
  const observed: Date = new Date(value.getTime());
  if (Number.isNaN(observed.getTime()))
    throw new Error(`Repaint ${label} requires a valid runtime instant.`);
  return observed;
};
