import { AutoMovieRepaintAttemptError } from "./AutoMovieRepaintAttemptError";
import { IAutoMovieProductionRepaintClassifiedFailure } from "./IAutoMovieProductionRepaintClassifiedFailure";
import { IAutoMovieRepaintAttemptOutput } from "./IAutoMovieRepaintAttemptOutput";
import { repaintExecutionRepaintAttemptErrorDisclosure } from "./repaintExecutionRepaintAttemptErrorDisclosure";
import { repaintExecutionRepaintAttemptErrorOrNull } from "./repaintExecutionRepaintAttemptErrorOrNull";
import { repaintExecutionRepaintFailureMessage } from "./repaintExecutionRepaintFailureMessage";
import { AutoMovieRepaintFailureClass } from "@automovie/interface";

/**
 * Lets cancellation dominate, validates typed refusal cost/output, otherwise uses the existing HTTP429 and FetchError/connection-code heuristics before provider-refusal fallback.
 *
 * @evidence contracts/common.md#principled-implementation Lets cancellation dominate, validates typed refusal cost/output, otherwise uses the existing HTTP429 and FetchError/connection-code heuristics before provider-refusal fallback.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns cancellation precedence, typed disclosure and external protocol heuristics; the outer guard contains unsafe inspection and the executor decides retryability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts HTTP429 and FetchError/connection-code cases come from the existing provider protocol heuristics; their incompleteness is retained rather than presented as an exhaustive provider taxonomy.
 * @evidence contracts/common.md#meaningful-documentation The returned cost/output metadata references no provider byte buffer; unsafe getters are contained by the outer classifier.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of field/Set checks plus message/output text validation classifies the current protocol; hostile getters/stringification can run caller code and the heuristics are not an exhaustive provider taxonomy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned cost/output metadata references no provider byte buffer; unsafe getters are contained by the outer classifier.
 */
export const repaintExecutionClassifyFailureDisclosure: (error: unknown, outerSignal: AbortSignal | undefined) => IAutoMovieProductionRepaintClassifiedFailure = (
  error: unknown,
  outerSignal: AbortSignal | undefined,
): IAutoMovieProductionRepaintClassifiedFailure => {
  const attemptError: AutoMovieRepaintAttemptError | null = repaintExecutionRepaintAttemptErrorOrNull(error);
  const disclosure: { valid: boolean; failureClass: AutoMovieRepaintFailureClass | null; message: string; costUnits: number; availableOutput: IAutoMovieRepaintAttemptOutput | null; } | null =
    attemptError === null ? null : repaintExecutionRepaintAttemptErrorDisclosure(attemptError);
  if (outerSignal?.aborted === true) {
    return {
      failureClass: "cancelled",
      status: "cancelled",
      message: "Repaint request was cancelled.",
      costUnits: disclosure?.costUnits ?? 0,
      availableOutput: disclosure?.availableOutput ?? null,
    };
  }
  if (attemptError !== null) {
    if (disclosure?.valid === false)
      return {
        failureClass: "invalid-output",
        status: "invalid",
        message:
          "Repaint adapter returned a malformed failure class, cost, message, or available-output disclosure.",
        costUnits: disclosure.costUnits,
        availableOutput: disclosure.availableOutput,
      };
    const failureClass: AutoMovieRepaintFailureClass = disclosure!.failureClass!;
    return {
      failureClass,
      status:
        failureClass === "cancelled"
          ? "cancelled"
          : failureClass === "invalid-output"
            ? "invalid"
            : failureClass === "input-stale"
              ? "stale"
              : "failed",
      message: repaintExecutionRepaintFailureMessage(disclosure!.message),
      costUnits: disclosure!.costUnits,
      availableOutput: disclosure!.availableOutput,
    };
  }
  const candidate: { status?: unknown; code?: unknown; name?: unknown; message?: unknown; costUnits?: unknown; } = error as {
    status?: unknown;
    code?: unknown;
    name?: unknown;
    message?: unknown;
    costUnits?: unknown;
  };
  const rateLimited: boolean = candidate.status === 429 || candidate.code === 429;
  const transported: boolean =
    candidate.name === "FetchError" ||
    candidate.code === "ECONNRESET" ||
    candidate.code === "ETIMEDOUT";
  return {
    failureClass: rateLimited
      ? "rate-limit"
      : transported
        ? "transport"
        : "provider-refusal",
    status: "failed",
    message: repaintExecutionRepaintFailureMessage(
      error instanceof Error
        ? error.message
        : typeof candidate.message === "string"
          ? candidate.message
          : String(error),
    ),
    costUnits:
      typeof candidate.costUnits === "number" &&
      Number.isFinite(candidate.costUnits) &&
      candidate.costUnits >= 0
        ? candidate.costUnits
        : 0,
    availableOutput: null,
  };
};
