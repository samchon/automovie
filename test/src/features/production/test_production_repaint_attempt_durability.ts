import {
  AutoMovieRepaintAttemptError,
  executeAutoMovieRepaintRequest,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

const digest: `sha256:${string}` = `sha256:${"2".repeat(64)}` as const;

/**
 * Terminal repaint observers settle before retry execution advances.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual async executor with a retrying provider, refusing terminal observer and abort-ignoring provider; event order, stop causes, call counts and nonretryable unknown outcome expose unawaited observation or unsafe retry.
 * @evidence contracts/testing.md#independent-expectations The authored event protocol requires provider-1,persist-1,backoff,provider-2,persist-2; refusal and unresolved-provider branches must each dispatch once and stop for their stated cause. The observer records memory events, so this test establishes await ordering rather than disk durability or provider reconciliation.
 * @evidence contracts/testing.md#distinguishing-cases Covers retryable rate limit followed by success, observer failure before retry, and a one-millisecond timeout with an unresolved provider; real timeout scheduling can vary, and claim persistence, cancellation acknowledgement and host recovery belong elsewhere.
 * @evidence contracts/testing.md#execution-ownership The named discoverable async unit invokes the portable scheduler with injected clock/wait/provider/observer callbacks and its real timeout, without installing a provider, native encoder or browser; the unresolved promise has no external work or event-loop handle of its own.
 *
 * Scenarios:
 *
 * 1. A retryable failure is awaited by the durable observer before backoff and
 *    the next provider call, and observer refusal blocks that call.
 * 2. A timeout whose adapter ignores abort records an unknown outcome and never
 *    starts another provider call.
 */
export async function test_production_repaint_attempt_durability(): Promise<void> {
    const events: string[] = [];
    let calls: number = 0;
    const result: Awaited<ReturnType<typeof executeAutoMovieRepaintRequest>> = await executeAutoMovieRepaintRequest({
      productionId: "film",
      shot: "opening",
      requestId: "10000000-0000-4000-8000-000000000001",
      requestFingerprint: digest,
      compileFingerprint: digest,
      sourceRenderFingerprint: digest,
      adapterIdentity: JSON.stringify({
        execution: "local",
        model: "model",
        protocolVersion: "automovie.repaint-runtime.v1",
        provider: "provider",
        version: "revision",
      }),
      seed: 1,
      policy: {
        maximumAttempts: 2,
        attemptTimeoutMs: 100,
        maximumElapsedMs: 1_000,
        maximumCostUnits: 10,
        backoffMs: [0],
        retryableFailures: ["rate-limit"],
      },
      runtime: {
        now: (): Date => new Date("2026-09-04T00:00:00.000Z"),
        attemptId: (): string =>
          `20000000-0000-4000-8000-${String(calls + 1).padStart(12, "0")}`,
        wait: async (): Promise<void> => {
          events.push("backoff");
        },
      },
      execute: async (): Promise<{ value: string; costUnits: number; availableOutput: { digest: string; bytes: number } }> => {
        events.push(`provider-${++calls}`);
        if (calls === 1)
          throw new AutoMovieRepaintAttemptError("rate-limit", "retry later");
        return {
          value: "accepted",
          costUnits: 1,
          availableOutput: { digest, bytes: 4 },
        };
      },
      onAttempt: async (attempt: Parameters<Parameters<typeof executeAutoMovieRepaintRequest>[0]["onAttempt"]>[0]): Promise<void> => {
        await Promise.resolve();
        events.push(`persist-${attempt.ordinal}`);
      },
    });
    let blockedCalls: number = 0;
    const blocked: Awaited<ReturnType<typeof executeAutoMovieRepaintRequest>> = await executeAutoMovieRepaintRequest({
      productionId: "film",
      shot: "opening",
      requestId: "10000000-0000-4000-8000-000000000002",
      requestFingerprint: digest,
      compileFingerprint: digest,
      sourceRenderFingerprint: digest,
      adapterIdentity: JSON.stringify({
        execution: "local",
        model: "model",
        protocolVersion: "automovie.repaint-runtime.v1",
        provider: "provider",
        version: "revision",
      }),
      seed: 1,
      policy: {
        maximumAttempts: 2,
        attemptTimeoutMs: 100,
        maximumElapsedMs: 1_000,
        maximumCostUnits: 10,
        backoffMs: [0],
        retryableFailures: ["rate-limit"],
      },
      runtime: {
        now: (): Date => new Date("2026-09-04T00:00:00.000Z"),
        attemptId: (): string =>
          `30000000-0000-4000-8000-${String(blockedCalls + 1).padStart(12, "0")}`,
        wait: async (): Promise<void> => undefined,
      },
      execute: async (): Promise<never> => {
        ++blockedCalls;
        throw new AutoMovieRepaintAttemptError("rate-limit", "retry later");
      },
      onAttempt: async (): Promise<void> => {
        throw new Error("journal refused");
      },
    });
    let unknownCalls: number = 0;
    const unknown: Awaited<ReturnType<typeof executeAutoMovieRepaintRequest>> = await executeAutoMovieRepaintRequest({
      productionId: "film",
      shot: "opening",
      requestId: "10000000-0000-4000-8000-000000000003",
      requestFingerprint: digest,
      compileFingerprint: digest,
      sourceRenderFingerprint: digest,
      adapterIdentity: JSON.stringify({
        execution: "local",
        model: "model",
        protocolVersion: "automovie.repaint-runtime.v1",
        provider: "provider",
        version: "revision",
      }),
      seed: 1,
      policy: {
        maximumAttempts: 2,
        attemptTimeoutMs: 1,
        maximumElapsedMs: 100,
        maximumCostUnits: 10,
        backoffMs: [0],
        retryableFailures: ["timeout"],
      },
      runtime: {
        now: (): Date => new Date("2026-09-04T00:00:00.000Z"),
        attemptId: (): string => "40000000-0000-4000-8000-000000000001",
        wait: async (): Promise<void> => undefined,
      },
      execute: async (): Promise<never> => {
        ++unknownCalls;
        return new Promise<never>((): void => {
          // Deliberately ignore abort to model an unknown external outcome.
        });
      },
      onAttempt: (): void => undefined,
    });
    TestValidator.equals(
      "durability and unknown-outcome boundaries precede every retry side effect",
      {
        stop: result.stop,
        events,
        blocked: { stop: blocked.stop, calls: blockedCalls },
        unknown: {
          stop: unknown.stop,
          calls: unknownCalls,
          retryable: unknown.attempts[0]?.failure?.retryable,
        },
      },
      {
        stop: "accepted",
        events: [
          "provider-1",
          "persist-1",
          "backoff",
          "provider-2",
          "persist-2",
        ],
        blocked: { stop: "observer-failed", calls: 1 },
        unknown: { stop: "outcome-unknown", calls: 1, retryable: false },
      },
    );
}
