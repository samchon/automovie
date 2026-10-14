/**
 * Requires a finite nonnegative declared cost and returns it unchanged, refusing malformed provider charges.
 *
 * @evidence contracts/common.md#principled-implementation Requires a finite nonnegative declared cost and returns it unchanged, refusing malformed provider charges.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Successful admission returns the same number; refusal allocates an ordinary Error transferred to the caller without retaining an external resource.
 * @evidence contracts/performance.md#efficient-algorithms Constant numeric checks preserve the existing cost-unit ceiling contract without estimating actual provider billing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful admission allocates no record; refusal transfers an ordinary Error to the caller, and this helper retains no buffer, handle or running task.
 */
export const repaintExecutionValidCost: (value: number) => number = (value: number): number => {
  if (Number.isFinite(value) === false || value < 0)
    throw new Error(
      "Repaint attempt costUnits must be finite and non-negative.",
    );
  return value;
};
