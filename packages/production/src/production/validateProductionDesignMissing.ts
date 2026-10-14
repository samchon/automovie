import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { IAutoMovieDiagnostic } from "@automovie/interface";

/**
 * Append one design-reference-missing diagnostic using the original dependency and correction text.
 *
 * @evidence contracts/common.md#principled-implementation Formats the supplied dependency and correction into one design-reference-missing record through the shared sink. Existence decisions remain with graph membership callers; this helper performs no lookup or filesystem observation.
 * @evidence contracts/common.md#clear-and-simple-design One correction formatter supplies common missing-reference prose while the diagnostic sink owns category/phase and each field gate owns dependency resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The supplied missing dependency is reported without inventing a replacement record or suppressing repeated findings; this formatter supplies no existence verdict of its own.
 * @evidence contracts/common.md#meaningful-documentation Defines target/file attribution and dependency/correction interpolation; the void call appends one finding without creating a missing record or changing existing diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms Fixed interpolation and diagnostic append scale only with message text.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared sink appends into the existing caller array; each actual missing-reference observation receives its own correction without a cached lookup verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One constructed dependency/correction message and its finding remain in the caller-owned array; no graph record, filesystem handle or task is acquired or retained independently.
 */
export const validateProductionDesignMissing: (diagnostics: IAutoMovieDiagnostic[], target: string, file: string, dependency: string, correction: string) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  target: string,
  file: string,
  dependency: string,
  correction: string,
): void =>
  validateProductionDesignInvalid(
    diagnostics,
    "design-reference-missing",
    target,
    file,
    `Referenced ${dependency} does not exist. ${correction}.`,
  );
