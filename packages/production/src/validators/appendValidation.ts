import type { IAutoMovieConstraintViolation, IAutoMovieValidation } from "@automovie/interface";

/**
 * Append all findings from either validation outcome without changing severity.
 *
 * Successful validation can still carry warnings. A parent gate must retain that advice alongside refusals instead of treating success as no findings.
 *
 * @evidence contracts/common.md#principled-implementation The validation discriminant selects failure violations or success warnings, and append-only transfer preserves their order, values and severity.
 * @evidence contracts/common.md#clear-and-simple-design Artifact and commit gates share one outcome-to-findings adapter rather than each forgetting the successful warning branch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warnings are neither discarded nor promoted to errors and clean success contributes no invented finding.
 * @evidence contracts/common.md#meaningful-documentation States both outcome branches, warning retention and unmodified severity.
 * @evidence contracts/performance.md#efficient-algorithms For F findings the append takes O(F) time and adds F references to the caller's sink; no source value is cloned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One validation result is transferred per call and no cross-call computation is coordinated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the destination findings and their source values; this adapter retains no private collection or resource.
 */
export function appendValidation(violations: IAutoMovieConstraintViolation[], validation: IAutoMovieValidation): void {
  violations.push(...(validation.success
    ? validation.warnings ?? []
    : validation.violations));
}
