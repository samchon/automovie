import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

/**
 * One fixed-population objective and hard-constraint linearization.
 *
 * @evidence contracts/common.md#principled-implementation Common metric rows define the direction QP while original physical rows independently certify nonlinear KKT. Both lists contain the objective first and identical ordered constraints thereafter.
 * @evidence contracts/common.md#clear-and-simple-design The numerical fitting owner supplies its rank-qualified metric and retraction coordinates without exposing camera layout to the bounded nonlinear controller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Constraint derivatives are unweighted and offsets are minus actual feasible g; neither robust weighting nor the metric changes the hard feasible set.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish whitened covectors, physical tangent covectors and inverse metric action.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record itself performs no factorization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no global cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The current fitting owner retains rows and metric factors for this iteration only, under its allocation/work limits.
 */
export interface IAutoMovieRecoveryFeasibleModel {
  /** Objective gradient first, then all hard constraints, in common metric coordinates. */
  rows: readonly IAutoMovieSimplexAtom[];

  /** Same ordered rows in original physical tangent coordinates. */
  physicalRows: readonly IAutoMovieSimplexAtom[];

  /** Full physical tangent dimension, including cameras and all points. */
  width: number;

  /**
   * Convert a metric step to increments in the same physical tangent chart.
   *
   * @evidence contracts/common.md#principled-implementation The inverse of the current square, rank-qualified metric restores the coordinates used by physical derivatives and actual retraction.
   * @evidence contracts/common.md#clear-and-simple-design The model owns this action so the controller need not know camera/point ordering or factor storage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinate conversion cannot change observations, gauge, nonlinear gates or parameter dimension.
   * @evidence contracts/common.md#meaningful-documentation Input is a borrowed metric-coordinate step; output is an owned physical-coordinate vector of width entries.
   * @evidence contracts/performance.md#efficient-algorithms The camera action costs O(L*C+C^2) and analytic identity charts cost O(width); the numerical owner includes this action in its admitted model/trial work.
   * @evidence contracts/performance.md#reuse-equivalent-work Backtracks use the same current factor until an accepted state changes the model.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The current model closure retains factors for its lifetime; each returned vector transfers to the controller without mutating the borrowed step.
   */
  fromMetric: (step: readonly number[]) => number[];

  /**
   * Push a metric covector into the original physical tangent units.
   *
   * @evidence contracts/common.md#principled-implementation The inverse-transpose of fromMetric maps quadratic stationarity back without forming a normal matrix.
   * @evidence contracts/common.md#clear-and-simple-design Optional acceleration uses this current factor action; the baseline direction needs no additional action.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing support cannot be replaced by an identity action or a damped data-rank claim.
   * @evidence contracts/common.md#meaningful-documentation Borrows a metric covector and returns an owned width-vector; undefined disables optional SQP support.
   * @evidence contracts/performance.md#efficient-algorithms Camera factors cost O(L*C+C^2), bounded and charged by the optional owner's conservative action reserve.
   * @evidence contracts/performance.md#reuse-equivalent-work The same current selected triangular factor supplies this multiplication and both triangular solves.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One factor closure lives with the model; each owned returned vector is call-local.
   */
  toPhysicalCovector?: (value: readonly number[]) => number[];
}
