/**
 * Shared original weighted-design column norms for one current metric model.
 *
 * @evidence contracts/common.md#principled-implementation Positive finite original J column norms define physical D and D^-1 H D^-1+delta I coordinates independently of curvature and damping. They do not establish rank by themselves.
 * @evidence contracts/common.md#clear-and-simple-design A scale-only contract lets local assembly borrow precisely the arrays it needs; metric-fit additionally owns actions and independent rank diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Hessian diagonal, metric action inversion, copied stale design or damping-derived norm supplies these scales.
 * @evidence contracts/common.md#meaningful-documentation Camera coordinates precede three per landmark. Readonly arrays share their current preparation/metric lifetime without retaining the preparation closure or making numerical copies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased surface computes no norm.
 * @evidence contracts/performance.md#reuse-equivalent-work Rank-qualified GN and the optional current curvature representation share the same original D for this model only.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two readonly references expose O(C+L) existing owned norms; no extra numeric arrays, previous model or external resource is retained.
 */
export interface IAutoMovieRecoveryMapMetricScales {
  /** Positive finite original weighted-design camera column norms. */
  readonly cameraScales: readonly number[];

  /** Positive finite original weighted-design three-column norms per ordered point. */
  readonly pointScales: readonly (readonly number[])[];
}
