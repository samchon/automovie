import type { IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { executeRepaintTestRequest } from "./executeRepaintTestRequest";

/** Existing generic wrapper signature borrowed by the original case groups. */
type RepaintTestExecutor = <T>(props: Parameters<typeof executeRepaintTestRequest<T>>[0]) => ReturnType<typeof executeRepaintTestRequest<T>>;

/** Run the original claim-admission cases after all preceding executor cases, preserving owner ids, refusal causes, provider call counts and acquired success without registering another test. */
export async function assertRepaintExecutionAdmissionBoundaries(
  execute: RepaintTestExecutor,
  policy: (override?: Partial<IAutoMovieRepaintExecutionPolicy>) => IAutoMovieRepaintExecutionPolicy,
  digest: (value: string) => string
): Promise<void> {
  let admittedProviderCalls: number = 0;
  const admitted: (admitAttempt: () => unknown) => ReturnType<typeof execute<number>> = (
    admitAttempt: () => unknown,
  ): ReturnType<typeof execute<number>> =>
    execute<number>({
      policy: policy(),
      admitAttempt: admitAttempt as NonNullable<
        Parameters<typeof execute>[0]["admitAttempt"]
      >,
      calls: async (): Promise<{ value: number; costUnits: number; availableOutput: { digest: string; bytes: number } | null }> => {
        ++admittedProviderCalls;
        return {
          value: 1,
          costUnits: 1,
          availableOutput: { digest: digest("admitted"), bytes: 4 },
        };
      },
    });
  const [
    heldByOwner,
    closedByUnknownOutcome,
    movedPrefix,
    storeThrew,
    storeOutsideContract,
    storeWithoutOwner,
    acquired,
  ]: [Awaited<ReturnType<typeof execute<number>>>, Awaited<ReturnType<typeof execute<number>>>, Awaited<ReturnType<typeof execute<number>>>, Awaited<ReturnType<typeof execute<number>>>, Awaited<ReturnType<typeof execute<number>>>, Awaited<ReturnType<typeof execute<number>>>, Awaited<ReturnType<typeof execute<number>>>] = await Promise.all([
    admitted((): unknown => ({ status: "already-active", ownerAttemptId: "owner-1" })),
    admitted((): unknown => ({ status: "unknown-outcome", ownerAttemptId: "owner-2" })),
    admitted((): unknown => ({ status: "prefix-changed" })),
    admitted((): never => {
      throw new Error("claim store offline");
    }),
    admitted((): unknown => ({ status: "granted" })),
    admitted((): unknown => ({ status: "already-active", ownerAttemptId: " " })),
    admitted(async (): Promise<unknown> => ({ status: "acquired" })),
  ]);
  const signalled: Awaited<ReturnType<typeof execute<number>>> = await execute<number>({
    policy: policy(),
    signal: new AbortController().signal,
    admitAttempt: ((): never => {
      throw new Error("claim store offline");
    }) as NonNullable<Parameters<typeof execute>[0]["admitAttempt"]>,
    calls: async (): Promise<{ value: number; costUnits: number; availableOutput: { digest: string; bytes: number } | null }> => ({ value: 1, costUnits: 0, availableOutput: null }),
  });
  const refusalOf: (outcome: Awaited<ReturnType<typeof execute<number>>>) => { stop: Awaited<ReturnType<typeof execute<number>>>["result"]["stop"]; attempts: number; records: number; accepted: Awaited<ReturnType<typeof execute<number>>>["result"]["accepted"]; claimRefusal: Awaited<ReturnType<typeof execute<number>>>["result"]["claimRefusal"] } = (
    outcome: Awaited<ReturnType<typeof execute<number>>>,
  ): { stop: typeof outcome.result.stop; attempts: number; records: number; accepted: typeof outcome.result.accepted; claimRefusal: typeof outcome.result.claimRefusal } => ({
    stop: outcome.result.stop,
    attempts: outcome.result.attempts.length,
    records: outcome.records.length,
    accepted: outcome.result.accepted,
    claimRefusal: outcome.result.claimRefusal,
  });
  TestValidator.equals(
    "a refused, thrown, or malformed admission stops before the provider with its typed cause",
    {
      heldByOwner: refusalOf(heldByOwner),
      closedByUnknownOutcome: refusalOf(closedByUnknownOutcome),
      movedPrefix: refusalOf(movedPrefix),
      storeThrew: refusalOf(storeThrew),
      storeOutsideContract: refusalOf(storeOutsideContract),
      storeWithoutOwner: refusalOf(storeWithoutOwner),
      acquired: {
        stop: acquired.result.stop,
        attempts: acquired.result.attempts.length,
        claimRefusal: acquired.result.claimRefusal,
      },
      providerCalls: admittedProviderCalls,
      signalledStoreThrew: refusalOf(signalled),
    },
    {
      heldByOwner: {
        stop: "claim-refused",
        attempts: 0,
        records: 0,
        accepted: null,
        claimRefusal: { status: "already-active", ownerAttemptId: "owner-1" },
      },
      closedByUnknownOutcome: {
        stop: "claim-refused",
        attempts: 0,
        records: 0,
        accepted: null,
        claimRefusal: { status: "unknown-outcome", ownerAttemptId: "owner-2" },
      },
      movedPrefix: {
        stop: "claim-refused",
        attempts: 0,
        records: 0,
        accepted: null,
        claimRefusal: { status: "prefix-changed" },
      },
      storeThrew: {
        stop: "claim-refused",
        attempts: 0,
        records: 0,
        accepted: null,
        claimRefusal: {
          status: "admission-failed",
          message: "claim store offline",
        },
      },
      storeOutsideContract: {
        stop: "claim-refused",
        attempts: 0,
        records: 0,
        accepted: null,
        claimRefusal: {
          status: "admission-failed",
          message:
            "Repaint attempt claim store answered outside the admission contract.",
        },
      },
      storeWithoutOwner: {
        stop: "claim-refused",
        attempts: 0,
        records: 0,
        accepted: null,
        claimRefusal: {
          status: "admission-failed",
          message:
            "Repaint attempt claim store reported already-active without naming the owning attempt.",
        },
      },
      acquired: { stop: "accepted", attempts: 1, claimRefusal: null },
      providerCalls: 1,
      signalledStoreThrew: {
        stop: "claim-refused",
        attempts: 0,
        records: 0,
        accepted: null,
        claimRefusal: {
          status: "admission-failed",
          message: "claim store offline",
        },
      },
    },
  );
}
