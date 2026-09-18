/**
 * How many gaps one report may list before counting the rest.
 *
 * The report has to be readable at a glance to be read at all, so it names the
 * first gaps in run order and counts the remainder. The count is always stated:
 * a bound nobody can see is indistinguishable from a clean sheet.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS` bounds the named gap list while preserving a count of every omitted finding.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The sixteen-entry display limit makes report size stable without misclassifying truncated diagnostics as complete.
 * @evidence requirements/diagnostics/budgets-and-limits.md#diagnostics-truncation-and-omission `AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS` exposes the omitted-gap count beside the bounded visible list, so truncation cannot read as completeness.
 * @evidence specifications/validation-and-diagnostics/budget-and-truncation.md#validation-truncation-result The report limit preserves total omitted findings while returning a deterministic prefix of concrete gaps.
 */
export const AUTOMOVIE_ANALYSIS_REPORT_MAX_GAPS = 16;
