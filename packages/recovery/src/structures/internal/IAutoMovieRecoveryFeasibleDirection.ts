import type { IAutoMovieSimplexMinimum } from "@automovie/engine";

/**
 * Owned direction and dual certificate of the tilted feasible-direction model.
 *
 * @evidence contracts/development/design.md#principled-representation The pure auxiliary-linear QP shares one tilt variable between the true objective derivative and every unweighted hard-constraint derivative; simplex dual weights retain the full authored population.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The result separates model accuracy from nonlinear acceptance and normal versus abnormal stationarity, which the nonlinear owner must evaluate in physical coordinates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither a zero step nor an exhausted convex iteration is a successful nonlinear termination, and no observation is removed.
 * @evidence contracts/development/common.md#meaningful-documentation Defines whitened coordinates, auxiliary sign, complete-row residuals and the special objective multiplier.
 */
export interface IAutoMovieRecoveryFeasibleDirection {
  /** Actual convex iteration stop, independent of the numerical certificate. */
  termination: IAutoMovieSimplexMinimum["termination"];

  /** Step in the caller's common Euclidean metric coordinates. */
  step: number[];

  /** Shared tilt; strictly negative supplies descent and active-row inwardness. */
  gamma: number;

  /** Objective multiplier first, followed by every constraint in input order. */
  multipliers: number[];

  /** Original pure QP objective, half squared step norm plus gamma. */
  objective: number;

  /** Complete simplex pricing gap, in the model's objective units. */
  gap: number;

  /** Maximum positive violation across every authored affine inequality. */
  maximumViolation: number;

  /** Maximum absolute multiplier times original affine slack. */
  complementarity: number;

  /** Largest explicitly computed Float64 affine-row summation allowance, not a nonlinear gate tolerance. */
  arithmeticAllowance: number;

  /** Absolute computed simplex mass residual, checked separately from objective gap units. */
  simplexResidual: number;

  /** Independently reconstructed maximum |d+sum(lambda*a)| in metric coordinates. */
  stationarityResidual: number;

  /** Separate Float64 reconstruction allowance for the reported metric stationarity residual. */
  stationarityAllowance: number;

  /** Actual returned-row residuals passed their dot-evaluation checks; never rewritten by reconstruction bounds. */
  returnedRowsQualified: boolean;

  /** Actual residual excesses are within separately recorded normalized-dual reconstruction bounds. */
  reconstructionRowsQualified: boolean;

  /** Infinity-norm forward-error bound to the exactly normalized stored dual aggregate. */
  aggregateAllowance: number;

  /** Error bound between computed and exactly normalized-dual minimum price. */
  minimumPriceAllowance: number;

  /** Normalized-dual gap reconstruction discrepancy bound, not an achieved requested gap. */
  gapAllowance: number;

  /** Outward upper bound for the exact normalized stored-dual gap; differs from the computed gap. */
  gapUpperBound: number;

  /** True only when gapUpperBound meets the requested target; numerical-limit qualification alone cannot set this. */
  exactGapTargetMet: boolean;

  /** A stalled direction passed numerical reconstruction checks; actual returned-row failures remain visible and this is not nonlinear convergence. */
  roundoffLimited: boolean;

  /** Gap completion passed actual-row checks, or stalled completion passed separately bounded reconstruction checks; the latter does not attain the requested sub-ulp gap. */
  certified: boolean;

  /** Actual bounded pairwise transfers. */
  iterations: number;

  /** Conservative scalar visits, including certificate reconstruction. */
  work: number;
}
