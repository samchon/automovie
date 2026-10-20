import { IAutoMovieQuadraticConstraintBasis } from "./IAutoMovieQuadraticConstraintBasis";

/**
 * One equality-constrained step of the quadratic polisher, returned by
 * `solveAutoMovieQuadraticWorkingSetStep` for the current working set.
 *
 * The step minimizes the unchanged diagonal objective on the affine space where
 * every working row equals its chosen endpoint. It is a candidate only: the
 * polisher still checks every original row and the full optimality conditions,
 * and neither the basis nor this reduced solve establishes them. Exactly one of
 * three outcomes holds. A `refusal` names why no step could be represented;
 * otherwise `flatDirection` is set when the objective decreases without bound
 * on the working space; otherwise `primal` and `dual` hold the minimizer.
 * Multiplier vectors are indexed by the working rows passed to the step, with
 * zero for a row the basis found dependent.
 *
 * @evidence contracts/common.md#principled-implementation The fields are the outputs of a null-space method for an equality-constrained quadratic program as Gill and Wong (2014) describe: a feasible point on the affine space, its orthogonal null-space minimizer or an unbounded zero-curvature direction, and least-squares multipliers from the range factor.
 * @evidence contracts/common.md#clear-and-simple-design One record carries all three outcomes with nullable fields instead of a union, because the polisher reads `origin` and `normalDual` even when the step also returns a flat direction, and the basis is kept so the polisher can record its working rank.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed step reports a named refusal instead of a fallback point, and a flat direction is returned rather than truncated to an invented step length, so the polisher must find a blocking original row itself.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that it is a candidate the polisher must still admit, which field combination means which outcome, the multiplier indexing and the dependent-row zero, and per member when it is null and what it is paired with.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the factorization cost is answered on `solveAutoMovieQuadraticWorkingSetStep`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh record per polishing iteration; the next iteration's working set differs, so nothing in it is reused.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Dense vectors of the variable and working-row counts plus one basis, owned by the polisher for one iteration and dropped when the next step replaces it.
 */
export interface IAutoMovieQuadraticWorkingSetStep {
  /**
   * Minimizer of the objective on the working affine space, in original
   * variable coordinates, or null on a refusal or a flat direction. A
   * zero-curvature coordinate with zero projected gradient keeps its `origin`
   * value.
   */
  primal: number[] | null;

  /**
   * Orthogonal projection of the preceding point onto the working affine
   * space, or null when the basis refused or the projection is not finite. It
   * can be set even when the step later refuses or returns a flat direction.
   */
  origin: number[] | null;

  /**
   * Zero-curvature null-space direction along which the objective strictly
   * decreases, or null. When set, `primal` and `dual` are null and the
   * polisher must stop the ray at a blocking original row.
   */
  flatDirection: number[] | null;

  /**
   * Least-squares working-row multipliers at `origin`, solving `gradient +
   * A' y = 0` as closely as the range factor allows, or null when `origin` is
   * null or the multipliers are not finite. It is a candidate for `origin`
   * only, not the multipliers of an optimum.
   */
  normalDual: number[] | null;

  /**
   * Least-squares working-row multipliers at `primal`, or null exactly when
   * `primal` is null.
   */
  dual: number[] | null;

  /**
   * Factorization of the independent working rows, owned by this record. Its
   * own `refusal` is copied to `refusal` when it could not be built.
   */
  basis: IAutoMovieQuadraticConstraintBasis;

  /**
   * Stable name of the reason no step could be represented, such as an
   * unrepresentable origin or reduced-curvature refusal, or null when the step
   * returned a minimizer or a flat direction.
   */
  refusal: string | null;
}
