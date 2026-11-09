import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Create one compile error for a named shot field and expectation.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The fixed diagnostic code/category/phase and shot target preserve the compile refusal vocabulary, embedding supplied field and expectation in the correction message.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This adapter constructs reporting data only; the caller's engine validation supplies the actual failed predicate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No field is reread or repaired and the null path does not pretend to be an independently parsed JSON address; authored identity remains in the target string.
 * @evidence contracts/development/common.md#meaningful-documentation Documents shot id, text field address, expected correction, fixed compile-error shape and fresh result ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms One result object and strings cost their combined lengths, independent of shot geometry or clip population.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers reuse the same diagnostic vocabulary without another gate or cached failure record.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fresh scalar strings and fixed fields transfer to the caller; no shot, source input object, playback task or renderer is retained.
 */
export const engineDiagnostic: (
  id: string,
  field: string,
  expectation: string,
) => IAutoMovieDiagnostic = (
  id: string,
  field: string,
  expectation: string,
): IAutoMovieDiagnostic => ({
  code: "engine-validation-failed",
  category: "error",
  phase: "compile",
  target: `shot:${id}`,
  path: null,
  message: `${field} ${expectation}. Correct the owning shot source before running the builder.`,
});
