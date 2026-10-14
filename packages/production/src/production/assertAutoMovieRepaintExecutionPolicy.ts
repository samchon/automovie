import { repaintExecutionMAX_TIMER_MILLISECONDS } from "./repaintExecutionMAX_TIMER_MILLISECONDS";
import { repaintExecutionRETRYABLE_FAILURE_CLASSES } from "./repaintExecutionRETRYABLE_FAILURE_CLASSES";
import { AutoMovieRepaintRetryableFailureClass, IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";

/**
 * Rejects nonpositive unsafe attempt/time bounds, timeout beyond elapsed/host timer limits, invalid cost, mismatched deterministic backoff and duplicate/unsupported retry classes before execution.
 *
 * @evidence contracts/common.md#principled-implementation Rejects nonpositive unsafe attempt/time bounds, timeout beyond elapsed/host timer limits, invalid cost, mismatched deterministic backoff and duplicate/unsupported retry classes before execution.
 * @evidence contracts/common.md#clear-and-simple-design One policy predicate owns envelope admission before the executor starts clocks/providers; the closed retry vocabulary and host timer ceiling remain shared module values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported retry classes and the 2^31-1 millisecond ceiling are actual policy/host-timer contracts; malformed envelopes are refused rather than normalized.
 * @evidence contracts/common.md#meaningful-documentation Only the temporary retry-class Set is retained during validation; invalid policies throw the original single diagnostic.
 * @evidence contracts/performance.md#efficient-algorithms Work is O(A + R) over backoff and retry-class arrays plus a temporary Set; the 2^31-1 timer ceiling remains unchanged.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the temporary retry-class Set is retained during validation; invalid policies throw the original single diagnostic.
 */
export const assertAutoMovieRepaintExecutionPolicy: (policy: IAutoMovieRepaintExecutionPolicy) => void = (
  policy: IAutoMovieRepaintExecutionPolicy,
): void => {
  if (
    Number.isSafeInteger(policy.maximumAttempts) === false ||
    policy.maximumAttempts <= 0 ||
    Number.isSafeInteger(policy.attemptTimeoutMs) === false ||
    policy.attemptTimeoutMs <= 0 ||
    policy.attemptTimeoutMs > repaintExecutionMAX_TIMER_MILLISECONDS ||
    Number.isSafeInteger(policy.maximumElapsedMs) === false ||
    policy.maximumElapsedMs <= 0 ||
    policy.attemptTimeoutMs > policy.maximumElapsedMs ||
    Number.isFinite(policy.maximumCostUnits) === false ||
    policy.maximumCostUnits < 0 ||
    policy.backoffMs.length !== policy.maximumAttempts - 1 ||
    policy.backoffMs.some(
      (value: number): boolean =>
        Number.isSafeInteger(value) === false ||
        value < 0 ||
        value > repaintExecutionMAX_TIMER_MILLISECONDS,
    ) ||
    new Set(policy.retryableFailures).size !==
      policy.retryableFailures.length ||
    policy.retryableFailures.some(
      (value: AutoMovieRepaintRetryableFailureClass): boolean => repaintExecutionRETRYABLE_FAILURE_CLASSES.has(value) === false,
    )
  )
    throw new Error(
      "Repaint execution policy requires positive attempt/elapsed time bounds, host-safe timer delays, a non-negative cost ceiling, exactly one deterministic backoff per possible retry, and unique supported retryable failure classes.",
    );
};
