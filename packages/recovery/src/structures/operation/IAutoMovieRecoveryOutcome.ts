import type { AutoMovieRecoveryOperator } from "../../typings/AutoMovieRecoveryOperator";

/**
 * Common operation identity and diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation The producing operator and its diagnostic messages identify the actual operation and its unresolved conditions.
 * @evidence contracts/common.md#clear-and-simple-design Common identity and diagnostics are shared by value-carrying and terminated outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An operator identity or an empty diagnostic list alone does not establish complete geometry or visual quality.
 * @evidence contracts/common.md#meaningful-documentation Separates operation identity from diagnostics and from the enclosing terminal status.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The contract owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Values belong to the caller; the type acquires no resources.
 */
export interface IAutoMovieRecoveryOutcome {
  /** Actual operation identity, without a visual quality assertion. */
  operator: AutoMovieRecoveryOperator;

  /** Operation limitations and reasons, including unknown coverage. */
  diagnostics: string[];
}
