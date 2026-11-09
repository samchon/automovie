/**
 * Shared original weighted-design column norms for one current metric model.
 *
 * @evidence contracts/development/design.md#principled-representation Positive finite original J column norms define physical D and D^-1 H D^-1+delta I coordinates independently of curvature and damping. They do not establish rank by themselves.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A scale-only contract lets local assembly borrow precisely the arrays it needs; metric-fit additionally owns actions and independent rank diagnostics.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No Hessian diagonal, metric action inversion, copied stale design or damping-derived norm supplies these scales.
 * @evidence contracts/development/common.md#meaningful-documentation Camera coordinates precede three per landmark. Readonly arrays share their current preparation/metric lifetime without retaining the preparation closure or making numerical copies.
 */
export interface IAutoMovieRecoveryMapMetricScales {
  /** Positive finite original weighted-design camera column norms. */
  readonly cameraScales: readonly number[];

  /** Positive finite original weighted-design three-column norms per ordered point. */
  readonly pointScales: readonly (readonly number[])[];
}
