import type { AutoMovieRecoveryOperator } from "../../typings/AutoMovieRecoveryOperator";

/**
 * Common operation identity and diagnostics.
 *
 * @evidence contracts/development/design.md#principled-representation The producing operator and its diagnostic messages identify the actual operation and its unresolved conditions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Common identity and diagnostics are shared by value-carrying and terminated outcomes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An operator identity or an empty diagnostic list alone does not establish complete geometry or visual quality.
 * @evidence contracts/development/common.md#meaningful-documentation Separates operation identity from diagnostics and from the enclosing terminal status.
 */
export interface IAutoMovieRecoveryOutcome {
  /** Actual operation identity, without a visual quality assertion. */
  operator: AutoMovieRecoveryOperator;

  /** Operation limitations and reasons, including unknown coverage. */
  diagnostics: string[];
}
