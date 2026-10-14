import type {
  IAutoMovieRepaintExecutionPolicy,
  IAutoMovieRepaintReceipt,
} from "@automovie/interface";
import {
  AutoMovieProductionContext,
  AutoMovieProductionRepaintService,
  AutoMovieRepaintAttemptError,
  type IAutoMovieProductionServices,
  canonicalAutoMovieRepaintRuntimeIdentity,
  executeAutoMovieRepaintRequest,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

const digest: (value: string) => string = (value: string): string =>
  `sha256:${Buffer.from(value).toString("hex").padEnd(64, "0").slice(0, 64)}`;

const nonError: (message: string) => string = (message: string): string => message;

const selection: Parameters<AutoMovieProductionRepaintService["select"]>[1] = {
  productionId: "boundary-production",
  shot: "opening",
  attemptId: "20000000-0000-4000-8000-000000000001",
  kind: "selection" as const,
  reason: "The reviewed rendition preserves the authored staging.",
  structuralReview: "Depth and mask controls preserve the source geometry.",
  continuityReview: null,
};

const contextWith: (forProduction: (productionId: string) => IAutoMovieProductionServices) => AutoMovieProductionContext = (
  forProduction: (productionId: string) => IAutoMovieProductionServices,
): AutoMovieProductionContext =>
  ({ forProduction }) as unknown as AutoMovieProductionContext;

const diagnosticCode: (result: ReturnType<AutoMovieProductionRepaintService["select"]>) => string | undefined = (
  result: ReturnType<AutoMovieProductionRepaintService["select"]>,
): string | undefined => result.diagnostics[0]?.code;

/**
 * Public repaint boundaries contain hostile input, lookup, and observer code.
 *
 * Scenarios:
 *
 * 1. Selection validation rejects non-objects, hidden fields, and hostile or
 *    unclonable proxies before consulting the production context.
 * 2. Registered-project lookup and selection failures remain structured
 *    repaint diagnostics, while a valid selection preserves its receipt.
 * 3. A throwing attempt observer stops successful, failed, and over-budget
 *    provider outcomes with exactly one immutable terminal attempt.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual public selection validation/containment and the real async request executor; compares exact diagnostic codes, safe identity projection, lookup count, forwarded receipt identity and terminal observer-failure records.
 * @evidence contracts/testing.md#independent-expectations Literal code/identity/count/status records define the oracle, and receipt reference equality checks forwarding only. Existing structural context/service substitutes and a request-id-only receipt do not independently establish full context or receipt admission.
 * @evidence contracts/testing.md#distinguishing-cases Preserves null/extra-field/hostile/unclonable selections before lookup, Error and non-Error lookup failures, selection success versus commit/clock failure, and successful/refused/over-budget provider outcomes whose observer throws.
 * @evidence contracts/testing.md#execution-ownership The named asynchronous test executes synchronous selection cases and awaits three actual executor runs with injected provider/clock/observer capabilities. No real production registration, durable selection or receipt schema validation occurs; structural context/receipt arrangements remain pending their declared port contract repair.
 */
export async function test_production_repaint_public_boundary_containment(): Promise<void> {
    const service: AutoMovieProductionRepaintService = new AutoMovieProductionRepaintService();
    let lookups: number = 0;
    const forbiddenContext: AutoMovieProductionContext = contextWith((): never => {
      ++lookups;
      throw new Error("selection validation performed a project lookup");
    });
    const hostileInput: typeof selection = new Proxy(selection, {
      get: (_target: typeof selection, key: string | symbol, receiver: unknown): unknown => {
        if (key === "productionId") throw new Error("hostile production id");
        return Reflect.get(selection, key, receiver);
      },
    });
    const unclonableInput: typeof selection = new Proxy(selection, {});
    const invalidResults: Array<ReturnType<AutoMovieProductionRepaintService["select"]>> = [
      service.select(forbiddenContext, null as never),
      service.select(forbiddenContext, { ...selection, hidden: true } as never),
      service.select(forbiddenContext, hostileInput),
      service.select(forbiddenContext, unclonableInput),
    ];
    TestValidator.equals(
      "invalid and hostile selection inputs fail before project lookup",
      {
        codes: invalidResults.map(diagnosticCode),
        identities: invalidResults.map((result: ReturnType<AutoMovieProductionRepaintService["select"]>): { productionId: string; shot: string } => ({
          productionId: result.productionId,
          shot: result.shot,
        })),
        lookups,
      },
      {
        codes: Array.from({ length: 4 }, (): string => "repaint-input-invalid"),
        identities: [
          { productionId: "", shot: "" },
          { productionId: "boundary-production", shot: "opening" },
          { productionId: "", shot: "opening" },
          { productionId: "boundary-production", shot: "opening" },
        ],
        lookups: 0,
      },
    );

    const unregistered: Array<ReturnType<AutoMovieProductionRepaintService["select"]>> = [
      service.select(
        contextWith((): never => {
          throw new Error("production is not registered");
        }),
        selection,
      ),
      service.select(
        contextWith((): never => {
          throw nonError("non-error production lookup");
        }),
        selection,
      ),
    ];
    TestValidator.equals(
      "unregistered production lookups remain structured diagnostics",
      unregistered.map((result: ReturnType<AutoMovieProductionRepaintService["select"]>): { code: string | undefined; productionId: string; shot: string } => ({
        code: diagnosticCode(result),
        productionId: result.productionId,
        shot: result.shot,
      })),
      Array.from({ length: 2 }, (): { code: string; productionId: string; shot: string } => ({
        code: "repaint-production-unregistered",
        productionId: selection.productionId,
        shot: selection.shot,
      })),
    );

    const receipt: IAutoMovieRepaintReceipt = {
      requestId: "10000000-0000-4000-8000-000000000001",
    } as unknown as IAutoMovieRepaintReceipt;
    const selected: ReturnType<AutoMovieProductionRepaintService["select"]> = service.select(
      contextWith(
        (): IAutoMovieProductionServices =>
          ({
            project: {
              selectRepaintCandidate: (): IAutoMovieRepaintReceipt => receipt,
            },
          }) as unknown as IAutoMovieProductionServices,
      ),
      selection,
    );
    const commitFailures: Array<ReturnType<AutoMovieProductionRepaintService["select"]>> = [
      service.select(
        contextWith(
          (): IAutoMovieProductionServices =>
            ({
              project: {
                selectRepaintCandidate: (): never => {
                  throw new Error("selection commit refused");
                },
              },
            }) as unknown as IAutoMovieProductionServices,
        ),
        selection,
      ),
      new AutoMovieProductionRepaintService(undefined, undefined, {
        policy: executionPolicy(),
        evidence: {
          prompt: "prompt.md#repaint",
          continuity: null,
          settings: "settings/world.md#appearance",
          design: "design/characters.md#lead",
          screenplayOrBrief: "screenplays/final.md#opening",
          shot: "shots/opening.ts#shot",
        },
        now: (): never => {
          throw new Error("selection clock unavailable");
        },
      }).select(
        contextWith(
          (): IAutoMovieProductionServices =>
            ({
              project: {
                selectRepaintCandidate: (): IAutoMovieRepaintReceipt => receipt,
              },
            }) as unknown as IAutoMovieProductionServices,
        ),
        selection,
      ),
    ];
    TestValidator.equals(
      "selection success and commit failures retain their public result contract",
      {
        selected: {
          selected: selected.selected,
          requestId: selected.requestId,
          receipt: selected.receipt === receipt,
        },
        failures: commitFailures.map(diagnosticCode),
      },
      {
        selected: {
          selected: true,
          requestId: "10000000-0000-4000-8000-000000000001",
          receipt: true,
        },
        failures: ["repaint-commit-refused", "repaint-commit-refused"],
      },
    );

    const adapterIdentity: string = canonicalAutoMovieRepaintRuntimeIdentity({
      protocolVersion: "automovie.repaint-runtime.v1",
      provider: "boundary-provider",
      model: "boundary-model",
      version: "1",
      execution: "local",
    });
    const execute = async (props: {
      maximumCostUnits: number;
      outcome: () => Promise<{
        value: string;
        costUnits: number;
        availableOutput: {
          digest: string;
          bytes: number;
        } | null;
      }>;
    }): ReturnType<typeof executeAutoMovieRepaintRequest<string>> =>
      executeAutoMovieRepaintRequest({
        productionId: selection.productionId,
        shot: selection.shot,
        requestId: "10000000-0000-4000-8000-000000000001",
        requestFingerprint: digest("request"),
        compileFingerprint: digest("compile"),
        sourceRenderFingerprint: digest("source"),
        adapterIdentity,
        seed: 17,
        policy: executionPolicy({ maximumCostUnits: props.maximumCostUnits }),
        runtime: {
          now: (): Date => new Date("2026-08-28T10:00:00.000Z"),
          attemptId: (): string => "20000000-0000-4000-8000-000000000001",
          wait: async (): Promise<void> => undefined,
        },
        execute: props.outcome,
        onAttempt: (): never => {
          throw new Error("attempt observer unavailable");
        },
      });
    const observed: Array<Awaited<ReturnType<typeof execute>>> = await Promise.all([
      execute({
        maximumCostUnits: 5,
        outcome: async (): Promise<{ value: string; costUnits: number; availableOutput: { digest: string; bytes: number } }> => ({
          value: "accepted",
          costUnits: 1,
          availableOutput: { digest: digest("accepted"), bytes: 8 },
        }),
      }),
      execute({
        maximumCostUnits: 5,
        outcome: async (): Promise<never> => {
          throw new AutoMovieRepaintAttemptError(
            "provider-refusal",
            "provider declined the request",
            1,
          );
        },
      }),
      execute({
        maximumCostUnits: 0.5,
        outcome: async (): Promise<{ value: string; costUnits: number; availableOutput: { digest: string; bytes: number } }> => ({
          value: "over-budget",
          costUnits: 1,
          availableOutput: { digest: digest("over-budget"), bytes: 9 },
        }),
      }),
    ]);
    TestValidator.equals(
      "throwing observers preserve one terminal record and never accept",
      observed.map((result: Awaited<ReturnType<typeof execute>>): { stop: typeof result.stop; accepted: typeof result.accepted; attempts: number; status: typeof result.attempts[number]["status"] | undefined; failure: string | null; costUnits: number | undefined } => ({
        stop: result.stop,
        accepted: result.accepted,
        attempts: result.attempts.length,
        status: result.attempts[0]?.status,
        failure: result.attempts[0]?.failure?.class ?? null,
        costUnits: result.attempts[0]?.costUnits,
      })),
      [
        {
          stop: "observer-failed",
          accepted: null,
          attempts: 1,
          status: "succeeded",
          failure: null,
          costUnits: 1,
        },
        {
          stop: "observer-failed",
          accepted: null,
          attempts: 1,
          status: "failed",
          failure: "provider-refusal",
          costUnits: 1,
        },
        {
          stop: "observer-failed",
          accepted: null,
          attempts: 1,
          status: "failed",
          failure: "budget-exhausted",
          costUnits: 1,
        },
      ],
    );
  }

const executionPolicy: (override?: Partial<IAutoMovieRepaintExecutionPolicy>) => IAutoMovieRepaintExecutionPolicy = (
  override: Partial<IAutoMovieRepaintExecutionPolicy> = {},
): IAutoMovieRepaintExecutionPolicy => ({
  maximumAttempts: 1,
  attemptTimeoutMs: 1_000,
  maximumElapsedMs: 10_000,
  maximumCostUnits: 5,
  backoffMs: [],
  retryableFailures: ["timeout", "rate-limit", "transport"],
  ...override,
});
