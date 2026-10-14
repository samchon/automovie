import type { IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";
import { AutoMovieRepaintAttemptError } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { executeRepaintTestRequest } from "./executeRepaintTestRequest";
import { assertRepaintExecutionTerminalDisclosures } from "./assertRepaintExecutionTerminalDisclosures";

/** Existing generic wrapper signature borrowed by the original case groups. */
type RepaintTestExecutor = <T>(props: Parameters<typeof executeRepaintTestRequest<T>>[0]) => ReturnType<typeof executeRepaintTestRequest<T>>;
/** Actual executor result and observer array for cases that inspect metadata only. */
type RepaintTestExecution = Awaited<ReturnType<typeof executeRepaintTestRequest<unknown>>>;
/** Original string-valued provider disclosure shape. */
type RepaintProviderOutput = Awaited<ReturnType<Parameters<typeof executeRepaintTestRequest<string>>[0]["calls"]>>;

/** Run the original retry, cancellation, deadline and failure-disclosure cases after the initial bounded-refusal assertions, borrowing the original wrapper and inputs without new cases or values. */
export async function assertRepaintExecutionRetryBoundaries(
  execute: RepaintTestExecutor,
  policy: (override?: Partial<IAutoMovieRepaintExecutionPolicy>) => IAutoMovieRepaintExecutionPolicy,
  digest: (value: string) => string
): Promise<void> {
  const zeroBudget: RepaintTestExecution = await execute({
    policy: policy({ maximumCostUnits: 0 }),
    calls: async (): Promise<RepaintProviderOutput> => ({
      value: "unreachable",
      costUnits: 0,
      availableOutput: null,
    }),
  });
  const retryCost: RepaintTestExecution = await execute({
    policy: policy({
      maximumAttempts: 2,
      maximumCostUnits: 1,
      backoffMs: [1],
      retryableFailures: ["timeout"],
    }),
    calls: async (): Promise<RepaintProviderOutput> => {
      throw new AutoMovieRepaintAttemptError("timeout", "retry", 1);
    },
  });
  const backoffElapsed: RepaintTestExecution = await execute({
    policy: policy({
      maximumAttempts: 2,
      maximumElapsedMs: 100,
      attemptTimeoutMs: 100,
      backoffMs: [100],
      retryableFailures: ["rate-limit"],
    }),
    calls: async (): Promise<RepaintProviderOutput> => {
      throw { status: 429 };
    },
  });
  let failedWaitProviderCalls: number = 0;
  const failedWait: RepaintTestExecution = await execute({
    policy: policy({ maximumAttempts: 2, backoffMs: [1] }),
    wait: (): Promise<void> => Promise.reject(new Error("backoff runtime unavailable")),
    calls: async (): Promise<RepaintProviderOutput> => {
      ++failedWaitProviderCalls;
      throw { status: 429 };
    },
  });
  const waitAbortController: AbortController = new AbortController();
  let abortedWaitProviderCalls: number = 0;
  const waitCancelled: RepaintTestExecution = await execute({
    policy: policy({ maximumAttempts: 2, backoffMs: [1] }),
    signal: waitAbortController.signal,
    wait: (): Promise<void> => {
      waitAbortController.abort("cancel during backoff");
      return Promise.reject(new Error("cancel during backoff"));
    },
    calls: async (): Promise<RepaintProviderOutput> => {
      ++abortedWaitProviderCalls;
      throw { status: 429 };
    },
  });
  let earlyWaitProviderCalls: number = 0;
  let earlyWaitAttemptIds: number = 0;
  const earlyWait: RepaintTestExecution = await execute({
    policy: policy({ maximumAttempts: 2, backoffMs: [10] }),
    now: (): Date => new Date("2026-08-28T10:00:00.000Z"),
    attemptId: (): string => {
      ++earlyWaitAttemptIds;
      return "30000000-0000-4000-8000-000000000001";
    },
    wait: (): Promise<void> => Promise.resolve(),
    calls: async (): Promise<RepaintProviderOutput> => {
      ++earlyWaitProviderCalls;
      throw { status: 429 };
    },
  });
  const classifiedCancelled: RepaintTestExecution = await execute({
    policy: policy(),
    calls: async (): Promise<RepaintProviderOutput> => {
      throw new AutoMovieRepaintAttemptError("cancelled", "cancelled");
    },
  });
  const classifiedStale: RepaintTestExecution = await execute({
    policy: policy(),
    calls: async (): Promise<RepaintProviderOutput> => {
      throw new AutoMovieRepaintAttemptError("input-stale", "stale");
    },
  });
  const liveController: AbortController = new AbortController();
  const cancelledDuringAttempt: RepaintTestExecution = await execute({
    policy: policy(),
    signal: liveController.signal,
    calls: (signal: AbortSignal): Promise<never> =>
      new Promise<never>((resolve: (value: never) => void, reject: (reason?: unknown) => void): void => {
        void resolve;
        signal.addEventListener("abort", (): void => reject(new Error("aborted")), {
          once: true,
        });
        queueMicrotask((): void => liveController.abort("user"));
      }),
  });
  const invalidCostResults: Array<RepaintTestExecution> = await Promise.all(
    [Number.NaN, -1].map((costUnits: number): ReturnType<typeof execute<string>> =>
      execute({
        policy: policy({ maximumAttempts: 1, backoffMs: [] }),
        calls: async (): Promise<RepaintProviderOutput> => ({
          value: "bad cost",
          costUnits,
          availableOutput: null,
        }),
      }),
    ),
  );
  const transported: Array<RepaintTestExecution> = await Promise.all(
    [
      { name: "FetchError", message: "fetch" },
      { code: "ECONNRESET", message: "reset", costUnits: 1 },
      { code: "ETIMEDOUT" },
    ].map((failure: { name?: string; code?: string; message?: string; costUnits?: number }): ReturnType<typeof execute<string>> =>
      execute({
        policy: policy({ maximumAttempts: 1, backoffMs: [] }),
        calls: async (): Promise<RepaintProviderOutput> => {
          throw failure;
        },
      }),
    ),
  );
  const normalizedFailures: Array<RepaintTestExecution> = await Promise.all([
    execute({
      policy: policy({ maximumAttempts: 1, backoffMs: [] }),
      calls: async (): Promise<RepaintProviderOutput> => {
        const failure: Error = new Error("placeholder");
        failure.message = "";
        throw failure;
      },
    }),
    execute({
      policy: policy({ maximumAttempts: 1, backoffMs: [] }),
      calls: async (): Promise<RepaintProviderOutput> => {
        throw new AutoMovieRepaintAttemptError(
          "provider-refusal",
          " padded provider refusal ",
        );
      },
    }),
  ]);
  TestValidator.equals(
    "terminal failure messages are nonblank and exactly trimmed",
    normalizedFailures.map(
      ({ result }: RepaintTestExecution): string | undefined => result.attempts[0]?.failure?.message,
    ),
    ["Repaint provider failed without a message.", "padded provider refusal"],
  );
  const resolvedOnTimeout: RepaintTestExecution = await execute<string>({
    policy: policy({
      maximumAttempts: 1,
      attemptTimeoutMs: 1,
      backoffMs: [],
    }),
    calls: (signal: AbortSignal): Promise<RepaintProviderOutput> =>
      new Promise<RepaintProviderOutput>((resolve: (value: RepaintProviderOutput | PromiseLike<RepaintProviderOutput>) => void): void => {
        signal.addEventListener(
          "abort",
          (): void =>
            resolve({
              value: "must not be accepted",
              costUnits: 2,
              availableOutput: {
                digest: digest("resolved-during-timeout"),
                bytes: 5,
              },
            }),
          { once: true },
        );
      }),
  });
  const outerAbort: AbortController = new AbortController();
  const resolvedOnOuterAbort: RepaintTestExecution = await execute<string>({
    policy: policy({ maximumAttempts: 1, backoffMs: [] }),
    signal: outerAbort.signal,
    calls: (signal: AbortSignal): Promise<RepaintProviderOutput> =>
      new Promise<RepaintProviderOutput>((resolve: (value: RepaintProviderOutput | PromiseLike<RepaintProviderOutput>) => void): void => {
        signal.addEventListener(
          "abort",
          (): void =>
            resolve({
              value: "must not be accepted",
              costUnits: 3,
              availableOutput: {
                digest: digest("resolved-during-cancellation"),
                bytes: 7,
              },
            }),
          { once: true },
        );
        queueMicrotask((): void => outerAbort.abort("cancelled"));
      }),
  });
  const rejectedOnTimeout: RepaintTestExecution = await execute<string>({
    policy: policy({
      maximumAttempts: 1,
      attemptTimeoutMs: 1,
      backoffMs: [],
    }),
    calls: (signal: AbortSignal): Promise<never> =>
      new Promise<never>((resolve: (value: never) => void, reject: (reason?: unknown) => void): void => {
        void resolve;
        signal.addEventListener(
          "abort",
          (): void =>
            reject(
              new AutoMovieRepaintAttemptError(
                "provider-refusal",
                "adapter disclosed a partial output while aborting",
                4,
                {
                  digest: digest("rejected-during-timeout"),
                  bytes: 9,
                },
              ),
            ),
          { once: true },
        );
      }),
  });
  let completionClockReads: number = 0;
  const elapsedAtCompletion: RepaintTestExecution = await execute<string>({
    policy: policy({
      maximumAttempts: 1,
      attemptTimeoutMs: 100,
      backoffMs: [],
    }),
    now: (): Date =>
      new Date(
        completionClockReads++ < 3
          ? "2026-08-28T10:00:00.000Z"
          : "2026-08-28T10:00:00.100Z",
      ),
    calls: async (): Promise<RepaintProviderOutput> => ({
      value: "must not be accepted",
      costUnits: 5,
      availableOutput: {
        digest: digest("completed-at-timeout"),
        bytes: 11,
      },
    }),
  });
  let preProviderClockReads: number = 0;
  let preProviderAttemptIds: number = 0;
  let preProviderCalls: number = 0;
  const elapsedBeforeProvider: RepaintTestExecution = await execute<string>({
    policy: policy({
      maximumAttempts: 1,
      attemptTimeoutMs: 100,
      maximumElapsedMs: 100,
      backoffMs: [],
    }),
    now: (): Date =>
      new Date(
        [
          "2026-08-28T10:00:00.000Z",
          "2026-08-28T10:00:00.050Z",
          "2026-08-28T10:00:00.100Z",
        ][Math.min(preProviderClockReads++, 2)]!,
      ),
    attemptId: (): string => {
      ++preProviderAttemptIds;
      return "40000000-0000-4000-8000-000000000001";
    },
    calls: async (): Promise<RepaintProviderOutput> => {
      ++preProviderCalls;
      return {
        value: "must not execute",
        costUnits: 0,
        availableOutput: null,
      };
    },
  });
  let rejectedClockReads: number = 0;
  const elapsedAtRejection: RepaintTestExecution = await execute<string>({
    policy: policy({
      maximumAttempts: 1,
      attemptTimeoutMs: 100,
      backoffMs: [],
    }),
    now: (): Date =>
      new Date(
        rejectedClockReads++ < 3
          ? "2026-08-28T10:00:00.000Z"
          : "2026-08-28T10:00:00.100Z",
      ),
    calls: async (): Promise<RepaintProviderOutput> => {
      throw new AutoMovieRepaintAttemptError(
        "provider-refusal",
        "adapter disclosed a partial output at the deadline",
        6,
        { digest: digest("rejected-at-deadline"), bytes: 13 },
      );
    },
  });
  assertRepaintExecutionTerminalDisclosures({
      zeroBudget: zeroBudget.result.stop,
      retryCost: retryCost.result.stop,
      backoffElapsed: backoffElapsed.result.stop,
      failedWait: {
        stop: failedWait.result.stop,
        attempts: failedWait.result.attempts.length,
        providerCalls: failedWaitProviderCalls,
      },
      waitCancelled: {
        stop: waitCancelled.result.stop,
        attempts: waitCancelled.result.attempts.length,
        providerCalls: abortedWaitProviderCalls,
      },
      earlyWait: {
        stop: earlyWait.result.stop,
        attempts: earlyWait.result.attempts.length,
        attemptIds: earlyWaitAttemptIds,
        providerCalls: earlyWaitProviderCalls,
      },
      classifiedCancelled: classifiedCancelled.result.stop,
      classifiedStale: classifiedStale.result.attempts[0]?.status,
      cancelledDuringAttempt: cancelledDuringAttempt.result.stop,
      invalidCosts: invalidCostResults.map(({ result }: RepaintTestExecution): typeof result.stop => result.stop),
      transported: transported.map(
        ({ result }: RepaintTestExecution): string | undefined => result.attempts[0]?.failure?.class,
      ),
      resolvedOnTimeout: {
        stop: resolvedOnTimeout.result.stop,
        accepted: resolvedOnTimeout.result.accepted,
        failure: resolvedOnTimeout.result.attempts[0]?.failure?.class,
        costUnits: resolvedOnTimeout.result.attempts[0]?.costUnits,
        availableOutput:
          resolvedOnTimeout.result.attempts[0]?.availableOutput?.digest,
      },
      resolvedOnOuterAbort: {
        stop: resolvedOnOuterAbort.result.stop,
        accepted: resolvedOnOuterAbort.result.accepted,
        failure: resolvedOnOuterAbort.result.attempts[0]?.failure?.class,
        costUnits: resolvedOnOuterAbort.result.attempts[0]?.costUnits,
        availableOutput:
          resolvedOnOuterAbort.result.attempts[0]?.availableOutput?.digest,
      },
      rejectedOnTimeout: {
        stop: rejectedOnTimeout.result.stop,
        accepted: rejectedOnTimeout.result.accepted,
        failure: rejectedOnTimeout.result.attempts[0]?.failure?.class,
        costUnits: rejectedOnTimeout.result.attempts[0]?.costUnits,
        availableOutput:
          rejectedOnTimeout.result.attempts[0]?.availableOutput?.digest,
      },
      elapsedAtCompletion: {
        stop: elapsedAtCompletion.result.stop,
        accepted: elapsedAtCompletion.result.accepted,
        failure: elapsedAtCompletion.result.attempts[0]?.failure?.class,
        costUnits: elapsedAtCompletion.result.attempts[0]?.costUnits,
        availableOutput:
          elapsedAtCompletion.result.attempts[0]?.availableOutput?.digest,
      },
      elapsedBeforeProvider: {
        stop: elapsedBeforeProvider.result.stop,
        attempts: elapsedBeforeProvider.result.attempts.length,
        attemptIds: preProviderAttemptIds,
        providerCalls: preProviderCalls,
      },
      elapsedAtRejection: {
        stop: elapsedAtRejection.result.stop,
        accepted: elapsedAtRejection.result.accepted,
        failure: elapsedAtRejection.result.attempts[0]?.failure?.class,
        costUnits: elapsedAtRejection.result.attempts[0]?.costUnits,
        availableOutput:
          elapsedAtRejection.result.attempts[0]?.availableOutput?.digest,
      },
    }, digest);

}
