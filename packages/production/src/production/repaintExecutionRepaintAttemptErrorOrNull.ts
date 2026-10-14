import { AutoMovieRepaintAttemptError } from "./AutoMovieRepaintAttemptError";

/**
 * Guards instanceof against hostile values and returns the same classified-error identity or null.
 *
 * @evidence contracts/common.md#principled-implementation Guards instanceof against hostile values and returns the same classified-error identity or null.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original executor value/disclosure operation; scheduling, policy and durable observer effects remain in executeAutoMovieRepaintRequest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation It allocates no copy and retains only the supplied Error reference through its immediate caller.
 * @evidence contracts/performance.md#efficient-algorithms One prototype check has constant ordinary cost; a throwing proxy is treated as absence rather than escaping.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources It allocates no copy and retains only the supplied Error reference through its immediate caller.
 */
export const repaintExecutionRepaintAttemptErrorOrNull: (value: unknown) => AutoMovieRepaintAttemptError | null = (
  value: unknown,
): AutoMovieRepaintAttemptError | null => {
  try {
    return value instanceof AutoMovieRepaintAttemptError ? value : null;
  } catch {
    return null;
  }
};
