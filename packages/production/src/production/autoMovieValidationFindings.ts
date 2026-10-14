import type { IAutoMovieConstraintViolation, IAutoMovieValidation } from "@automovie/interface";

/**
 * Read all findings from either branch of a typed validation result.
 *
 * @evidence contracts/common.md#principled-implementation Reads violations from failure and optional warnings from success; source-domain callers must retain advice even when no error invalidates their scope.
 * @evidence contracts/common.md#clear-and-simple-design Centralizes the result-union branch choice while callers own domain-specific attribution and diagnostic collection; the existing array is returned unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful result does not discard its warning array and a failure does not recategorize its entries; omitted success warnings mean no findings.
 * @evidence contracts/common.md#meaningful-documentation States both branches and optional warning absence; the readonly return view does not freeze the validation's mutable array.
 * @evidence contracts/performance.md#efficient-algorithms One discriminant check returns an existing array or an empty array, taking constant time and space regardless of finding count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Selecting the union branch has no substantial repeated work; it already shares the validation's existing array without copying it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No result is retained after return; the caller and original validation own the shared array, and absent warnings allocate only an empty local result.
 */
export function autoMovieValidationFindings(validation: IAutoMovieValidation): readonly IAutoMovieConstraintViolation[] {
  return validation.success ? (validation.warnings ?? []) : validation.violations;
}
