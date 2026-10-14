import { productionRepaintServiceSafeRepaintDiagnosticMessage } from "./productionRepaintServiceSafeRepaintDiagnosticMessage";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";

/**
 * Guardedly recognizes the project input-race Error and returns its message, otherwise null including hostile instanceof inspection.
 *
 * @evidence contracts/common.md#principled-implementation Guardedly recognizes the project input-race Error and returns its message, otherwise null including hostile instanceof inspection.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Only optional text escapes; project mutation resources are owned by their transaction.
 * @evidence contracts/performance.md#efficient-algorithms One guarded prototype check and safe message conversion preserve input-stale classification; trimming/stringification cost follows message text and hostile user code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only optional text escapes; project mutation resources are owned by their transaction.
 */
export const productionRepaintServiceSafeRepaintInputRaceMessage: (error: unknown) => string | null = (error: unknown): string | null => {
  try {
    return error instanceof AutoMovieProductionInputRaceError
      ? productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint input changed without a safe diagnostic.",
        )
      : null;
  } catch {
    return null;
  }
};
