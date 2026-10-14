import {
  IAutoMovieDiagnostic,
  IAutoMovieValidation,
} from "@automovie/interface";

/**
 * Append failed engine validation findings as compile diagnostics for one shot.
 *
 * @evidence contracts/common.md#principled-implementation Only success=false findings are traversed and each becomes engine-validation-failed with shot identity and the original violation path/message inside its text.
 * @evidence contracts/common.md#clear-and-simple-design The compile adapter owns diagnostic addressing while canonical validators retain numerical and structural decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warning-only successful envelopes are deliberately ignored by this existing adapter; mixed failure findings become category=error regardless of their own severity, so this is not a severity-preserving general validation bridge.
 * @evidence contracts/common.md#meaningful-documentation Documents insertion order, shot target, null diagnostic path and text-embedded owning source address, including success-envelope limits.
 * @evidence contracts/performance.md#efficient-algorithms For F failed findings and their message lengths, traversal and diagnostic allocation are linear; successful validation takes constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing validation output is consumed once without rerunning a model gate or constructing another validation result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller's diagnostic array retains newly allocated rows and strings; no offending input record, model, renderer or validation task is retained by this adapter.
 * @author Samchon
 */
export const appendValidation: (
  diagnostics: IAutoMovieDiagnostic[],
  id: string,
  validation: IAutoMovieValidation,
) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  id: string,
  validation: IAutoMovieValidation,
): void => {
  if (validation.success === false)
    for (const violation of validation.violations)
      diagnostics.push({
        code: "engine-validation-failed",
        category: "error",
        phase: "compile",
        target: `shot:${id}`,
        path: null,
        message: `${violation.path}: ${violation.expected}. Correct the owning shot source before running the builder.`,
      });
};
