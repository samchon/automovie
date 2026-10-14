import { AutoMovieRepaintAttemptError } from "./AutoMovieRepaintAttemptError";
import { AutoMovieRepaintClaimRefusal } from "./AutoMovieRepaintClaimRefusal";
import { AutoMovieRepaintClockError } from "./AutoMovieRepaintClockError";
import { IAutoMovieProductionRepaintClassifiedFailure } from "./IAutoMovieProductionRepaintClassifiedFailure";
import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { IAutoMovieRepaintAttemptRecord } from "./IAutoMovieRepaintAttemptRecord";
import { IAutoMovieRepaintExecutionInput } from "./IAutoMovieRepaintExecutionInput";
import { IAutoMovieRepaintExecutionResult } from "./IAutoMovieRepaintExecutionResult";
import { assertAutoMovieRepaintExecutionPolicy } from "./assertAutoMovieRepaintExecutionPolicy";
import { repaintExecutionAssertRepaintExecutionIdentity } from "./repaintExecutionAssertRepaintExecutionIdentity";
import { repaintExecutionClassifyFailure } from "./repaintExecutionClassifyFailure";
import { repaintExecutionNEVER_ABORTED_SIGNAL } from "./repaintExecutionNEVER_ABORTED_SIGNAL";
import { repaintExecutionNonBlank } from "./repaintExecutionNonBlank";
import { repaintExecutionRepaintAttemptErrorDisclosure } from "./repaintExecutionRepaintAttemptErrorDisclosure";
import { repaintExecutionRepaintAttemptErrorOrNull } from "./repaintExecutionRepaintAttemptErrorOrNull";
import { repaintExecutionRepaintClockErrorOrNull } from "./repaintExecutionRepaintClockErrorOrNull";
import { repaintExecutionResult } from "./repaintExecutionResult";
import { repaintExecutionSafeUnknownMessage } from "./repaintExecutionSafeUnknownMessage";
import { repaintExecutionTerminalAttempt } from "./repaintExecutionTerminalAttempt";
import { repaintExecutionValidAdmission } from "./repaintExecutionValidAdmission";
import { repaintExecutionValidAttemptOutput } from "./repaintExecutionValidAttemptOutput";
import { repaintExecutionValidCost } from "./repaintExecutionValidCost";
import { repaintExecutionValidInstant } from "./repaintExecutionValidInstant";
import { AutoMovieRepaintClaimAdmission } from "./repaintAttemptClaim";
import { AutoMovieRepaintFailureClass, AutoMovieRepaintRetryableFailureClass } from "@automovie/interface";

/**
 * Validates policy/identity, observes a monotonic clock, admits each claim before dispatch, relays cancellation and races provider completion with timeout, appends one terminal fact and awaits its observer before any retry/backoff.
 *
 * @evidence contracts/common.md#principled-implementation Validates policy/identity, observes a monotonic clock, admits each claim before dispatch, relays cancellation and races provider completion with timeout, appends one terminal fact and awaits its observer before any retry/backoff.
 * @evidence contracts/common.md#clear-and-simple-design The executor owns scheduling, metering, claims and terminal ordering, while execute validates its domain payload and onAttempt owns durable observation; this file retains the original complete control flow.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Finally clears each host timer and removes the cancellation relay after that attempt's awaited callbacks finish; the elapsed policy cannot bound pending admission, observer or injected wait callbacks, and cannot force an abort-ignoring provider to settle, so unknown external outcomes stop without retry. Cancellation during async claim admission can still invoke execute with an already-aborted signal; the callback must honor that cooperative boundary.
 * @evidence contracts/performance.md#efficient-algorithms Work scales with attempted dispatches, callback work and cloned terminal metadata; deterministic wait is checked against the clock, and the generic payload is validated by the execute callback rather than this scheduler.
 * @evidence contracts/performance.md#reuse-equivalent-work Validates policy/identity, observes a monotonic clock, admits each claim before dispatch, relays cancellation and races provider completion with timeout, appends one terminal fact and awaits its observer before any retry/backoff. Work scales with attempted dispatches, callback work and cloned terminal metadata; deterministic wait is checked against the clock, and the generic payload is validated by the execute callback rather than this scheduler.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finally clears each host timer and removes the cancellation relay after that attempt's awaited callbacks finish; the elapsed policy cannot bound pending admission, observer or injected wait callbacks, and cannot force an abort-ignoring provider to settle, so unknown external outcomes stop without retry.
 */
export const executeAutoMovieRepaintRequest: <T>(props: IAutoMovieRepaintExecutionInput<T>) => Promise<IAutoMovieRepaintExecutionResult<T>> = async <T>(props: IAutoMovieRepaintExecutionInput<T>): Promise<IAutoMovieRepaintExecutionResult<T>> => {
  assertAutoMovieRepaintExecutionPolicy(props.policy);
  repaintExecutionAssertRepaintExecutionIdentity(props);
  const started: Date = repaintExecutionValidInstant(props.runtime.now(), "request start");
  let lastObservedAt: number = started.getTime();
  const observeNow: (label: string) => Date = (label: string): Date => {
    let current: Date;
    try {
      current = repaintExecutionValidInstant(props.runtime.now(), label);
    } catch (error) {
      throw new AutoMovieRepaintClockError(
        repaintExecutionSafeUnknownMessage(
          error,
          `Repaint ${label} clock observation failed without an inspectable message.`,
        ),
      );
    }
    if (current.getTime() < lastObservedAt)
      throw new AutoMovieRepaintClockError(
        `Repaint ${label} precedes the previous runtime clock observation.`,
      );
    lastObservedAt = current.getTime();
    return current;
  };
  const attempts: IAutoMovieRepaintAttemptRecord[] = [];
  const notifyAttempt: (attempt: IAutoMovieRepaintAttemptRecord, externalOutcome?: "settled" | "unknown") => Promise<boolean> = async (
    attempt: IAutoMovieRepaintAttemptRecord,
    externalOutcome: "settled" | "unknown" = "settled",
  ): Promise<boolean> => {
    try {
      await props.onAttempt(structuredClone(attempt), { externalOutcome });
      return true;
    } catch {
      return false;
    }
  };
  let spent: number = 0;
  let nextAttemptNotBefore: number = started.getTime();
  const ordinalOffset: number = props.ordinalOffset ?? 0;
  const requestCancelled: () => boolean = (): boolean => props.signal?.aborted === true;
  for (let local: number = 1; local <= props.policy.maximumAttempts; local++) {
    const ordinal: number = ordinalOffset + local;
    if (requestCancelled())
      return repaintExecutionResult(props.requestId, attempts, null, "cancelled");
    let elapsedAt: Date;
    try {
      elapsedAt = observeNow("request elapsed");
    } catch (error) {
      if (attempts.length === 0) throw error;
      return repaintExecutionResult(props.requestId, attempts, null, "backoff-failed");
    }
    if (elapsedAt.getTime() < nextAttemptNotBefore)
      return repaintExecutionResult(props.requestId, attempts, null, "backoff-failed");
    const elapsed: number = elapsedAt.getTime() - started.getTime();
    if (elapsed >= props.policy.maximumElapsedMs)
      return repaintExecutionResult(props.requestId, attempts, null, "elapsed-exhausted");
    if (spent >= props.policy.maximumCostUnits)
      return repaintExecutionResult(props.requestId, attempts, null, "cost-exhausted");

    let attemptStarted: Date;
    try {
      attemptStarted = observeNow("attempt start");
    } catch (error) {
      if (attempts.length === 0) throw error;
      return repaintExecutionResult(props.requestId, attempts, null, "backoff-failed");
    }
    if (
      attemptStarted.getTime() - started.getTime() >=
      props.policy.maximumElapsedMs
    )
      return repaintExecutionResult(props.requestId, attempts, null, "elapsed-exhausted");
    const controller: AbortController = new AbortController();
    const relay: () => void = (): void => controller.abort(props.signal?.reason);
    props.signal?.addEventListener("abort", relay, { once: true });
    if (requestCancelled()) {
      props.signal?.removeEventListener("abort", relay);
      return repaintExecutionResult(props.requestId, attempts, null, "cancelled");
    }
    let attemptId: string;
    try {
      attemptId = repaintExecutionNonBlank(props.runtime.attemptId(), "attempt id");
    } catch (error) {
      props.signal?.removeEventListener("abort", relay);
      throw error;
    }
    if (props.admitAttempt !== undefined) {
      let admission:
        | AutoMovieRepaintClaimAdmission
        | AutoMovieRepaintClaimRefusal;
      try {
        admission = repaintExecutionValidAdmission(
          await props.admitAttempt(attemptId, ordinal),
        );
      } catch (error) {
        admission = {
          status: "admission-failed",
          message: repaintExecutionSafeUnknownMessage(
            error,
            "Repaint attempt claim admission failed without a safe diagnostic.",
          ),
        };
      }
      if (admission.status !== "acquired") {
        props.signal?.removeEventListener("abort", relay);
        return repaintExecutionResult(
          props.requestId,
          attempts,
          null,
          "claim-refused",
          admission,
        );
      }
    }
    const remainingElapsed: number = Math.max(
      1,
      props.policy.maximumElapsedMs -
        (attemptStarted.getTime() - started.getTime()),
    );
    const timeoutMs: number = Math.min(props.policy.attemptTimeoutMs, remainingElapsed);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let timedOut: boolean = false;
    let adapterSettled: boolean = false;
    let disclosedCostUnits: number = 0;
    let disclosedOutput: IAutoMovieRepaintAttemptOutput | null = null;
    try {
      const adapter: Promise<{ value: T; costUnits: number; availableOutput: IAutoMovieRepaintAttemptOutput | null; }> = props.execute(controller.signal, attemptId);
      void adapter
        .then((): void => {
          adapterSettled = true;
        })
        .catch((): void => {
          adapterSettled = true;
        });
      const outcome: { value: T; costUnits: number; availableOutput: IAutoMovieRepaintAttemptOutput | null; } = await Promise.race([
        adapter,
        new Promise<never>((resolve: (value: PromiseLike<never>) => void, reject: (reason?: unknown) => void): void => {
          void resolve;
          timeout = setTimeout((): void => {
            timedOut = true;
            controller.abort("timeout");
            reject(
              new AutoMovieRepaintAttemptError(
                "timeout",
                `Repaint attempt exceeded ${timeoutMs}ms.`,
              ),
            );
          }, timeoutMs);
        }),
      ]);
      try {
        disclosedCostUnits = repaintExecutionValidCost(outcome.costUnits);
      } catch (error) {
        throw new AutoMovieRepaintAttemptError(
          "invalid-output",
          repaintExecutionSafeUnknownMessage(
            error,
            "Repaint adapter returned an unreadable cost disclosure.",
          ),
        );
      }
      try {
        disclosedOutput = repaintExecutionValidAttemptOutput(outcome.availableOutput);
      } catch (error) {
        throw new AutoMovieRepaintAttemptError(
          "invalid-output",
          repaintExecutionSafeUnknownMessage(
            error,
            "Repaint adapter returned an unreadable output disclosure.",
          ),
          disclosedCostUnits,
        );
      }
      let value: T;
      try {
        value = outcome.value;
      } catch {
        throw new AutoMovieRepaintAttemptError(
          "invalid-output",
          "Repaint adapter output value could not be inspected safely.",
          disclosedCostUnits,
          disclosedOutput,
        );
      }
      const outcomeCompleted: Date = observeNow("attempt completion");
      if (requestCancelled())
        throw new AutoMovieRepaintAttemptError(
          "cancelled",
          "Repaint request was cancelled.",
          disclosedCostUnits,
          disclosedOutput,
        );
      if (
        timedOut ||
        outcomeCompleted.getTime() - attemptStarted.getTime() >= timeoutMs ||
        outcomeCompleted.getTime() - started.getTime() >=
          props.policy.maximumElapsedMs
      )
        throw new AutoMovieRepaintAttemptError(
          "timeout",
          `Repaint attempt exceeded ${timeoutMs}ms.`,
          disclosedCostUnits,
          disclosedOutput,
        );
      if (disclosedOutput === null)
        throw new AutoMovieRepaintAttemptError(
          "invalid-output",
          "Repaint adapter accepted an output without a positive byte count and canonical digest.",
          disclosedCostUnits,
        );
      spent += disclosedCostUnits;
      if (spent > props.policy.maximumCostUnits) {
        const attempt: IAutoMovieRepaintAttemptRecord = repaintExecutionTerminalAttempt({
          productionId: props.productionId,
          shot: props.shot,
          requestId: props.requestId,
          requestFingerprint: props.requestFingerprint,
          attemptId,
          ordinal,
          compileFingerprint: props.compileFingerprint,
          sourceRenderFingerprint: props.sourceRenderFingerprint,
          adapterIdentity: props.adapterIdentity,
          seed: props.seed,
          startedAt: attemptStarted,
          completedAt: outcomeCompleted,
          status: "failed",
          failure: {
            class: "budget-exhausted",
            message: "Repaint attempt exceeded the request cost ceiling.",
            retryable: false,
          },
          costUnits: disclosedCostUnits,
          availableOutput: disclosedOutput,
        });
        attempts.push(attempt);
        if ((await notifyAttempt(attempt)) === false)
          return repaintExecutionResult(props.requestId, attempts, null, "observer-failed");
        return repaintExecutionResult(props.requestId, attempts, null, "cost-exhausted");
      }
      const attempt: IAutoMovieRepaintAttemptRecord = repaintExecutionTerminalAttempt({
        productionId: props.productionId,
        shot: props.shot,
        requestId: props.requestId,
        requestFingerprint: props.requestFingerprint,
        attemptId,
        ordinal,
        compileFingerprint: props.compileFingerprint,
        sourceRenderFingerprint: props.sourceRenderFingerprint,
        adapterIdentity: props.adapterIdentity,
        seed: props.seed,
        startedAt: attemptStarted,
        completedAt: outcomeCompleted,
        status: "succeeded",
        failure: null,
        costUnits: disclosedCostUnits,
        availableOutput: disclosedOutput,
      });
      attempts.push(attempt);
      if ((await notifyAttempt(attempt)) === false)
        return repaintExecutionResult(props.requestId, attempts, null, "observer-failed");
      return repaintExecutionResult(props.requestId, attempts, { value, attempt }, "accepted");
    } catch (error) {
      let terminalError: unknown = error;
      let terminalClockError: AutoMovieRepaintClockError | null = repaintExecutionRepaintClockErrorOrNull(error);
      let clockFailed: boolean = terminalClockError !== null;
      let failureCompleted: Date;
      if (clockFailed) failureCompleted = new Date(lastObservedAt);
      else
        try {
          failureCompleted = observeNow("attempt completion");
        } catch (clockError) {
          terminalError = clockError;
          terminalClockError = repaintExecutionRepaintClockErrorOrNull(clockError);
          clockFailed = true;
          failureCompleted = new Date(lastObservedAt);
        }
      const deadlineExceeded: boolean =
        clockFailed === false &&
        (timedOut ||
          failureCompleted.getTime() - attemptStarted.getTime() >= timeoutMs ||
          failureCompleted.getTime() - started.getTime() >=
            props.policy.maximumElapsedMs);
      const timeoutDisclosure: AutoMovieRepaintAttemptError | null = repaintExecutionRepaintAttemptErrorOrNull(terminalError);
      const safeTimeoutDisclosure: { valid: boolean; failureClass: AutoMovieRepaintFailureClass | null; message: string; costUnits: number; availableOutput: IAutoMovieRepaintAttemptOutput | null; } | null =
        timeoutDisclosure === null
          ? null
          : repaintExecutionRepaintAttemptErrorDisclosure(timeoutDisclosure);
      const externalOutcomeUnknown: boolean = timedOut && adapterSettled === false;
      const classified: IAutoMovieProductionRepaintClassifiedFailure = externalOutcomeUnknown
        ? ({
            failureClass: "internal",
            status: "failed",
            message:
              "Repaint adapter did not acknowledge cancellation; external outcome requires reconciliation before retry.",
            costUnits: disclosedCostUnits,
            availableOutput: disclosedOutput,
          } satisfies IAutoMovieProductionRepaintClassifiedFailure)
        : clockFailed
          ? requestCancelled()
            ? ({
                failureClass: "cancelled",
                status: "cancelled",
                message: "Repaint request was cancelled.",
                costUnits: disclosedCostUnits,
                availableOutput: disclosedOutput,
              } satisfies IAutoMovieProductionRepaintClassifiedFailure)
            : ({
                failureClass: "internal",
                status: "failed",
                message: terminalClockError!.message,
                costUnits: disclosedCostUnits,
                availableOutput: disclosedOutput,
              } satisfies IAutoMovieProductionRepaintClassifiedFailure)
          : repaintExecutionClassifyFailure(
              deadlineExceeded &&
                safeTimeoutDisclosure?.failureClass !== "timeout"
                ? new AutoMovieRepaintAttemptError(
                    "timeout",
                    `Repaint attempt exceeded ${timeoutMs}ms.`,
                    safeTimeoutDisclosure?.costUnits ?? 0,
                    safeTimeoutDisclosure?.availableOutput ?? null,
                  )
                : terminalError,
              props.signal,
            );
      spent += classified.costUnits;
      const retryable: boolean =
        externalOutcomeUnknown === false &&
        clockFailed === false &&
        classified.status === "failed" &&
        props.policy.retryableFailures.some(
          (failureClass: AutoMovieRepaintRetryableFailureClass): boolean => failureClass === classified.failureClass,
        );
      const attempt: IAutoMovieRepaintAttemptRecord = repaintExecutionTerminalAttempt({
        productionId: props.productionId,
        shot: props.shot,
        requestId: props.requestId,
        requestFingerprint: props.requestFingerprint,
        attemptId,
        ordinal,
        compileFingerprint: props.compileFingerprint,
        sourceRenderFingerprint: props.sourceRenderFingerprint,
        adapterIdentity: props.adapterIdentity,
        seed: props.seed,
        startedAt: attemptStarted,
        completedAt: failureCompleted,
        status: classified.status,
        failure: {
          class: classified.failureClass,
          message: classified.message,
          retryable,
        },
        costUnits: classified.costUnits,
        availableOutput: classified.availableOutput,
      });
      attempts.push(attempt);
      if (
        (await notifyAttempt(
          attempt,
          externalOutcomeUnknown ? "unknown" : "settled",
        )) === false
      )
        return repaintExecutionResult(props.requestId, attempts, null, "observer-failed");
      if (externalOutcomeUnknown)
        return repaintExecutionResult(props.requestId, attempts, null, "outcome-unknown");
      if (classified.status === "cancelled")
        return repaintExecutionResult(props.requestId, attempts, null, "cancelled");
      if (retryable === false)
        return repaintExecutionResult(props.requestId, attempts, null, "not-retryable");
      if (local === props.policy.maximumAttempts)
        return repaintExecutionResult(props.requestId, attempts, null, "attempts-exhausted");
      if (spent >= props.policy.maximumCostUnits)
        return repaintExecutionResult(props.requestId, attempts, null, "cost-exhausted");
      const afterAttempt: number = failureCompleted.getTime() - started.getTime();
      const backoff: number = props.policy.backoffMs[local - 1]!;
      if (afterAttempt + backoff >= props.policy.maximumElapsedMs)
        return repaintExecutionResult(props.requestId, attempts, null, "elapsed-exhausted");
      nextAttemptNotBefore = failureCompleted.getTime() + backoff;
      try {
        await props.runtime.wait(backoff, props.signal ?? repaintExecutionNEVER_ABORTED_SIGNAL);
      } catch {
        return repaintExecutionResult(
          props.requestId,
          attempts,
          null,
          requestCancelled() ? "cancelled" : "backoff-failed",
        );
      }
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
      props.signal?.removeEventListener("abort", relay);
    }
  }
  return repaintExecutionResult(props.requestId, attempts, null, "attempts-exhausted");
};
