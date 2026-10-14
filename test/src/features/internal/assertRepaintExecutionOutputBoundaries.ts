import type { IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";
import { AutoMovieRepaintAttemptError } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { executeRepaintTestRequest } from "./executeRepaintTestRequest";

/** Existing generic wrapper signature borrowed by the original case groups. */
type RepaintTestExecutor = <T>(props: Parameters<typeof executeRepaintTestRequest<T>>[0]) => ReturnType<typeof executeRepaintTestRequest<T>>;
/** Actual executor result and observer array for cases that inspect metadata only. */
type RepaintTestExecution = Awaited<ReturnType<typeof executeRepaintTestRequest<unknown>>>;
/** Original string-valued provider disclosure shape. */
type RepaintProviderOutput = Awaited<ReturnType<Parameters<typeof executeRepaintTestRequest<string>>[0]["calls"]>>;

/** Run the original malformed identity/output/disclosure cases at their original position and return the same local candidate/rejection closures for the following completion-clock cases. No new runtime host or case is registered. */
export async function assertRepaintExecutionOutputBoundaries(
  execute: RepaintTestExecutor,
  policy: (override?: Partial<IAutoMovieRepaintExecutionPolicy>) => IAutoMovieRepaintExecutionPolicy,
  digest: (value: string) => string
): Promise<{ rejectionMessage: (operation: () => Promise<unknown>) => Promise<string>; candidateOutcome: () => { value: string; costUnits: number; availableOutput: { digest: string; bytes: number } } }> {
  const rejectionMessage: (operation: () => Promise<unknown>) => Promise<string> = async (
    operation: () => Promise<unknown>,
  ): Promise<string> => {
    try {
      await operation();
      throw new Error("Malformed execution unexpectedly resolved.");
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  };
  const candidateOutcome: () => { value: string; costUnits: number; availableOutput: { digest: string; bytes: number } } = (): { value: string; costUnits: number; availableOutput: { digest: string; bytes: number } } => ({
    value: "candidate",
    costUnits: 1,
    availableOutput: { digest: digest("candidate"), bytes: 4 },
  });
  let invalidIdentityProviderCalls: number = 0;
  const invalidIdentityMessages: string[] = await Promise.all(
    [
      { productionId: " " },
      { shot: 42 as unknown as string },
      { requestId: "not-a-request-id" },
      { requestFingerprint: "sha256:bad" as string },
      { compileFingerprint: "sha256:bad" as string },
      { sourceRenderFingerprint: "sha256:bad" as string },
      { adapterIdentity: "{" },
      {
        adapterIdentity: JSON.stringify({
          protocolVersion: "automovie.repaint-runtime.v1",
          provider: "fixed",
          model: "fixed",
          version: "1",
          execution: "local",
        }),
      },
      { seed: 1.5 },
      { ordinalOffset: -1 },
      { ordinalOffset: 1.5 },
      { ordinalOffset: Number.MAX_SAFE_INTEGER },
    ].map((override: Partial<Parameters<typeof executeRepaintTestRequest<unknown>>[0]>): Promise<string> =>
      rejectionMessage((): Promise<unknown> =>
        execute({
          ...override,
          policy: policy(),
          calls: async (): Promise<RepaintProviderOutput> => {
            ++invalidIdentityProviderCalls;
            return candidateOutcome();
          },
        }),
      ),
    ),
  );
  TestValidator.predicate(
    "immutable request identity refuses every malformed runtime fact before provider execution",
    invalidIdentityProviderCalls === 0 &&
      invalidIdentityMessages.every(
        (message: string): boolean => message !== "Malformed execution unexpectedly resolved.",
      ),
  );

  const malformedOutcomes: Array<RepaintTestExecution> = await Promise.all(
    [
      null,
      { digest: "sha256:bad" as string, bytes: 1 },
      { digest: digest("candidate"), bytes: 0 },
      { digest: digest("candidate"), bytes: 1.5 },
    ].map((availableOutput: { digest: string; bytes: number } | null): ReturnType<typeof execute<unknown>> =>
      execute({
        policy: policy({ maximumAttempts: 1, backoffMs: [] }),
        calls: async (): Promise<RepaintProviderOutput> => ({
          value: "candidate",
          costUnits: 1,
          availableOutput,
        }),
      }),
    ),
  );
  TestValidator.equals(
    "null or malformed successful output disclosures close as invalid terminal attempts",
    malformedOutcomes.map(({ result }: typeof malformedOutcomes[number]): { stop: typeof result.stop; accepted: typeof result.accepted; status: typeof result.attempts[number]["status"] | undefined; failure: string | undefined } => ({
      stop: result.stop,
      accepted: result.accepted,
      status: result.attempts[0]?.status,
      failure: result.attempts[0]?.failure?.class,
    })),
    malformedOutcomes.map(
      (): { readonly stop: "not-retryable"; readonly accepted: null; readonly status: "invalid"; readonly failure: "invalid-output" } =>
        ({
          stop: "not-retryable",
          accepted: null,
          status: "invalid",
          failure: "invalid-output",
        }) as const,
    ),
  );
  const hostileOutcomeValue: RepaintTestExecution = await execute({
    policy: policy({ maximumAttempts: 1, backoffMs: [] }),
    calls: async (): Promise<{ value: string; costUnits: number; availableOutput: { digest: string; bytes: number } }> =>
      Object.defineProperty(
        {
          costUnits: 2,
          availableOutput: { digest: digest("hostile-value"), bytes: 8 },
        },
        "value",
        {
          get: (): never => {
            throw new Error("hostile output value getter");
          },
        },
      ) as {
        value: string;
        costUnits: number;
        availableOutput: {
          digest: string;
          bytes: number;
        };
      },
  });
  TestValidator.equals(
    "an unreadable accepted value closes exactly one invalid terminal attempt",
    {
      stop: hostileOutcomeValue.result.stop,
      attempts: hostileOutcomeValue.result.attempts.length,
      status: hostileOutcomeValue.result.attempts[0]?.status,
      failure: hostileOutcomeValue.result.attempts[0]?.failure?.class,
      costUnits: hostileOutcomeValue.result.attempts[0]?.costUnits,
      output: hostileOutcomeValue.result.attempts[0]?.availableOutput,
    },
    {
      stop: "not-retryable",
      attempts: 1,
      status: "invalid",
      failure: "invalid-output",
      costUnits: 2,
      output: { digest: digest("hostile-value"), bytes: 8 },
    },
  );

  const nonStringMessage: AutoMovieRepaintAttemptError = new AutoMovieRepaintAttemptError(
    "provider-refusal",
    "placeholder",
  );
  nonStringMessage.message = null as unknown as string;
  const malformedDisclosures: AutoMovieRepaintAttemptError[] = [
    new AutoMovieRepaintAttemptError(
      "unsupported" as "provider-refusal",
      "unsupported class",
    ),
    new AutoMovieRepaintAttemptError(
      "provider-refusal",
      "invalid cost",
      Number.NaN,
    ),
    new AutoMovieRepaintAttemptError(
      "provider-refusal",
      "invalid partial output",
      1,
      { digest: digest("partial"), bytes: 0 },
    ),
    nonStringMessage,
  ];
  const malformedDisclosureResults: Array<RepaintTestExecution> = await Promise.all(
    malformedDisclosures.map((disclosure: AutoMovieRepaintAttemptError): ReturnType<typeof execute<unknown>> =>
      execute({
        policy: policy({ maximumAttempts: 1, backoffMs: [] }),
        calls: async (): Promise<RepaintProviderOutput> => {
          throw disclosure;
        },
      }),
    ),
  );
  TestValidator.equals(
    "malformed failure disclosures still preserve one well-formed terminal attempt",
    malformedDisclosureResults.map(({ result }: typeof malformedDisclosureResults[number]): { stop: typeof result.stop; attempts: number; status: typeof result.attempts[number]["status"] | undefined; failure: string | undefined; costUnits: number | undefined; availableOutput: { digest: string; bytes: number } | null | undefined } => ({
      stop: result.stop,
      attempts: result.attempts.length,
      status: result.attempts[0]?.status,
      failure: result.attempts[0]?.failure?.class,
      costUnits: result.attempts[0]?.costUnits,
      availableOutput: result.attempts[0]?.availableOutput,
    })),
    malformedDisclosures.map(
      (): { readonly stop: "not-retryable"; readonly attempts: 1; readonly status: "invalid"; readonly failure: "invalid-output"; readonly costUnits: 0; readonly availableOutput: null } =>
        ({
          stop: "not-retryable",
          attempts: 1,
          status: "invalid",
          failure: "invalid-output",
          costUnits: 0,
          availableOutput: null,
        }) as const,
    ),
  );
  const malformedCancelledController: AbortController = new AbortController();
  const malformedCancelled: RepaintTestExecution = await execute({
    policy: policy({ maximumAttempts: 1, backoffMs: [] }),
    signal: malformedCancelledController.signal,
    calls: async (): Promise<RepaintProviderOutput> => {
      malformedCancelledController.abort("cancel malformed disclosure");
      throw new AutoMovieRepaintAttemptError(
        "provider-refusal",
        "invalid cost during cancellation",
        -1,
      );
    },
  });
  TestValidator.equals(
    "outer cancellation dominates malformed disclosure without losing terminal state",
    {
      stop: malformedCancelled.result.stop,
      status: malformedCancelled.result.attempts[0]?.status,
      failure: malformedCancelled.result.attempts[0]?.failure?.class,
      costUnits: malformedCancelled.result.attempts[0]?.costUnits,
    },
    {
      stop: "cancelled",
      status: "cancelled",
      failure: "cancelled",
      costUnits: 0,
    },
  );
  const hostileProviderRejections: Array<RepaintTestExecution> = await Promise.all(
    [
      new Proxy(
        {},
        {
          get: (): never => {
            throw new Error("hostile provider getter");
          },
          getPrototypeOf: (): never => {
            throw new Error("hostile provider prototype");
          },
        },
      ),
      {
        [Symbol.toPrimitive]: (): never => {
          throw new Error("hostile provider stringification");
        },
      },
    ].map((rejection: object): ReturnType<typeof execute<unknown>> =>
      execute({
        policy: policy({ maximumAttempts: 1, backoffMs: [] }),
        calls: async (): Promise<RepaintProviderOutput> => {
          throw rejection;
        },
      }),
    ),
  );
  TestValidator.equals(
    "hostile provider rejection inspection cannot erase a started attempt",
    hostileProviderRejections.map(({ result }: typeof hostileProviderRejections[number]): { stop: typeof result.stop; attempts: number; status: typeof result.attempts[number]["status"] | undefined; failure: string | undefined } => ({
      stop: result.stop,
      attempts: result.attempts.length,
      status: result.attempts[0]?.status,
      failure: result.attempts[0]?.failure?.class,
    })),
    hostileProviderRejections.map(
      (): { readonly stop: "not-retryable"; readonly attempts: 1; readonly status: "failed"; readonly failure: "internal" } =>
        ({
          stop: "not-retryable",
          attempts: 1,
          status: "failed",
          failure: "internal",
        }) as const,
    ),
  );

  return { rejectionMessage, candidateOutcome };
}
