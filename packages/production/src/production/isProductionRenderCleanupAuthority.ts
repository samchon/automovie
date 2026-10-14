import type { AutoMovieProductionRenderCleanupAuthority } from "./AutoMovieProductionRenderCleanupAuthority";

/**
 * Narrow the three claimed cleanup-authority labels.
 *
 * @evidence contracts/common.md#principled-implementation Exact comparison accepts none, exact-remove or exact-quarantine; the host must independently justify the chosen label.
 * @evidence contracts/common.md#clear-and-simple-design One vocabulary predicate serves candidate observation admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching authority label alone is no proof of physical mutation ownership.
 * @evidence contracts/common.md#meaningful-documentation Documents vocabulary admission independently of the planner's generation/state requirements.
 * @evidence contracts/performance.md#efficient-algorithms At most three comparisons take fixed local work.
 * @evidence contracts/performance.md#reuse-equivalent-work The planner reuses this canonical label owner without retaining prior claims.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and no buffer, descriptor or task is acquired.
 */
export function isProductionRenderCleanupAuthority(value: unknown): value is AutoMovieProductionRenderCleanupAuthority {
    return value === "none" || value === "exact-remove" || value === "exact-quarantine";
}
