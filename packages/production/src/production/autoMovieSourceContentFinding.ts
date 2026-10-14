import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import type { IAutoMovieSourceContentFinding } from "./IAutoMovieSourceContentFinding";

/**
 * Carry one engine violation with the source fold's attributed message.
 *
 * @evidence contracts/common.md#principled-implementation Copies kind and severity unchanged and uses the supplied message; production source folds compose addresses because only they know how filtered validator positions map to authored program records.
 * @evidence contracts/common.md#clear-and-simple-design Projects three finding fields without validating the domain again or choosing a diagnostic identity; autoMovieSourceContentDiagnostic owns that next step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither a successful validation nor a particular target suppresses warnings, and no override upgrades advice to error.
 * @evidence contracts/common.md#meaningful-documentation States the engine classification and caller-attribution boundary; validator path and raw message are not copied as separate fields.
 * @evidence contracts/performance.md#efficient-algorithms Three field assignments allocate one constant-size carrier without traversing or copying the message string.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One occurrence projection has no substantial repeated computation; caching would retain mutable violation and attribution inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives the new finding; this synchronous helper retains no violation, array, task or handle.
 */
export function autoMovieSourceContentFinding(
  violation: IAutoMovieConstraintViolation,
  message: string,
): IAutoMovieSourceContentFinding {
  return { kind: violation.kind, severity: violation.severity, message };
}
