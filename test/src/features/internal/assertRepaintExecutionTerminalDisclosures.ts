import { TestValidator } from "@nestia/e2e";

/** Compare the original terminal retry metadata projection with the original literal stop/disclosure oracle at the same point after all provider cases. The caller passes the same result references and counters without reconstruction or weakened assertions. */
export function assertRepaintExecutionTerminalDisclosures(actual: Record<string, unknown>, digest: (value: string) => string): void {
  TestValidator.equals(
    "every terminal retry boundary preserves its exact stop class",
    actual,
    {
          zeroBudget: "cost-exhausted",
          retryCost: "cost-exhausted",
          backoffElapsed: "elapsed-exhausted",
          failedWait: {
            stop: "backoff-failed",
            attempts: 1,
            providerCalls: 1,
          },
          waitCancelled: {
            stop: "cancelled",
            attempts: 1,
            providerCalls: 1,
          },
          earlyWait: {
            stop: "backoff-failed",
            attempts: 1,
            attemptIds: 1,
            providerCalls: 1,
          },
          classifiedCancelled: "cancelled",
          classifiedStale: "stale",
          cancelledDuringAttempt: "cancelled",
          invalidCosts: ["not-retryable", "not-retryable"],
          transported: ["transport", "transport", "transport"],
          resolvedOnTimeout: {
            stop: "attempts-exhausted",
            accepted: null,
            failure: "timeout",
            costUnits: 2,
            availableOutput: digest("resolved-during-timeout"),
          },
          resolvedOnOuterAbort: {
            stop: "cancelled",
            accepted: null,
            failure: "cancelled",
            costUnits: 3,
            availableOutput: digest("resolved-during-cancellation"),
          },
          rejectedOnTimeout: {
            stop: "attempts-exhausted",
            accepted: null,
            failure: "timeout",
            costUnits: 4,
            availableOutput: digest("rejected-during-timeout"),
          },
          elapsedAtCompletion: {
            stop: "attempts-exhausted",
            accepted: null,
            failure: "timeout",
            costUnits: 5,
            availableOutput: digest("completed-at-timeout"),
          },
          elapsedBeforeProvider: {
            stop: "elapsed-exhausted",
            attempts: 0,
            attemptIds: 0,
            providerCalls: 0,
          },
          elapsedAtRejection: {
            stop: "attempts-exhausted",
            accepted: null,
            failure: "timeout",
            costUnits: 6,
            availableOutput: digest("rejected-at-deadline"),
          },
        },
  );
}
