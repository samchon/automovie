import { AutoMovieDiagnosticCode, IAutoMovieDiagnostic } from "@automovie/interface";
import { FILM_SOURCE_PATH } from "./FILM_SOURCE_PATH";

/**
 * Construct a compile-phase film error tied to the fixed authored film source path; the calling builder owns its collection and later severity adjustments.
 *
 * @evidence contracts/common.md#principled-implementation A literal diagnostic shape combines the supplied code and message with error category, compile phase, film target, and the shared FILM_SOURCE_PATH protocol value.
 * @evidence contracts/common.md#clear-and-simple-design All film assembly helpers use this one record constructor so their refusals point to the same authored module without repeating source-path logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed target and path are the actual film build protocol. No test-specific branch, alternate source, or automatic recovery changes the diagnostic.
 * @evidence contracts/common.md#meaningful-documentation The comment gives category, phase, target path, and caller ownership, including that severity changes such as source-scope runtime warnings occur at the calling assembly branch.
 * @evidence contracts/performance.md#efficient-algorithms One record is allocated with a constant number of scalar assignments; message text is retained by reference without an additional scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call returns a distinct mutable diagnostic because its code and message identify a separate refusal. The immutable source path is shared through its canonical module.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record transfers to the caller's diagnostic array. The helper retains no population, handles, byte buffers, or running tasks.
 */
export const filmDiagnostic: (code: AutoMovieDiagnosticCode, message: string) => IAutoMovieDiagnostic = (
  code: AutoMovieDiagnosticCode,
  message: string,
): IAutoMovieDiagnostic => ({
  code,
  category: "error",
  phase: "compile",
  target: "film",
  path: FILM_SOURCE_PATH,
  message,
});
