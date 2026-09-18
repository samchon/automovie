import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * One observed metric that exceeds its preflight inventory bound.
 *
 * @evidence requirements/rendering/budgets.md#rendering-budget-refusal Names the exact observed metric and boundary involved in a refusal.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Carries a deterministic comparison result without selecting the budget.
 * @author Samchon
 */
export interface IAutoMovieRenderObservationBreach {
  /**
   * Metric whose observation exceeded its bound.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-refusal Identifies the budget dimension responsible for the breach.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Joins the observed value to the corresponding report metric.
   */
  metric: AutoMovieRenderMetric;
  /**
   * Exact or conservative preflight estimate recorded as `finding.measured`.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Preserves the exact or conservative estimated value used for comparison.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Carries the preflight inventory bound rather than the production's maximum limit.
   */
  bound: number;
  /**
   * Renderer-observed value.
   *
   * @evidence requirements/rendering/budgets.md#rendering-runtime-budget-enforcement Preserves the runtime observation used for comparison.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Carries the observed side of the comparison.
   */
  observed: number;
}
