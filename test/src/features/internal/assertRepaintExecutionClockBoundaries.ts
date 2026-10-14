import type { IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { executeRepaintTestRequest } from "./executeRepaintTestRequest";

import { assertRepaintExecutionOutputBoundaries } from "./assertRepaintExecutionOutputBoundaries";

/** Existing generic wrapper signature borrowed by the original case groups. */
type RepaintTestExecutor = <T>(props: Parameters<typeof executeRepaintTestRequest<T>>[0]) => ReturnType<typeof executeRepaintTestRequest<T>>;
/** Actual executor result and observer array for cases that inspect metadata only. */
type RepaintTestExecution = Awaited<ReturnType<typeof executeRepaintTestRequest<unknown>>>;
/** Original string-valued provider disclosure shape. */
type RepaintProviderOutput = Awaited<ReturnType<Parameters<typeof executeRepaintTestRequest<string>>[0]["calls"]>>;

/** Original completion-clock input and its expected disclosed metadata. */
type RepaintClockCase = { name: string; completion: () => Date; rejectProvider: boolean; expectedCostUnits: number; expectedOutput: string | null };
/** The same case metadata paired with the actual execution result. */
type RepaintClockCaseResult = Omit<RepaintClockCase, "completion" | "rejectProvider"> & { execution: RepaintTestExecution };
/** Exact fields projected by the original completion-clock assertion. */
type RepaintClockObservation = { name: string; stop: RepaintTestExecution["result"]["stop"]; attempts: number; status: RepaintTestExecution["result"]["attempts"][number]["status"] | undefined; failure: string | undefined; retryable: boolean | undefined; costUnits: number | undefined; output: string | null; startedAt: string | undefined; completedAt: string | undefined };
/** Original number-valued disclosures used only by malformed pre-provider clock cases. */
type RepaintNumericProviderOutput = Awaited<ReturnType<Parameters<typeof executeRepaintTestRequest<number>>[0]["calls"]>>;

/** Preserve original rollback, malformed-output and completion-clock order. The output cases run at their original middle position; the existing signal-relay observation remains an explicitly unverified case pending its owning contract repair. */
export async function assertRepaintExecutionClockBoundaries(
  execute: RepaintTestExecutor,
  policy: (override?: Partial<IAutoMovieRepaintExecutionPolicy>) => IAutoMovieRepaintExecutionPolicy,
  digest: (value: string) => string,
  nonError: (message: string) => string
): Promise<void> {
  let reversedBeforeProviderAttemptIds: number = 0;
  let reversedBeforeProviderCalls: number = 0;
  let reversedBeforeProviderReads: number = 0;
  let reversedBeforeProviderMessage: string | null = null;
  try {
    await execute({
      policy: policy({ maximumAttempts: 1, backoffMs: [] }),
      now: (): Date =>
        new Date(
          reversedBeforeProviderReads++ === 0
            ? "2026-08-28T10:00:01.000Z"
            : "2026-08-28T10:00:00.000Z",
        ),
      attemptId: (): string => {
        ++reversedBeforeProviderAttemptIds;
        return "50000000-0000-4000-8000-000000000001";
      },
      calls: async (): Promise<RepaintProviderOutput> => {
        ++reversedBeforeProviderCalls;
        return {
          value: "must not execute",
          costUnits: 0,
          availableOutput: null,
        };
      },
    });
  } catch (error) {
    reversedBeforeProviderMessage =
      error instanceof Error ? error.message : String(error);
  }

  let reversedAfterWaitAttemptIds: number = 0;
  let reversedAfterWaitCalls: number = 0;
  let reversedAfterWaitReads: number = 0;
  const reversedAfterWait: RepaintTestExecution = await execute({
    policy: policy({
      maximumAttempts: 2,
      backoffMs: [1],
      retryableFailures: ["rate-limit"],
    }),
    now: (): Date =>
      new Date(
        [
          "2026-08-28T10:00:00.000Z",
          "2026-08-28T10:00:00.000Z",
          "2026-08-28T10:00:00.000Z",
          "2026-08-28T10:00:00.500Z",
          "2026-08-28T10:00:00.499Z",
        ][Math.min(reversedAfterWaitReads++, 4)]!,
      ),
    attemptId: (): string =>
      `60000000-0000-4000-8000-${String(++reversedAfterWaitAttemptIds).padStart(
        12,
        "0",
      )}`,
    calls: async (): Promise<RepaintProviderOutput> => {
      ++reversedAfterWaitCalls;
      throw { status: 429, message: "retry after a clock rollback" };
    },
  });
  let reversedAtRetryStartAttemptIds: number = 0;
  let reversedAtRetryStartCalls: number = 0;
  let reversedAtRetryStartReads: number = 0;
  const reversedAtRetryStart: RepaintTestExecution = await execute({
    policy: policy({
      maximumAttempts: 2,
      backoffMs: [10],
      retryableFailures: ["rate-limit"],
    }),
    now: (): Date =>
      new Date(
        [
          "2026-08-28T10:00:00.000Z",
          "2026-08-28T10:00:00.000Z",
          "2026-08-28T10:00:00.000Z",
          "2026-08-28T10:00:00.000Z",
          "2026-08-28T10:00:00.010Z",
          "2026-08-28T10:00:00.009Z",
        ][Math.min(reversedAtRetryStartReads++, 5)]!,
      ),
    attemptId: (): string => {
      ++reversedAtRetryStartAttemptIds;
      return "70000000-0000-4000-8000-000000000001";
    },
    calls: async (): Promise<RepaintProviderOutput> => {
      ++reversedAtRetryStartCalls;
      throw { status: 429, message: "retry after attempt-start rollback" };
    },
  });
  TestValidator.equals(
    "backward clocks reject before allocating or starting another provider attempt",
    {
      beforeProvider: {
        rejected: reversedBeforeProviderMessage?.includes(
          "precedes the previous runtime clock observation",
        ),
        attemptIds: reversedBeforeProviderAttemptIds,
        providerCalls: reversedBeforeProviderCalls,
      },
      afterWait: {
        stop: reversedAfterWait.result.stop,
        attempts: reversedAfterWait.result.attempts.length,
        attemptIds: reversedAfterWaitAttemptIds,
        providerCalls: reversedAfterWaitCalls,
      },
      atRetryStart: {
        stop: reversedAtRetryStart.result.stop,
        attempts: reversedAtRetryStart.result.attempts.length,
        attemptIds: reversedAtRetryStartAttemptIds,
        providerCalls: reversedAtRetryStartCalls,
      },
    },
    {
      beforeProvider: {
        rejected: true,
        attemptIds: 0,
        providerCalls: 0,
      },
      afterWait: {
        stop: "backoff-failed",
        attempts: 1,
        attemptIds: 1,
        providerCalls: 1,
      },
      atRetryStart: {
        stop: "backoff-failed",
        attempts: 1,
        attemptIds: 1,
        providerCalls: 1,
      },
    },
  );

  const { rejectionMessage, candidateOutcome }: Awaited<ReturnType<typeof assertRepaintExecutionOutputBoundaries>> = await assertRepaintExecutionOutputBoundaries(execute, policy, digest);

  const postProviderClockFailures: RepaintClockCaseResult[] = await Promise.all(
    [
      {
        name: "successful output then invalid completion clock",
        completion: (): Date => new Date(Number.NaN),
        rejectProvider: false,
        expectedCostUnits: 1,
        expectedOutput: digest("candidate"),
      },
      {
        name: "successful output then backward completion clock",
        completion: (): Date => new Date("2026-08-28T09:59:59.999Z"),
        rejectProvider: false,
        expectedCostUnits: 1,
        expectedOutput: digest("candidate"),
      },
      {
        name: "provider rejection then invalid completion clock",
        completion: (): Date => new Date(Number.NaN),
        rejectProvider: true,
        expectedCostUnits: 0,
        expectedOutput: null,
      },
      {
        name: "successful output then hostile completion clock",
        completion: (): Date => {
          throw new Proxy(
            {},
            {
              getPrototypeOf: (): never => {
                throw new Error("hostile clock prototype");
              },
              get: (): never => {
                throw new Error("hostile clock stringification");
              },
            },
          );
        },
        rejectProvider: false,
        expectedCostUnits: 1,
        expectedOutput: digest("candidate"),
      },
    ].map(
      async ({
        name,
        completion,
        rejectProvider,
        expectedCostUnits,
        expectedOutput,
      }: RepaintClockCase): Promise<RepaintClockCaseResult> => {
        let clockReads: number = 0;
        const execution: RepaintTestExecution = await execute({
          policy: policy({ maximumAttempts: 1, backoffMs: [] }),
          now: (): Date =>
            clockReads++ < 3
              ? new Date("2026-08-28T10:00:00.000Z")
              : completion(),
          calls: async (): Promise<RepaintProviderOutput> => {
            if (rejectProvider) throw new Error("provider rejected");
            return candidateOutcome();
          },
        });
        return { name, execution, expectedCostUnits, expectedOutput };
      },
    ),
  );
  TestValidator.equals(
    "post-provider clock failure closes at the last valid instant without retry",
    postProviderClockFailures.map(({ name, execution: { result } }: typeof postProviderClockFailures[number]): RepaintClockObservation => ({
      name,
      stop: result.stop,
      attempts: result.attempts.length,
      status: result.attempts[0]?.status,
      failure: result.attempts[0]?.failure?.class,
      retryable: result.attempts[0]?.failure?.retryable,
      costUnits: result.attempts[0]?.costUnits,
      output: result.attempts[0]?.availableOutput?.digest ?? null,
      startedAt: result.attempts[0]?.startedAt,
      completedAt: result.attempts[0]?.completedAt,
    })),
    postProviderClockFailures.map(
      ({ name, expectedCostUnits, expectedOutput }: typeof postProviderClockFailures[number]): RepaintClockObservation => ({
        name,
        stop: "not-retryable" as const,
        attempts: 1,
        status: "failed" as const,
        failure: "internal" as const,
        retryable: false,
        costUnits: expectedCostUnits,
        output: expectedOutput,
        startedAt: "2026-08-28T10:00:00.000Z",
        completedAt: "2026-08-28T10:00:00.000Z",
      }),
    ),
  );
  const cancelledClockController: AbortController = new AbortController();
  let cancelledClockReads: number = 0;
  const cancelledDuringCompletionClock: RepaintTestExecution = await execute({
    policy: policy({ maximumAttempts: 1, backoffMs: [] }),
    signal: cancelledClockController.signal,
    now: (): Date => {
      if (cancelledClockReads++ < 3)
        return new Date("2026-08-28T10:00:00.000Z");
      cancelledClockController.abort("cancel during completion clock");
      return new Date(Number.NaN);
    },
    calls: async (): Promise<RepaintProviderOutput> => candidateOutcome(),
  });
  TestValidator.equals(
    "real cancellation dominates a simultaneous completion-clock failure",
    {
      stop: cancelledDuringCompletionClock.result.stop,
      attempts: cancelledDuringCompletionClock.result.attempts.length,
      status: cancelledDuringCompletionClock.result.attempts[0]?.status,
      failure:
        cancelledDuringCompletionClock.result.attempts[0]?.failure?.class,
      costUnits: cancelledDuringCompletionClock.result.attempts[0]?.costUnits,
      output:
        cancelledDuringCompletionClock.result.attempts[0]?.availableOutput
          ?.digest,
    },
    {
      stop: "cancelled",
      attempts: 1,
      status: "cancelled",
      failure: "cancelled",
      costUnits: 1,
      output: digest("candidate"),
    },
  );
  let malformedAttemptListenerRemovals: number = 0;
  const malformedAttemptSignal: AbortSignal = {
    aborted: false,
    addEventListener: (): void => undefined,
    removeEventListener: (): void => {
      ++malformedAttemptListenerRemovals;
    },
  } as unknown as AbortSignal;
  const malformedAttemptWithSignal: string = await rejectionMessage((): Promise<unknown> =>
    execute({
      policy: policy(),
      signal: malformedAttemptSignal,
      attemptId: (): string => " padded ",
      calls: async (): Promise<RepaintNumericProviderOutput> => ({
        value: 1,
        costUnits: 0,
        availableOutput: null,
      }),
    }),
  );
  TestValidator.equals(
    "attempt-id refusal detaches a resident cancellation relay",
    {
      rejected: malformedAttemptWithSignal.includes(
        "attempt id must be trimmed",
      ),
      removals: malformedAttemptListenerRemovals,
    },
    { rejected: true, removals: 1 },
  );
  const malformedMessages: string[] = await Promise.all([
    rejectionMessage((): Promise<unknown> =>
      execute({
        policy: policy(),
        requestId: " ",
        calls: async (): Promise<RepaintNumericProviderOutput> => ({ value: 1, costUnits: 0, availableOutput: null }),
      }),
    ),
    rejectionMessage((): Promise<unknown> =>
      execute({
        policy: policy(),
        attemptId: (): string => " padded ",
        calls: async (): Promise<RepaintNumericProviderOutput> => ({ value: 1, costUnits: 0, availableOutput: null }),
      }),
    ),
    rejectionMessage((): Promise<unknown> =>
      execute({
        policy: policy(),
        now: (): Date => new Date(Number.NaN),
        calls: async (): Promise<RepaintNumericProviderOutput> => ({ value: 1, costUnits: 0, availableOutput: null }),
      }),
    ),
    rejectionMessage((): Promise<unknown> => {
      let instant: number = 0;
      return execute({
        policy: policy(),
        now: (): Date =>
          instant++ < 2
            ? new Date("2026-08-28T10:00:00.000Z")
            : new Date(Number.NaN),
        calls: async (): Promise<RepaintNumericProviderOutput> => ({ value: 1, costUnits: 0, availableOutput: null }),
      });
    }),
    rejectionMessage((): Promise<unknown> => {
      let instant: number = 0;
      return execute({
        policy: policy(),
        now: (): Date => {
          if (instant++ === 0) return new Date("2026-08-28T10:00:00.000Z");
          throw nonError("clock unavailable");
        },
        calls: async (): Promise<RepaintNumericProviderOutput> => ({ value: 1, costUnits: 0, availableOutput: null }),
      });
    }),
    rejectionMessage((): Promise<unknown> => {
      let instant: number = 0;
      const malformedClockError: Error = new Error("placeholder");
      malformedClockError.message = null as unknown as string;
      return execute({
        policy: policy(),
        now: (): Date => {
          if (instant++ === 0) return new Date("2026-08-28T10:00:00.000Z");
          throw malformedClockError;
        },
        calls: async (): Promise<RepaintNumericProviderOutput> => ({ value: 1, costUnits: 0, availableOutput: null }),
      });
    }),
  ]);
  TestValidator.predicate(
    "invalid request, attempt, and pre-provider clock instants reject",
    malformedMessages[0]?.includes("UUID v4") === true &&
      malformedMessages[1]?.includes("trimmed") === true &&
      malformedMessages.some((message: string): boolean => message.includes("valid instant")) &&
      malformedMessages.at(-1) ===
        "Repaint request elapsed clock observation failed without an inspectable message.",
  );

}
