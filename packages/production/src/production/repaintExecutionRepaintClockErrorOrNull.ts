import { AutoMovieRepaintClockError } from "./AutoMovieRepaintClockError";

/**
 * Guards instanceof for the shared internal clock Error identity and returns null for unsafe/nonmatching values.
 *
 * @evidence contracts/common.md#principled-implementation Guards instanceof for the shared internal clock Error identity and returns null for unsafe/nonmatching values.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The original Error reference is returned without copying or retaining a request-scoped cache.
 * @evidence contracts/performance.md#efficient-algorithms One prototype check has constant ordinary cost and no alternate clock policy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The original Error reference is returned without copying or retaining a request-scoped cache.
 */
export const repaintExecutionRepaintClockErrorOrNull: (value: unknown) => AutoMovieRepaintClockError | null = (
  value: unknown,
): AutoMovieRepaintClockError | null => {
  try {
    return value instanceof AutoMovieRepaintClockError ? value : null;
  } catch {
    return null;
  }
};
