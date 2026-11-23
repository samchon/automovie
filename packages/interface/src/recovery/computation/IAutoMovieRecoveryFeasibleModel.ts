import type { IAutoMovieSimplexAtom } from "../../index";

/** One fixed-population objective and hard-constraint linearization.
 *
 * @evidence contracts/development/design.md#principled-representation Common metric rows define the direction QP while original physical rows independently certify nonlinear KKT. Both lists contain the objective first and identical ordered constraints thereafter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The numerical fitting owner supplies its rank-qualified metric and retraction coordinates without exposing camera layout to the bounded nonlinear controller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Constraint derivatives are unweighted and offsets are minus actual feasible g; neither robust weighting nor the metric changes the hard feasible set.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish whitened covectors, physical tangent covectors and inverse metric action.
 */
export interface IAutoMovieRecoveryFeasibleModel {
  /** Objective gradient first, then all hard constraints, in common metric coordinates. */
  rows: readonly IAutoMovieSimplexAtom[];

  /** Same ordered rows in original physical tangent coordinates. */
  physicalRows: readonly IAutoMovieSimplexAtom[];

  /** Full physical tangent dimension, including cameras and all points. */
  width: number;

  /** Convert a metric step to increments in the same physical tangent chart.
   */
  fromMetric: (step: readonly number[]) => number[];

  /** Push a metric covector into the original physical tangent units.
   */
  toPhysicalCovector?: (value: readonly number[]) => number[];
}
