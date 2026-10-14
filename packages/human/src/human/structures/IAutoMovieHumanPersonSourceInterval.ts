/**
 * One boundary interval along an original parent-triangle side, as dimensionless affine parameters from the side's start corner (0) toward its end corner (1).
 *
 * @evidence contracts/common.md#principled-implementation An affine start and end on one oriented original parent side allow sorted intervals to prove exact zero-to-one boundary coverage.
 * @evidence contracts/common.md#clear-and-simple-design The containing side list owns parent-side identity, leaving each interval with only its two scalar endpoints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source fractions define coverage rather than a fitted world-distance interval for one body size.
 * @evidence contracts/common.md#meaningful-documentation The comment defines dimensionless parameters and the original side's start-to-end orientation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The dimensionless original-side coverage intervals are a type-level representation; their runtime producer owns traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request coordinator is implemented by the dimensionless original-side coverage intervals; equivalence and invalidation belong to consuming operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring dimensionless original-side coverage intervals acquires no handles or running tasks; the object owner controls ordinary data lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceInterval {
  /** Dimensionless affine parameter where the interval starts. */
  start: number;

  /** Dimensionless affine parameter where the interval ends. */
  end: number;
}
