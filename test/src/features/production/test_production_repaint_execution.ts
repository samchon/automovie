import type {
  IAutoMovieRepaintExecutionPolicy,
} from "@automovie/interface";
import {
  AutoMovieRepaintAttemptError,
  assertAutoMovieRepaintExecutionPolicy,
  canonicalAutoMovieRepaintRuntimeIdentity,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { executeRepaintTestRequest } from "../internal/executeRepaintTestRequest";
import { assertRepaintExecutionRetryBoundaries } from "../internal/assertRepaintExecutionRetryBoundaries";
import { assertRepaintExecutionClockBoundaries } from "../internal/assertRepaintExecutionClockBoundaries";
import { assertRepaintExecutionAdmissionBoundaries } from "../internal/assertRepaintExecutionAdmissionBoundaries";

const digest: (value: string) => string = (value: string): string =>
  `sha256:${Buffer.from(value).toString("hex").padEnd(64, "0").slice(0, 64)}`;

const adapterIdentity: string = canonicalAutoMovieRepaintRuntimeIdentity({
  protocolVersion: "automovie.repaint-runtime.v1",
  provider: "fixed",
  model: "fixed",
  version: "1",
  execution: "local",
});

const nonError: (message: string) => string = (message: string): string => message;

const policy: (override?: Partial<IAutoMovieRepaintExecutionPolicy>) => IAutoMovieRepaintExecutionPolicy = (
  override: Partial<IAutoMovieRepaintExecutionPolicy> = {},
): IAutoMovieRepaintExecutionPolicy => ({
  maximumAttempts: 3,
  attemptTimeoutMs: 1_000,
  maximumElapsedMs: 10_000,
  maximumCostUnits: 5,
  backoffMs: [10, 20],
  retryableFailures: ["rate-limit", "timeout", "transport"],
  ...override,
});

const messageOf: (operation: () => unknown) => string | null = (operation: () => unknown): string | null => {
  try {
    operation();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

/** Forward the unchanged defaults into the canonical original test wrapper. */
function execute<T>(props: Parameters<typeof executeRepaintTestRequest<T>>[0]): ReturnType<typeof executeRepaintTestRequest<T>> {
  return executeRepaintTestRequest(props, { digest, adapterIdentity });
}

/**
 * Repaint execution is bounded, retry-classified, and candidate-only.
 *
 * Scenarios:
 *
 * 1. Policy validation rejects every malformed budget and retry vocabulary.
 * 2. A rate limit retries with the same request id, distinct attempt ids, and
 *    deterministic backoff, then stops on the first accepted candidate.
 * 3. Provider refusal, invalid partial output, timeout, cancellation, elapsed
 *    exhaustion, and cost exhaustion all close without a candidate.
 * 4. A dispatch admission the claim store refuses, throws on, or answers
 *    outside its contract stops the request before any provider call and
 *    carries the typed cause beside the stop reason; an acquired admission
 *    dispatches normally and carries no refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes the real bounded request executor and policy admission, asserting retry identities/backoff, terminal stop classes, candidate absence, disclosed outputs/costs, clock behavior and claim refusal before provider calls across the original ordered cases.
 * @evidence contracts/testing.md#independent-expectations Literal identities, counters, failure/status records and expected output disclosures define the oracle; observer-record comparison additionally checks forwarding to the same execution result and does not prove disk durability.
 * @evidence contracts/testing.md#distinguishing-cases Keeps policy/identity/output/admission refusals, retry versus terminal failures, timeout/cancellation/deadline races, backward or hostile clocks, malformed/hostile disclosures and acquired admission. Existing listener-registration/removal assertions retain structural signal substitutes and remain pending a compliant observation contract rather than proving native signal behavior.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous entry awaits original cases through canonical local helpers and the real executor. Most clocks/waits/provider outcomes are injected while timeout cases use host timers; no real provider, renderer or publication is performed, and the two structural-signal cases remain unverified.
 */
export async function test_production_repaint_execution(): Promise<void> {
  const invalid: IAutoMovieRepaintExecutionPolicy[] = [
    policy({ maximumAttempts: 0, backoffMs: [] }),
    policy({ attemptTimeoutMs: 0 }),
    policy({
      attemptTimeoutMs: 2_147_483_648,
      maximumElapsedMs: 2_147_483_648,
    }),
    policy({ maximumElapsedMs: 0 }),
    policy({ attemptTimeoutMs: 10_001 }),
    policy({ maximumCostUnits: -1 }),
    policy({ backoffMs: [0] }),
    policy({ backoffMs: [0, -1] }),
    policy({ backoffMs: [0, 2_147_483_648] }),
    policy({ retryableFailures: ["timeout", "timeout"] }),
    policy({ retryableFailures: ["unsupported" as "timeout"] }),
    ...["invalid-output", "cancelled", "input-stale", "budget-exhausted"].map(
      (failureClass: string): IAutoMovieRepaintExecutionPolicy =>
        policy({ retryableFailures: [failureClass as "timeout"] }),
    ),
  ];
  TestValidator.predicate(
    "malformed repaint execution policies are refused",
    invalid.every(
      (candidate: IAutoMovieRepaintExecutionPolicy): boolean =>
        messageOf((): void => assertAutoMovieRepaintExecutionPolicy(candidate)) !==
        null,
    ),
  );

  const waits: number[] = [];
  let calls: number = 0;
  const retried: Awaited<ReturnType<typeof execute<string>>> = await execute({
    policy: policy(),
    ordinalOffset: 0,
    wait: (milliseconds: number): Promise<void> => {
      waits.push(milliseconds);
      return Promise.resolve();
    },
    calls: async (): Promise<{ value: string; costUnits: number; availableOutput: { digest: string; bytes: number } }> => {
      calls += 1;
      if (calls === 1) throw { status: 429, message: "slow down" };
      return {
        value: "candidate",
        costUnits: 1,
        availableOutput: { digest: digest("candidate"), bytes: 4 },
      };
    },
  });
  TestValidator.equals(
    "retry keeps request identity and stops on accepted candidate",
    {
      stop: retried.result.stop,
      accepted: retried.result.accepted?.value,
      calls,
      waits,
      requestIds: retried.result.attempts.map((attempt: typeof retried.result.attempts[number]): string => attempt.requestId),
      attemptIds: retried.result.attempts.map((attempt: typeof retried.result.attempts[number]): string => attempt.attemptId),
      states: retried.result.attempts.map((attempt: typeof retried.result.attempts[number]): typeof attempt.status => attempt.status),
      recorded: retried.records,
    },
    {
      stop: "accepted",
      accepted: "candidate",
      calls: 2,
      waits: [10],
      requestIds: [
        "10000000-0000-4000-8000-000000000001",
        "10000000-0000-4000-8000-000000000001",
      ],
      attemptIds: [
        "20000000-0000-4000-8000-000000000001",
        "20000000-0000-4000-8000-000000000002",
      ],
      states: ["failed", "succeeded"],
      recorded: retried.result.attempts,
    },
  );

  const refused: Awaited<ReturnType<typeof execute<unknown>>> = await execute({
    policy: policy(),
    calls: async (): Promise<never> => {
      throw new Error("provider says no");
    },
  });
  const invalidOutput: Awaited<ReturnType<typeof execute<unknown>>> = await execute({
    policy: policy(),
    calls: async (): Promise<never> => {
      throw new AutoMovieRepaintAttemptError(
        "invalid-output",
        "partial mp4",
        1,
        { digest: digest("partial"), bytes: 2 },
      );
    },
  });
  const cost: Awaited<ReturnType<typeof execute<string>>> = await execute({
    policy: policy({
      maximumAttempts: 1,
      maximumCostUnits: 1,
      backoffMs: [],
    }),
    calls: async (): Promise<{ value: string; costUnits: number; availableOutput: { digest: string; bytes: number } }> => ({
      value: "too expensive",
      costUnits: 2,
      availableOutput: { digest: digest("expensive"), bytes: 3 },
    }),
  });
  const cancelledController: AbortController = new AbortController();
  cancelledController.abort("user");
  const cancelled: Awaited<ReturnType<typeof execute<string>>> = await execute({
    policy: policy(),
    signal: cancelledController.signal,
    calls: async (): Promise<{ value: string; costUnits: number; availableOutput: null }> => ({
      value: "unreachable",
      costUnits: 0,
      availableOutput: null,
    }),
  });
  let cancelledDuringRegistration: boolean = false;
  let registrationRemovals: number = 0;
  let registrationAttemptIds: number = 0;
  let registrationProviderCalls: number = 0;
  const registrationRaceSignal: AbortSignal = {
    get aborted(): boolean {
      return cancelledDuringRegistration;
    },
    reason: "cancelled while registering",
    addEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject,
    ): void => {
      cancelledDuringRegistration = true;
      if (typeof listener === "function") listener(new Event("abort"));
      else listener.handleEvent(new Event("abort"));
    },
    removeEventListener: (): void => {
      ++registrationRemovals;
    },
  } as unknown as AbortSignal;
  const cancelledDuringRegistrationResult: Awaited<ReturnType<typeof execute<string>>> = await execute({
    policy: policy(),
    signal: registrationRaceSignal,
    attemptId: (): string => {
      ++registrationAttemptIds;
      return "20000000-0000-4000-8000-000000000099";
    },
    calls: async (): Promise<{ value: string; costUnits: number; availableOutput: null }> => {
      ++registrationProviderCalls;
      return {
        value: "unreachable",
        costUnits: 0,
        availableOutput: null,
      };
    },
  });
  TestValidator.equals(
    "cancellation during listener registration stops before attempt allocation",
    {
      stop: cancelledDuringRegistrationResult.result.stop,
      attempts: cancelledDuringRegistrationResult.result.attempts.length,
      attemptIds: registrationAttemptIds,
      providerCalls: registrationProviderCalls,
      removals: registrationRemovals,
    },
    {
      stop: "cancelled",
      attempts: 0,
      attemptIds: 0,
      providerCalls: 0,
      removals: 1,
    },
  );
  const timedOut: Awaited<ReturnType<typeof execute<unknown>>> = await execute({
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
          (): void => reject(new Error("adapter observed abort")),
          { once: true },
        );
      }),
  });
  const elapsed: Awaited<ReturnType<typeof execute<string>>> = await execute({
    policy: policy(),
    now: ((): (() => Date) => {
      let instant: number = 0;
      return (): Date =>
        new Date(Date.parse("2026-08-28T10:00:00.000Z") + instant++ * 20_000);
    })(),
    calls: async (): Promise<{ value: string; costUnits: number; availableOutput: null }> => ({
      value: "unreachable",
      costUnits: 0,
      availableOutput: null,
    }),
  });
  TestValidator.equals(
    "every bounded refusal closes without a candidate",
    {
      provider: [
        refused.result.stop,
        refused.result.attempts[0]?.failure?.class,
      ],
      invalid: [
        invalidOutput.result.stop,
        invalidOutput.result.attempts[0]?.status,
        invalidOutput.result.attempts[0]?.availableOutput,
      ],
      cost: [
        cost.result.stop,
        cost.result.attempts[0]?.failure?.class,
        cost.result.attempts[0]?.availableOutput,
      ],
      cancelled: [cancelled.result.stop, cancelled.result.attempts.length],
      timeout: [
        timedOut.result.stop,
        timedOut.result.attempts[0]?.failure?.class,
      ],
      elapsed: [elapsed.result.stop, elapsed.result.attempts.length],
    },
    {
      provider: ["not-retryable", "provider-refusal"],
      invalid: [
        "not-retryable",
        "invalid",
        { digest: digest("partial"), bytes: 2 },
      ],
      cost: [
        "cost-exhausted",
        "budget-exhausted",
        { digest: digest("expensive"), bytes: 3 },
      ],
      cancelled: ["cancelled", 0],
      timeout: ["attempts-exhausted", "timeout"],
      elapsed: ["elapsed-exhausted", 0],
    },
  );

  await assertRepaintExecutionRetryBoundaries(execute, policy, digest);
  await assertRepaintExecutionClockBoundaries(execute, policy, digest, nonError);
  await assertRepaintExecutionAdmissionBoundaries(execute, policy, digest);
}
